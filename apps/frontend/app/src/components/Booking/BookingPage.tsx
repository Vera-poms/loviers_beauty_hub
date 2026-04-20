import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Stack, 
  Text, 
  Image, 
  Input, 
  Button, 
  Flex, 
  Spinner,
  Textarea,
  List,
  Checkbox,
  Field,
  
 } from '@chakra-ui/react';
import { type Appointment,fetchSubServices, bookAppointment } from '../../api/client';

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  
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

  
  useEffect(() => {
    const getServiceDetails = async () => {
      try {
        const allServices = await fetchSubServices();
       
        const found = allServices.find((s: any) => s.id === serviceId || s._id === serviceId);
        setService(found);
      } catch (err) {
        console.error("Failed to load service", err);
      } finally {
        setLoading(false);
      }
    };
    if (serviceId) getServiceDetails();
  }, [serviceId]);

  
  const formatBackendDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };


  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { name, email, phone_number, addons,service_id, sub_category, service, date, time, image_url, notes, video_url } = formData;
    const appointmentData: Appointment = {
      service_id,
      sub_category,
      name,
      email,
      phone_number: phone_number,
      time,
      date: formatBackendDate(date),
      image_url: image_url,
      notes: notes,
      video_url: video_url,
      addons: addons,
      service,
    } ;

    try {
      await bookAppointment(appointmentData);
      alert("Booking successful! Check your email.");
    } catch (err) {
      alert("Booking failed.");
    }
  };

  if (loading) return <Spinner />;
  if (!service) return <Text>Service not found.</Text>;

  return (
    <Box p={8} maxW="600px" mx="auto">
      <Heading
      pb="4">
        Book an appointment
      </Heading>
      <Flex align="center" gap={4} mb={8} p={4} border="1px solid #eee" rounded="md">
        <Image src={service.image_url} boxSize="80px" objectFit="cover" rounded="md" />
        <Box>
          <Heading size="md">{service.title}</Heading>
          <Text fontSize="sm">¢{service.price} • {service.braiding_hours}</Text>
        </Box>
      </Flex>

      <form onSubmit={handleBooking}>
        <Stack gap={4}>
          <Heading size="xs">
            Tell us how to reach you
          </Heading>
          <Input 
            placeholder="Full Name" 
            required 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
          <Input 
            type="email" 
            placeholder="Email" 
            required 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
          />
          <Input 
            type="date" 
            required 
            onChange={(e) => setFormData({...formData, date: e.target.value})} 
          />
          <Input 
            type="time" 
            required 
            onChange={(e) => setFormData({...formData, time: e.target.value})} 
          />
          <Field.Root>
            <Field.Label>
              Notes
            </Field.Label>
            <Textarea 
            placeholder="Any special request or notes? eg. preferences, timing or what you're looking for?" 
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
          />
          </Field.Root>

          <Box
          p="4"
          borderWidth={1}
          rounded="lg">
            <Heading fontSize={{base: "16px", sm: "18px"}}>
              Terms and conditions
            </Heading>
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
           
          <Button 
          type="submit" 
          
          bg="purple.300" 
          color="white">
            Confirm Appointment
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default BookingPage;