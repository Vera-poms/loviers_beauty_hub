import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchMainServices,
  fetchSubServices,
  fetchServices,
  uploadMainService as apiUploadMainService,
  uploadSubService as apiUploadSubService,
  updateMainService,
  updateSubService,
  deleteMainService,
  deleteSubService,
  type UploadMainServicePayload,
  type UploadSubServicePayload
} from '../../api/client'
import {
  Box, Button, Field, Input, Heading, Stack,
  Text, Flex, Textarea, SimpleGrid, Collapsible
} from '@chakra-ui/react'
import { MdSearch, MdClose, MdEdit, MdDelete } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import AppSelect from '../AppSelect/AppSelect';

const Dashboard = () => {
  const navigate = useNavigate()
  const [mainServices, setMainServices] = useState<any[]>([])
  const [subServices, setSubServices] = useState<any[]>([])
  const [services, setServices] = useState<Record<string, string[]>>({})
  const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [createMainForm, setCreateMainForm] = useState<Partial<UploadMainServicePayload>>({})
  const [createSubForm, setCreateSubForm] = useState<Partial<UploadSubServicePayload>>({})
  const [showCreateMain, setShowCreateMain] = useState(false)
  const [showCreateSub, setShowCreateSub] = useState(false)
  const [tableQuery, setTableQuery] = useState("")
  const [showTableSearch, setShowTableSearch] = useState(false)
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const createSubCategories = createSubForm.service ? services[createSubForm.service] || [] : [] 
  const mainImageRef = useRef<HTMLInputElement>(null)
  const subImageRef = useRef<HTMLInputElement>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    message: string
    onConfirm: () => void
  }>({ open: false, message: '', onConfirm: () => {} })

  const filteredMainServices = useMemo(() => {
    
    if (!tableQuery.trim()) return mainServices
    const q = tableQuery.toLowerCase()
    return mainServices.filter(s => s.service?.toLowerCase().includes(q))
  }, [mainServices, tableQuery])

  const filteredSubServices = useMemo(() => {
    if (!tableQuery.trim()) return subServices
    const q = tableQuery.toLowerCase()
    return subServices.filter(s =>
      s.service?.toLowerCase().includes(q) || s.title?.toLowerCase().includes(q)
    )
  }, [subServices, tableQuery])

  const showMessage = (text: string, type: 'error' | 'success') => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'image' | 'video',
    setter: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setter((prev: any) => ({ ...prev, [field]: file }))
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [main, sub, services] = await Promise.all([fetchMainServices(), fetchSubServices(), fetchServices()])
        setServices(services)
        setMainServices(main)
        setSubServices(sub)
      } catch {
        showMessage('Failed to fetch services', 'error')
      }
    }
    load()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("role")
    navigate("/admin/signup")
  }

  const handleEditClick = (s: any) => {
    setEditingId(s.id)
    console.log(s.id)
    if (activeTab === "sub") {
      setEditForm({
        service:        s.service        ?? "",
        sub_category:   s.sub_category   ?? "",
        title:          s.title          ?? "",
        description:    s.description    ?? "",
        braiding_hours: s.braidingHours ?? "",
        image:          s.image      ?? null, 
        video:          s.video      ?? null,
      })
    } else if (activeTab === "main") {
      setEditForm({
        service:        s.service        ?? "",
        braiding_hours: s.braiding_hours ?? "",
        // duration:       s.duration       ?? "",
        image:          s.image      ?? null, 
        video:          s.video      ?? null,
      })
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      setBusy(true)
      if (activeTab === 'main') {
        const updated = await updateMainService(editingId, editForm as UploadMainServicePayload)
        setMainServices(prev => prev.map(s => s.service_id === editingId ? updated : s))
      } else {
        const updated = await updateSubService(editingId, editForm as UploadSubServicePayload)
        setSubServices(prev => prev.map(s => s.service_id === editingId ? updated : s))
      }
      setEditingId(null)
      setEditForm({})
      showMessage('Updated successfully', 'success')
    } catch {
      showMessage('Update failed', 'error')
    } finally { setBusy(false) }
  }

  

  const handleUploadMain = async () => {
    if (!createMainForm.service) return showMessage('Service name is required', 'error')
    if (!createMainForm.image) return showMessage('Image is required', 'error')
    try {
      setBusy(true)
      const created = await apiUploadMainService(createMainForm as UploadMainServicePayload)
      setMainServices(prev => [...prev, created])
      setCreateMainForm({})
      setShowCreateMain(false)
      if (mainImageRef.current) mainImageRef.current.value = ''
      showMessage('Main service uploaded successfully', 'success')
    } catch (e: any) {
      showMessage(e?.response?.data?.detail || 'Upload failed', 'error')
    } finally { setBusy(false) }
  }

  const handleUploadSub = async () => {
    if (!createSubForm.title || !createSubForm.description)
      return showMessage('Title and Description required', 'error')
    try {
      setBusy(true)
      const created = await apiUploadSubService(createSubForm as UploadSubServicePayload)
      setSubServices(prev => [...prev, created])
      setCreateSubForm({})
      setShowCreateSub(false)
      if (subImageRef.current) subImageRef.current.value = ''
      showMessage('Sub service uploaded', 'success')
    } catch (e: any) {
      showMessage('Upload failed', 'error')
    } finally { setBusy(false) }
  }


  const confirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, message, onConfirm })
  }

  const handleDeleteMain = async (id: string) => {
    confirm('Delete this main service?', async () => {
      setConfirmDialog(p => ({ ...p, open: false }))
      try {
        setBusy(true)
        await deleteMainService(id)
        setMainServices(prev => prev.filter(s => s.id !== id))
        if (editingId === id) { setEditingId(null); setEditForm({}) }
        showMessage('Deleted successfully', 'success')
      } catch {
        showMessage('Delete failed', 'error')
      } finally { setBusy(false) }
    })
    return
    
  }

  const handleDeleteSub = async (id: string) => {
    confirm('Delete this sub-service?', async () => {
      setConfirmDialog(p => ({ ...p, open: false }))
      try {
        setBusy(true)
        await deleteSubService(id)
        setSubServices(prev => prev.filter(s => s.id !== id))
        if (editingId === id) { setEditingId(null); setEditForm({}) }
        showMessage('Deleted successfully', 'success')
      } catch {
        showMessage('Delete failed', 'error')
      } finally { setBusy(false) }
    })
    return
  }

  


  const thStyle: React.CSSProperties = {
    borderBottom: '1px solid #eee',
    padding: '10px 6px',
    textAlign: 'center',
    background: '#fcfcfc',
    fontWeight: 'bold',
    borderRight: '1px solid #ddd',
    whiteSpace: 'nowrap',
    fontSize: '15px',
  }
  const tdStyle: React.CSSProperties = {
    padding: '10px 6px',
    borderBottom: '1px solid #eee',
    textAlign: 'center',
    borderRight: '1px solid #ddd',
    fontSize: '13px',
  }
 

  return (
    <Stack gap={4} p={{ base: 3, md: 6 }}>
      <Heading size={{ base: 'md', md: 'lg' }}>Admin Dashboard</Heading>

      {statusMessage && (
        <Box
          p="3"
          borderRadius="md"
          bg={statusMessage.type === 'error' ? 'red.50' : 'green.50'}
          borderWidth="1px"
          borderColor={statusMessage.type === 'error' ? 'red.200' : 'green.200'}
        >
          <Text
            color={statusMessage.type === 'error' ? 'red.600' : 'green.600'}
            textAlign="center"
            fontSize="sm"
          >
            {statusMessage.text}
          </Text>
        </Box>
      )}

    
      <Flex gap={2} borderBottomWidth="1px" pb={2} flexWrap="wrap">
        <Button
          size="sm"
          variant={activeTab === 'main' ? 'solid' : 'ghost'}
          onClick={() => { setActiveTab('main'); setEditingId(null); setEditForm({}) }}
        >
          Main Services
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'sub' ? 'solid' : 'ghost'}
          onClick={() => { setActiveTab('sub'); setEditingId(null); setEditForm({}) }}
        >
          Sub Services
        </Button>
      </Flex>

      
      <Flex gap={2} flexWrap="wrap" alignItems="center">
        <Button
          size="sm"
          colorPalette="black"
          onClick={() => activeTab === 'main' ? setShowCreateMain(p => !p) : setShowCreateSub(p => !p)}
        >
          + Add {activeTab === 'main' ? 'Main' : 'Sub'} Service
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowTableSearch(p => !p)}>
          {showTableSearch ? <MdClose /> : <MdSearch />}
        </Button>
        {showTableSearch && (
          <Input
            placeholder="Search..."
            size="sm"
            flex="1"
            maxW={{ base: 'full', md: '280px' }}
            value={tableQuery}
            onChange={e => setTableQuery(e.target.value)}
          />
        )}
      </Flex>

      
      {showCreateMain && activeTab === 'main' && (
        <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
          <Heading size="sm" mb={3}>New Main Service</Heading>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
            <AppSelect 
            options={Object.keys(services).map(s => ({label: s, value: s}))}
            label=""
            placeholder='Main Services'
            value={createMainForm.service ? [createMainForm.service] : []}
            onValueChange={(details) => {
              setCreateMainForm(prev => ({ 
                  ...prev, 
                  service: details.value[0] 
              }))
          }}/>
            <Field.Root>
              <Field.Label>Hours/Duration</Field.Label>
              <Input bg="white" value={createMainForm.braiding_hours || ''} onChange={e => setCreateMainForm(p => ({ ...p, braiding_hours: e.target.value }))} />
            </Field.Root>
            {/* <Field.Root>
              <Field.Label>Duration</Field.Label>
              <Input bg="white" value={createMainForm.duration || ''} onChange={e => setCreateMainForm(p => ({ ...p, duration: e.target.value }))} />
            </Field.Root> */}
            <Field.Root>
              <Field.Label>Image</Field.Label>
              <input type="file" accept="image/*" ref={mainImageRef} onChange={e => handleFileChange(e, 'image', setCreateMainForm)} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Video</Field.Label>
              <input type="file" accept="video/*" ref={mainImageRef} onChange={e => handleFileChange(e, 'video', setCreateMainForm)} />
            </Field.Root>
          </SimpleGrid>
          <Button mt={4} size="sm" loading={busy} onClick={handleUploadMain}>Upload Main Service</Button>
        </Box>
      )}

     
      {showCreateSub && activeTab === 'sub' && (
        <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
          <Heading size="sm" mb={3}>New Sub Service</Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
            <AppSelect 
              options={Object.keys(services).map(s => ({label: s, value: s}))}
              label=""
              placeholder='Main Services'
              value={createSubForm.service ? [createSubForm.service] : []}
              onValueChange={(details) => {
                setCreateSubForm(prev => ({ 
                    ...prev, 
                    service: details.value[0] 
                }))
            }}/>
            <AppSelect 
              options={createSubCategories.map(s => ({label: s, value: s}))}
              label=""
              placeholder='Sub categories'
              value={createSubForm.sub_category ? [createSubForm.sub_category] : []}
              onValueChange={(details) => {
                setCreateSubForm(prev => ({ 
                    ...prev, 
                    sub_category: details.value[0] 
                }))
            }}/>
            <Field.Root>
              <Field.Label>Title</Field.Label>
              <Input bg="white" value={createSubForm.title || ''} onChange={e => setCreateSubForm(p => ({ ...p, title: e.target.value }))} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Hours/Duration</Field.Label>
              <Input bg="white" value={createSubForm.braiding_hours || ''} onChange={e => setCreateSubForm(p => ({ ...p, braiding_hours: e.target.value }))} />
            </Field.Root>
            
            <Field.Root>
              <Field.Label>Image</Field.Label>
              <input type="file" accept="image/*" ref={subImageRef} onChange={e => handleFileChange(e, 'image', setCreateSubForm)} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Video</Field.Label>
              <input type="file" accept="video/*" ref={subImageRef} onChange={e => handleFileChange(e, 'video', setCreateSubForm)} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Description</Field.Label>
              <Textarea bg="white" value={createSubForm.description || ''} onChange={e => setCreateSubForm(p => ({ ...p, description: e.target.value }))} />
            </Field.Root>
          </SimpleGrid>
          <Button mt={4} size="sm" colorPalette="green" loading={busy} onClick={handleUploadSub}>Upload Sub Service</Button>
        </Box>
      )}

      
      <Box borderWidth="1px" borderRadius="lg" overflowX="auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Image</th>
              <th style={thStyle}>Video</th>
              <th style={thStyle}>Main Service</th>
              {activeTab === 'sub' && <th style={thStyle}>Sub Category</th>}
              {activeTab === 'sub' && <th style={thStyle}>Title</th>}
              {activeTab === 'sub' && <th style={thStyle}>Description</th>}
              <th style={thStyle}>Hours/Duration</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'main' ? filteredMainServices : filteredSubServices).map((s) => (
              <tr
                key={s.service_id}
                style={{
                  background: editingId === s.service_id ? '#eff6ff' : 'white',
                  transition: 'background 0.2s',
                }}
              >
                <td style={tdStyle}>
                  {s.image_url
                    ? <img src={s.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, margin: 'auto' }} />
                    : '—'}
                </td>
                <td style={tdStyle}>
                  {s.video_url
                    ? <video src={s.video_url} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, margin: 'auto' }} />
                    : '—'}
                </td>
                <td style={tdStyle}>{s.service}</td>
                {activeTab === 'sub' && <td style={tdStyle}>{s.sub_category}</td>}
                {activeTab === 'sub' && <td style={tdStyle}>{s.title}</td>}
                {activeTab === 'sub' && <td style={tdStyle}>{s.description}</td>}
                <td style={tdStyle}>{s.braiding_hours}</td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>
                  <Flex gap={1} justify="center">
                    <Button
                      size="xs"
                      variant={editingId === s.service_id ? 'solid' : 'outline'}
                      colorPalette={editingId === s.service_id ? 'blue' : 'gray'}
                      onClick={() => handleEditClick(s)}
                    >
                      <MdEdit />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      disabled={busy}
                      onClick={() => activeTab === 'main' ? handleDeleteMain(s.id) : handleDeleteSub(s.id)}
                    >
                      <MdDelete />
                    </Button>
                  </Flex>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      
      <Collapsible.Root open={!!editingId}>
        <Collapsible.Content>
          <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50" borderColor="blue.200">
            <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
              <Heading size="sm">
                Edit: {editForm.service || editForm.title || 'Service'}
              </Heading>
              <Button size="xs" variant="ghost" onClick={() => { setEditingId(null); setEditForm({}) }}>
                <MdClose />
              </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input
                  size="sm"
                  bg="white"
                  value={editForm.service || ''}
                  onChange={e => setEditForm((p: any) => ({ ...p, service: e.target.value }))}
                />
              </Field.Root>

              {activeTab === 'sub' && (
                <>
                  <Field.Root>
                    <Field.Label>Sub Category</Field.Label>
                    <Input
                      size="sm"
                      bg="white"
                      value={editForm.sub_category || ''}
                      onChange={e => setEditForm((p: any) => ({ ...p, sub_category: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Title</Field.Label>
                    <Input
                      size="sm"
                      bg="white"
                      value={editForm.title || ''}
                      onChange={e => setEditForm((p: any) => ({ ...p, title: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Textarea
                      size="sm"
                      bg="white"
                      value={editForm.description || ''}
                      onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))}
                    />
                  </Field.Root>
                </>
              )}

              <Field.Root>
                <Field.Label>Hours / Duration</Field.Label>
                <Input
                  size="sm"
                  bg="white"
                  value={editForm.braiding_hours || ''}
                  onChange={e => setEditForm((p: any) => ({ ...p, braiding_hours: e.target.value }))}
                />
              </Field.Root>

              {/* {activeTab === 'main' && (
                <Field.Root>
                  <Field.Label>Duration</Field.Label>
                  <Input
                    size="sm"
                    bg="white"
                    value={editForm.duration || ''}
                    onChange={e => setEditForm((p: any) => ({ ...p, duration: e.target.value }))}
                  />
                </Field.Root>
              )} */}

              <Field.Root>
                <Field.Label>Replace Image</Field.Label>
                <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'image', setEditForm)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Replace Video</Field.Label>
                <input type="file" accept="video/*" onChange={e => handleFileChange(e, 'video', setEditForm)} />
              </Field.Root>
            </SimpleGrid>

            <Flex gap={2} mt={4} flexWrap="wrap">
              <Button size="sm" colorPalette="blue" loading={busy} onClick={handleUpdate}>
                Save Changes
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditForm({}) }}>
                Cancel
              </Button>
            </Flex>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>

      <Button
      onClick={handleLogout}>
        Logout
      </Button>

      {confirmDialog.open && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setConfirmDialog(p => ({ ...p, open: false }))}
        >
          <Box
            bg="white"
            borderRadius="lg"
            p={6}
            maxW="sm"
            w="full"
            mx={4}
            boxShadow="xl"
            onClick={e => e.stopPropagation()}
          >
            <Heading size="sm" mb={2}>Confirm</Heading>
            <Text mb={6} color="gray.600">{confirmDialog.message}</Text>
            <Flex gap={3} justify="flex-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDialog(p => ({ ...p, open: false }))}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                colorPalette="red"
                onClick={() => confirmDialog.onConfirm()}
              >
                Delete
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Stack>
  )
}

export default Dashboard