import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Box, Heading, Stack, Text, Image, Input, Button, Flex, 
  Spinner, Textarea, List, Checkbox, Field 
} from '@chakra-ui/react';
import {withMask} from "use-mask-input"
import { type Appointment, fetchSubServices, fetchServices, bookAppointment } from '../../api/client';
import AppSelect from '../AppSelect/AppSelect';
import {useForm, type SubmitHandler} from 'react-hook-form'

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<Record<string, string[]>>({});
  const addonName = searchParams.get('addon');
  const serviceId = searchParams.get('service_id');
  
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    date: '', 
    time: '',
    addons: [],
    service_id: searchParams.get('service_id') || '',
    sub_category: addonName || '',
    service: '',
    price: 0,
    notes: '',
    image_url: '',
    video_url: '',
  });

  const createSubCategories = formData.service ? services[formData.service] || [] : [];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchServices();
        setServices(data);
      } catch (err) {
        console.error("Failed to fetch services", err);
      }
    };
    load();
  }, []);
  
  useEffect(() => {
    const getServiceDetails = async () => {
      try {
        const allServices = await fetchSubServices();
        const found = allServices.find((s: any) => s.id === serviceId || s._id === serviceId);
        
        if (found) {
          setService(found);
          setFormData(prev => ({
            ...prev,
            service: found.category || prev.service,
            sub_category: found.title || prev.sub_category,
            image_url: found.image_url || '',
          }));
        }
      } catch (err) {
        console.error("Failed to load service", err);
      } finally {
        setLoading(false);
      }
    };
    if (serviceId) getServiceDetails();
  }, [serviceId]);

  const {
          register,
          handleSubmit,
          watch,
          reset,
          formState: {errors}
      } = useForm<Appointment>({
          defaultValues: {
            name: '',
            email: '',
            phone_number: '',
            date: '', 
            time: '',
            addons: [],
            service_id: searchParams.get('service_id') || '',
            sub_category: addonName || '',
            service: '',
            price: 0,
            notes: '',
            image_url: '',
            video_url: '',
          }
      })

  const formatBackendDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

 const onSubmit: SubmitHandler<Appointment> = async (data) => {
    e.preventDefault();
    
   
    if (!validate()) return;

    try {
      await bookAppointment({
        ...formData,
        date: formatBackendDate(formData.date),
      });
      alert("Booking successful! Check your email.");
    } catch (err) {
      alert("Booking failed. Please check your connection.");
    }
  }
  if (loading) return <Spinner />;
  if (!service) return <Text>Service not found.</Text>;

  return (
    <Box p={8} maxW="600px" mx="auto">
      <Heading pb="4">Book an appointment</Heading>
      
      <Flex align="center" gap={4} mb={8} p={4} border="1px solid #eee" rounded="md">
        <Image src={service.image_url} boxSize="80px" objectFit="cover" rounded="md" />
        <Box>
          <Heading size="md">{service.title}</Heading>
          <Text fontSize="sm">
            ¢{service.price} • {service.braiding_hours}
          </Text>
        </Box>
      </Flex>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={4}>
          <Heading size="xs">
            Tell us how to reach you
          </Heading>
          
          
          <Field.Root invalid={!!errors.name}>
            <Input 
              placeholder="Name" 
              value={formData.name}
               {...register("name", {
                required: "Name is required"
                })}
            />
            <Field.ErrorText>
                {errors.name?.message}
            </Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.email}>
            <Input 
              type="email" 
              placeholder="Email" 
              value={formData.email}
              {...register("email", {
                required: "Email is required",
                pattern: {
                    value: /^[A-Za-z\._\-0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/,
                    message: "Invalid email address"
                }
              })} 
            />
            <Field.ErrorText>
                {errors.email?.message}
            </Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.phone_number}>
            <Input 
              placeholder="Phone number" 
              value={formData.phone_number}
              ref={withMask("(020) 000 0000")}  
            />
            <Field.ErrorText>
                {errors.phone_number?.message}
            </Field.ErrorText>
          </Field.Root>

          <Flex gap={4}>
            <Field.Root invalid={!!errors.date}>
              <Input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})} 
              />
              <Field.ErrorText>
                {errors.date?.message}
            </Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.time}>
              <Input 
                type="time" 
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})} 
              />
              <Field.ErrorText>
                {errors.time?.message}
            </Field.ErrorText>
            </Field.Root>
          </Flex>

          <Field.Root invalid={!!errors.service}>
            <AppSelect 
              options={Object.keys(services).map(s => ({label: s, value: s}))}
              placeholder='Main Services'
              value={formData.service ? [formData.service] : []}
              onValueChange={(details) => setFormData(prev => ({ ...prev, service: details.value[0] }))}
            />
            <Field.ErrorText>
                {errors.service?.message}
            </Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.sub_category}>
            <AppSelect 
              options={createSubCategories.map(s => ({label: s, value: s}))}
              placeholder='Sub categories'
              value={formData.sub_category ? [formData.sub_category] : []}
              onValueChange={(details) => setFormData(prev => ({ ...prev, sub_category: details.value[0] }))}
            />
            <Field.ErrorText>
                {errors.sub_category?.message}
            </Field.ErrorText>
          </Field.Root>

          <Field.Root>
            <Field.Label>Notes</Field.Label>
            <Textarea 
              placeholder="Any special requests?" 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})} 
            />
          </Field.Root>

          <Box p="4" borderWidth={1} rounded="lg">
            <Heading fontSize={{base: "16px", sm: "18px"}}>Terms and conditions</Heading>
            <List.Root fontSize="xs"
            p="2"
            >
              <List.Item>
                A non-refundable deposit of GH¢30 for lash and GH¢50 for braids secures your booking. Your appointment is confirmed once the deposit is paid.
              </List.Item>
              <List.Item>
                <strong>Note:</strong>{" "} All listed prices cover workmanship only.
              </List.Item>
              <List.Item>
                We only accept Mobile Money, no cash payments please.
              </List.Item>
            </List.Root>

            <Checkbox.Root
            colorPalette="purple"
            required>
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>
                I agree to the  
                {" "}<strong>
                  terms and conditions</strong> above
              </Checkbox.Label>
            </Checkbox.Root>
          </Box>
           
          <Button type="submit" bg="purple.300" color="white" _hover={{ bg: "purple.400" }}>
            Confirm Appointment
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default BookingPage;



// import { useState, useEffect } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import { 
//   Box, 
//   Heading, 
//   Stack, 
//   Text, 
//   Image, 
//   Input, 
//   Button, 
//   Flex, 
//   Spinner,
//   Textarea,
//   List,
//   Checkbox,
//   Field,
  
//  } from '@chakra-ui/react';
// import { type Appointment,fetchSubServices,fetchServices, bookAppointment } from '../../api/client';
// import AppSelect from '../AppSelect/AppSelect';

// const BookingPage = () => {
//   const [searchParams] = useSearchParams();
//   const [services, setServices] = useState<Record<string, string[]>>({})
//   const addonName = searchParams.get('addon');
//   const serviceId = searchParams.get('service_id');
//   const [service, setService] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone_number: '',
//     date: '', 
//     time: '',
//     addons: [],
//     service_id: searchParams.get('service_id') || '',
//     sub_category: addonName || '',
//     service: '',
//     price: 0,
//     notes: '',
//     image_url: '',
//     video_url: '',
//   });
//   const createSubCategories = formData.service ? services[formData.service] || [] : [] 

//   useEffect(() => {
//       const load = async () => {
//         try {
//           const services = await fetchServices()
//           setServices(services)
//         } catch {
//           // showMessage('Failed to fetch services', 'error')
//         }
//       }
//       load()
//     }, [])
  
//   useEffect(() => {
//     const getServiceDetails = async () => {
//       try {
//         const allServices = await fetchSubServices();
       
//         const found = allServices.find((s: any) => s.id === serviceId || s._id === serviceId);
        
//         if (found) {
//           setService(found);
//           setFormData(prev => ({
//             ...prev,
//             service: found.category || '', 
//             sub_category: found.title || addonName || '',
//             image_url: found.image_url || '',
//           }));
//         }
//       } catch (err) {
//         console.error("Failed to load service", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (serviceId) getServiceDetails();
//   }, [serviceId, addonName]);

  
//   const formatBackendDate = (dateStr: string) => {
//     if (!dateStr) return '';
//     const [year, month, day] = dateStr.split('-');
//     return `${day}-${month}-${year}`;
//   };


//   const handleBooking = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     const { name, email, phone_number, addons,service_id, sub_category, service, date, time, image_url, notes, video_url } = formData;

//     const appointmentData: Appointment = {
//       service_id,
//       sub_category,
//       name,
//       email,
//       phone_number: phone_number,
//       time,
//       date: formatBackendDate(date),
//       image_url: image_url,
//       notes: notes,
//       video_url: video_url,
//       addons: addons,
//       service,
//     } ;

//     try {
//       await bookAppointment(appointmentData);
//       alert("Booking successful! Check your email.");
//     } catch (err) {
//       alert("Booking failed.");
//     }
//   };

//   if (loading) return <Spinner />;
//   if (!service) return <Text>Service not found.</Text>;

//   return (
//     <Box p={8} maxW="600px" mx="auto">
//       <Heading
//       pb="4">
//         Book an appointment
//       </Heading>
//       <Flex align="center" gap={4} mb={8} p={4} border="1px solid #eee" rounded="md">
//         <Image src={service.image_url} boxSize="80px" objectFit="cover" rounded="md" />
//         <Box>
//           <Heading size="md">{service.title}</Heading>
//           <Text fontSize="sm">¢{service.price} • {service.braiding_hours}</Text>
//         </Box>
//       </Flex>

//       <form onSubmit={handleBooking}>
//         <Stack gap={4}>
//           <Heading size="xs">
//             Tell us how to reach you
//           </Heading>
//           <Input 
//             placeholder="Full Name" 
//             required 
//             onChange={(e) => setFormData({...formData, name: e.target.value})} 
//           />
//           <Input 
//             type="email" 
//             placeholder="Email" 
//             required 
//             onChange={(e) => setFormData({...formData, email: e.target.value})} 
//           />
//           <Input 
//             type="phone" 
//             placeholder="Phone number" 
//             required 
//             onChange={(e) => setFormData({...formData, phone_number: e.target.value})} 
//           />
//           <Input 
//             type="date" 
//             required 
//             onChange={(e) => setFormData({...formData, date: e.target.value})} 
//           />
//           <Input 
//             type="time" 
//             required 
//             onChange={(e) => setFormData({...formData, time: e.target.value})} 
//           />
//           <AppSelect 
//             options={Object.keys(services).map(s => ({label: s, value: s}))}
//             label=""
//             placeholder='Main Services'
//             value={formData.service ? [formData.service] : []}
//             onValueChange={(details) => {
//               setFormData(prev => ({ 
//                   ...prev, 
//                   service: details.value[0] 
//               }))
//           }}/>
//           <AppSelect 
//             options={createSubCategories.map(s => ({label: s, value: s}))}
//             label=""
//             placeholder='Sub categories'
//             value={formData.sub_category ? [formData.sub_category] : []}
//             onValueChange={(details) => {
//               setFormData(prev => ({ 
//                   ...prev, 
//                   sub_category: details.value[0] 
//               }))
//           }}/>
//           <Field.Root>
//             <Field.Label>
//               Notes
//             </Field.Label>
//             <Textarea 
//             placeholder="Any special request or notes? eg. preferences, timing or what you're looking for?" 
//             onChange={(e) => setFormData({...formData, notes: e.target.value})} 
//           />
//           </Field.Root>

//           <Box
//           p="4"
//           borderWidth={1}
//           rounded="lg">
//             <Heading fontSize={{base: "16px", sm: "18px"}}>
//               Terms and conditions
//             </Heading>
//             <List.Root fontSize="xs"
//             p="2"
//             >
//               <List.Item>
//                 A non-refundable deposit of GH¢30 for lash and GH¢50 for braids secures your booking. Your appointment is confirmed once the deposit is paid.
//               </List.Item>
//               <List.Item>
//                 <strong>Note:</strong>{" "} All listed prices cover workmanship only.
//               </List.Item>
//               <List.Item>
//                 We only accept Mobile Money, no cash payments please.
//               </List.Item>
//             </List.Root>

//             <Checkbox.Root
//             colorPalette="purple"
//             required>
//               <Checkbox.HiddenInput />
//               <Checkbox.Control />
//               <Checkbox.Label>
//                 I agree to the  
//                 {" "}<strong>
//                   terms and conditions</strong> above
//               </Checkbox.Label>
//             </Checkbox.Root>
//           </Box>
           
//           <Button 
//           type="submit" 
          
//           bg="purple.300" 
//           color="white">
//             Confirm Appointment
//           </Button>
//         </Stack>
//       </form>
//     </Box>
//   );
// };

// export default BookingPage;