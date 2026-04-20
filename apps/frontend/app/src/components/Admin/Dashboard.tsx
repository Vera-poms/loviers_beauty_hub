import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchMainServices,
  fetchSubServices,
  uploadMainService as apiUploadMainService,
  uploadSubService as apiUploadSubService,
  updateMainService,
  updateSubService,
  deleteMainService,
  deleteSubService,
  type UploadMainServicePayload,
  type UploadSubServicePayload
} from '../../api/client'
import { Box, Button, Field, Input, Heading, Stack, Text, Flex, Textarea, SimpleGrid } from '@chakra-ui/react'
import { MdSearch, MdClose, MdEdit, MdDelete } from 'react-icons/md'

const Dashboard = () => {
  
  const [mainServices, setMainServices] = useState<any[]>([])
  const [subServices, setSubServices] = useState<any[]>([])  
  const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main')

  const [editMainServiceId, setEditMainServiceId] = useState<string | null>(null)
  const [editSubServiceId, setEditSubServiceId] = useState<string | null>(null)
  const [editMain, setEditMain] = useState<Partial<UploadMainServicePayload>>({})
  const [editSub, setEditSub] = useState<Partial<UploadSubServicePayload>>({})

  const [createMainForm, setCreateMainForm] = useState<Partial<UploadMainServicePayload>>({})
  const [createSubForm, setCreateSubForm] = useState<Partial<UploadSubServicePayload>>({})
  const [showCreateMain, setShowCreateMain] = useState(false)
  const [showCreateSub, setShowCreateSub] = useState(false)

  const [tableQuery, setTableQuery] = useState("")
  const [showTableSearch, setShowTableSearch] = useState(false)
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "error" | "success" } | null>(null)

  
  const mainImageRef = useRef<HTMLInputElement>(null)
  const subImageRef = useRef<HTMLInputElement>(null)

 
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

  
  const showMessage = (text: string, type: "error" | "success") => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'video', setter: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await fileToBase64(file)
      setter((prev: any) => ({ ...prev, [field]: base64 }))
    } catch (err) {
      showMessage("Failed to process file", "error")
    }
  }

 
  useEffect(() => {
    const load = async () => {
      try {
        const [main, sub] = await Promise.all([fetchMainServices(), fetchSubServices()])
        setMainServices(main)
        setSubServices(sub)
      } catch (e) {
        showMessage("Failed to fetch services", "error")
      }
    }
    load()
  }, [])

  
  const handleUploadMain = async () => {
    if (!createMainForm.service || !createMainForm.braiding_hours) 
      return showMessage("Service name and hours are required", "error")
    if (!createMainForm.image) return showMessage("Image is required", "error")

    try {
      setBusy(true)
      const created = await apiUploadMainService(createMainForm as UploadMainServicePayload)
      setMainServices(prev => [...prev, created])
      setCreateMainForm({})
      setShowCreateMain(false)
      if (mainImageRef.current) mainImageRef.current.value = ""
      showMessage("Main service uploaded successfully", "success")
    } catch (e: any) {
      showMessage(e?.response?.data?.detail || "Upload failed", "error")
    } finally { setBusy(false) }
  }

  const handleUpdateMain = async () => {
    if (!editMainServiceId) return
    try {
      setBusy(true)
      const updated = await updateMainService(editMainServiceId, editMain as UploadMainServicePayload)
      setMainServices(prev => prev.map(s => s.service_id === editMainServiceId ? updated : s))
      setEditMainServiceId(null)
      showMessage("Updated successfully", "success")
    } catch (e: any) {
      showMessage("Update failed", "error")
    } finally { setBusy(false) }
  }

  const handleDeleteMain = async (id: string) => {
    if (!window.confirm("Delete this service?")) return
    try {
      setBusy(true)
      await deleteMainService(id)
      setMainServices(prev => prev.filter(s => s.service_id !== id))
      showMessage("Deleted successfully", "success")
    } catch (e: any) {
      showMessage("Delete failed", "error")
    } finally { setBusy(false) }
  }

  
  const handleUploadSub = async () => {
    if (!createSubForm.title || !createSubForm.description) 
        return showMessage("Title and Description required", "error")
    
    try {
      setBusy(true)
      const created = await apiUploadSubService(createSubForm as UploadSubServicePayload)
      setSubServices(prev => [...prev, created])
      setCreateSubForm({})
      setShowCreateSub(false)
      if (subImageRef.current) subImageRef.current.value = ""
      showMessage("Sub service uploaded", "success")
    } catch (e: any) {
      showMessage("Upload failed", "error")
    } finally { setBusy(false) }
  }

  const handleUpdateSub = async () => {
    if (!editSubServiceId) return
    try {
      setBusy(true)
      const updated = await updateSubService(editSubServiceId, editSub as UploadSubServicePayload)
      setSubServices(prev => prev.map(s => s.service_id === editSubServiceId ? updated : s))
      setEditSubServiceId(null)
      showMessage("Updated successfully", "success")
    } catch (e: any) {
      showMessage("Update failed", "error")
    } finally { setBusy(false) }
  }

  const handleDeleteSub = async (id: string) => {
    if (!window.confirm("Delete this sub-service?")) return
    try {
      setBusy(true)
      await deleteSubService(id)
      setSubServices(prev => prev.filter(s => s.service_id !== id))
      showMessage("Deleted successfully", "success")
    } catch (e: any) {
        showMessage("Delete failed", "error")
    } finally { setBusy(false) }
  }

  
  const thStyle: React.CSSProperties = { borderBottom: "1px solid #eee", padding: "12px 8px", textAlign: "left", fontWeight: "bold", background: "#fcfcfc" }
  const tdStyle: React.CSSProperties = { padding: "12px 8px", borderBottom: "1px solid #eee" }

  return (
    <Stack gap={6} p={6}>
      <Heading>Admin Dashboard</Heading>

      {statusMessage && (
        <Box p="3" borderRadius="md" bg={statusMessage.type === "error" ? "red.50" : "green.50"} border="1px solid" borderColor={statusMessage.type === "error" ? "red.200" : "green.200"}>
          <Text color={statusMessage.type === "error" ? "red.600" : "green.600"} textAlign="center">{statusMessage.text}</Text>
        </Box>
      )}

      
      <Flex gap={2} borderBottomWidth="1px" pb={2}>
        <Button size="sm" variant={activeTab === 'main' ? 'solid' : 'ghost'} onClick={() => setActiveTab('main')}>Main Services</Button>
        <Button size="sm" variant={activeTab === 'sub' ? 'solid' : 'ghost'} onClick={() => setActiveTab('sub')}>Sub Services</Button>
      </Flex>

      <Flex gap={2} align="center">
        <Button size="sm" variant="outline" onClick={() => setShowTableSearch(!showTableSearch)}>
          {showTableSearch ? <MdClose /> : <MdSearch />}
        </Button>
        {showTableSearch && <Input placeholder="Search name..." size="sm" maxW="300px" value={tableQuery} onChange={e => setTableQuery(e.target.value)} />}
        <Button size="sm" ml="auto" colorPalette="blue" onClick={() => activeTab === 'main' ? setShowCreateMain(!showCreateMain) : setShowCreateSub(!showCreateSub)}>
          + Add {activeTab === 'main' ? 'Main' : 'Sub'} Service
        </Button>
      </Flex>

      {showCreateMain && activeTab === 'main' && (
        <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50">
          <Heading size="xs" mb={3}>New Main Service</Heading>
          <SimpleGrid columns={[1, 2]} gap={4}>
            <Field.Root>
                <Field.Label>Name</Field.Label><Input bg="white" value={createMainForm.service || ''} onChange={e => setCreateMainForm(p => ({...p, service: e.target.value}))} /></Field.Root>
            <Field.Root>
                <Field.Label>Hours</Field.Label><Input bg="white" value={createMainForm.braiding_hours || ''} onChange={e => setCreateMainForm(p => ({...p, braiding_hours: e.target.value}))} /></Field.Root>
            <Field.Root>
                <Field.Label>Image</Field.Label>
                <input type="file" accept="image/*" ref={mainImageRef} onChange={e => handleFileChange(e, 'image', setCreateMainForm)} /></Field.Root>
          </SimpleGrid>
          <Button mt={4} size="sm" loading={busy} onClick={handleUploadMain}>
            Upload Main Service
          </Button>
        </Box>
      )}

      {showCreateSub && activeTab === 'sub' && (
        <Box p={4} borderWidth="1px" borderRadius="md" bg="green.50">
          <Heading size="xs" mb={3}>New Sub Service</Heading>
          <SimpleGrid columns={[1, 2, 3]} gap={4}>
            <Field.Root>
                <Field.Label>Main Category</Field.Label><Input bg="white" value={createSubForm.service || ''} onChange={e => setCreateSubForm(p => ({...p, service: e.target.value}))} /></Field.Root>
            <Field.Root>
                <Field.Label>Sub Category</Field.Label>
                <Input bg="white" value={createSubForm.sub_category || ''} onChange={e => setCreateSubForm(p => ({...p, sub_category: e.target.value}))} /></Field.Root>
            <Field.Root>
                <Field.Label>Title</Field.Label>
                <Input bg="white" value={createSubForm.title || ''} onChange={e => setCreateSubForm(p => ({...p, title: e.target.value}))} />
            </Field.Root>
            <Field.Root>
                <Field.Label>Hours</Field.Label>
                <Input bg="white" value={createSubForm.braiding_hours || ''} onChange={e => setCreateSubForm(p => ({...p, braiding_hours: e.target.value}))} />
            </Field.Root>
            <Field.Root>
                <Field.Label>Image</Field.Label>
                <Input type="file" accept="image/*" ref={subImageRef} onChange={e => handleFileChange(e, 'image', setCreateSubForm)} /></Field.Root>
            <Field.Root><Field.Label>Description</Field.Label><Textarea bg="white" value={createSubForm.description || ''} onChange={e => setCreateSubForm(p => ({...p, description: e.target.value}))} /></Field.Root>
          </SimpleGrid>
          <Button mt={4} size="sm" colorPalette="green" loading={busy} onClick={handleUploadSub}>Upload Sub Service</Button>
        </Box>
      )}

      <Box borderWidth="1px" borderRadius="lg" overflowX="auto">
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Image</th>
              <th style={thStyle}>Main Service</th>
              {activeTab === 'sub' && <th style={thStyle}>Sub Category</th>}
              {activeTab === 'sub' && <th style={thStyle}>Title</th>}
              <th style={thStyle}>Hours</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'main' ? filteredMainServices : filteredSubServices).map((s) => {
              const isEditing = activeTab === 'main' ? editMainServiceId === s.service_id : editSubServiceId === s.service_id;
              
              return (
                <tr key={s.service_id}>
                  <td style={tdStyle}>
                    {s.image ? <img src={s.image} alt="" style={{ width: "45px", height: "45px", objectFit: "cover", borderRadius: "4px" }} /> : "-"}
                  </td>
                  <td style={tdStyle}>
                    {isEditing ? 
                      <Input size="xs" value={activeTab === 'main' ? editMain.service : editSub.service} onChange={e => activeTab === 'main' ? setEditMain(p => ({...p, service: e.target.value})) : setEditSub(p => ({...p, service: e.target.value}))} /> 
                      : s.service
                    }
                  </td>
                  {activeTab === 'sub' && (
                    <td style={tdStyle}>
                       {isEditing ? <Input size="xs" value={editSub.sub_category} onChange={e => setEditSub(p => ({...p, sub_category: e.target.value}))} /> : s.sub_category}
                    </td>
                  )}
                  {activeTab === 'sub' && (
                    <td style={tdStyle}>
                       {isEditing ? <Input size="xs" value={editSub.title} onChange={e => setEditSub(p => ({...p, title: e.target.value}))} /> : s.title}
                    </td>
                  )}
                  <td style={tdStyle}>
                    {isEditing ? 
                      <Input size="xs" value={activeTab === 'main' ? editMain.braiding_hours : editSub.braiding_hours} onChange={e => activeTab === 'main' ? setEditMain(p => ({...p, braiding_hours: e.target.value})) : setEditSub(p => ({...p, braiding_hours: e.target.value}))} /> 
                      : s.braiding_hours
                    }
                  </td>
                  <td style={tdStyle}>
                    <Flex gap={1}>
                      {isEditing ? (
                        <Button size="xs" colorPalette="blue" loading={busy} onClick={activeTab === 'main' ? handleUpdateMain : handleUpdateSub}>Save</Button>
                      ) : (
                        <Button size="xs" variant="outline" onClick={() => {
                          if (activeTab === 'main') { setEditMainServiceId(s.service_id); setEditMain(s); }
                          else { setEditSubServiceId(s.service_id); setEditSub(s); }
                        }}><MdEdit /></Button>
                      )}
                      <Button size="xs" variant="ghost" colorPalette="red" disabled={busy} onClick={() => activeTab === 'main' ? handleDeleteMain(s.service_id) : handleDeleteSub(s.service_id)}><MdDelete /></Button>
                    </Flex>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Box>
    </Stack>
  )
}

export default Dashboard