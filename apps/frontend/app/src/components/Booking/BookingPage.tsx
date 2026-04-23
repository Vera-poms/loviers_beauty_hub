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
  Center,
  Dialog
} from '@chakra-ui/react';
import { type Appointment, fetchSubServices, fetchServices, bookAppointment } from '../../api/client';
import AppSelect from '../AppSelect/AppSelect';
import { useForm, type SubmitHandler } from 'react-hook-form'; 

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<Record<string, string[]>>({});
  const addonName = searchParams.get('addon');
  const serviceId = searchParams.get('service_id');
  const [serviceDetails, setServiceDetails] = useState<any>(null);
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
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

  const showMessage = (text: string, type: 'error' | 'success') => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<Appointment>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      date: '', 
      time: '',
      addons: [],
      service_id: searchParams.get('service_id') || '',
      sub_category: '',
      service: '',
      price: 0,
      notes: '',
      image_url: '',
      video_url: '',
    }
  });

  
  const createSubCategories = formData.service ? services[formData.service] || [] : [] 

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchServices();
        setServices(data);
      } catch (err) {
        showMessage(`Failed to fetch services ${err}`, "error")
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
          setServiceDetails(found);
          setFormData(prev => ({
            ...prev,
            service: found.service,
            sub_category: found.sub_category,
            image_url: found.image_url || '',
            addons: found.addons || ''
          }));
          setValue("service", found.service || '');
          setValue("sub_category", found.sub_category || '');
          setValue("addons", found.addons || ''); 
          if (addonName && found.addons?.some((a: any) => a.name === addonName)) {
            setSelectedAddons([addonName]);
            setValue("addons", [addonName]); 
          }
        }
      } catch (err) {
        showMessage(`Failed to load services ${err}`, "error")
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

  const onSubmit: SubmitHandler<Appointment> = async (data) => {
    try {
      await bookAppointment({
        ...data,
        date: formatBackendDate(data.date),
      });
      showMessage("Booking successful! Check your email.", "success")
      setShowSuccess(true);
      
      
    } catch (err: any) {
      const status = err.response?.status
      if (status === 422){
        showMessage("Missing field(s)! Check and fill all fields.", "error")
      }
    }
  };

  const contactFields: {
    name: keyof Appointment;
    placeholder: string;
    type?: string;
    rules: object;
  }[] = [
    {
      name: "name",
      placeholder: "Name",
      rules: { required: "Name is required" },
    },
    {
      name: "email",
      placeholder: "Email",
      type: "email",
      rules: {
        required: "Email is required",
        pattern: {
          value: /^[A-Za-z\._\-0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/,
          message: "Invalid email address",
        },
      },
    },
    {
      name: "phone_number",
      placeholder: "Phone number",
      rules: { required: "Phone number is required" },
    },
  ];

  const dateFields: { name: keyof Appointment; type: string; rules: object }[] = [
    { name: "date", type: "date", rules: { required: "Date is required" } },
    { name: "time", type: "time", rules: { required: "Time is required" } },
  ];

  const selectFields = [
    {
      name: "service" as keyof Appointment,
      placeholder: "Main Services",
      options: Object.keys(services).map(s => ({ label: s, value: s })),
      value: formData.service ? [formData.service] : [],
      onValueChange: (details: any) => {
        setFormData(prev => ({ ...prev, service: details.value[0] }));
        setValue("service", details.value[0]);
      },
    },
    {
      name: "sub_category" as keyof Appointment,
      placeholder: "Sub categories",
      options: createSubCategories.map(s => ({ label: s, value: s })),
      value: formData.sub_category ? [formData.sub_category] : [],
      onValueChange: (details: any) => {
        setFormData(prev => ({ ...prev, sub_category: details.value[0] }));
        setValue("sub_category", details.value[0]);
      },
    },
    ...(serviceDetails?.addons?.length > 0
      ? [{
          name: "addons" as keyof Appointment,
          placeholder: "Select addons",
          options: serviceDetails.addons.map((a: any) => ({
            label: `${a.name} — GH¢${a.price}`,
            value: a.name,
          })),
          value: selectedAddons,
          onValueChange: (details: any) => {
            setSelectedAddons(details.value);
            setValue("addons", details.value);
          },
        }]
      : []),
  ];

  if (loading) return <Center pt="50%"><Spinner color="purple.600"/></Center>
  if (!serviceDetails) return <Text>Service not found.</Text>;

  return (
    <Box p={8} maxW="600px" mx="auto">
      <Heading pb="4">Book an appointment</Heading>
      
      <Flex align="center" gap={4} mb={8} p={4} 
      borderWidth={1} 
      borderColor="purple.400"
      borderRadius="xl">
        <Image src={serviceDetails.image_url} boxSize="80px" objectFit="cover" rounded="md" />
        <Box>
          <Heading size="md">{serviceDetails.title}</Heading>
          <Text fontSize="sm">
            GH¢{serviceDetails.price} • {serviceDetails.braiding_hours}
          </Text>
        </Box>
      </Flex>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={4}>
          <Heading size="md">
            Select a service
          </Heading>
          {/* <input type="hidden" {...register("addons")} /> */}
          {selectFields.map(({ name, placeholder, options, value, onValueChange }) => (
            <Field.Root key={name} invalid={!!errors[name]}>
              <AppSelect
                options={options}
                placeholder={placeholder}
                value={value}
                onValueChange={onValueChange}
                borderWidth="1px" 
                borderColor="purple.400"
                rounded="2xl"
                paddingY="2px"
                label=""
                focusRingColor='purple.600'
              />
              <Field.ErrorText>{errors[name]?.message}</Field.ErrorText>
            </Field.Root>
          ))}

          <Flex gap={4}>
            {dateFields.map(({ name, type, rules }) => (
              <Field.Root key={name} invalid={!!errors[name]}>
                <Input 
                borderWidth={1} 
                borderColor="purple.400"
                borderRadius="md"
                rounded="2xl"
                type={type} {...register(name, rules)} />
                <Field.ErrorText>{errors[name]?.message}</Field.ErrorText>
              </Field.Root>
            ))}
          </Flex>

          <Heading size="md">
            Tell us how to reach you
          </Heading>
          {contactFields.map(({ name, placeholder, type, rules }) => (
            <Field.Root key={name} 
            invalid={!!errors[name]}>
              <Input
                borderWidth={1} 
                borderColor="purple.400"
                borderRadius="md"
                rounded="2xl"
                type={type || "text"}
                placeholder={placeholder}
                {...register(name, rules)}
              />
              <Field.ErrorText>{errors[name]?.message}</Field.ErrorText>
            </Field.Root>
          ))}

          <Box p="4" 
          borderWidth={1} 
          borderColor="purple.400"
          // borderRadius="md"
          rounded="lg">
            <Heading fontSize={{base: "16px", sm: "18px"}}>Terms and conditions</Heading>
            <List.Root fontSize="xs"
            p="2"
            >
              <List.Item>
                A non-refundable deposit of {" "}<strong>GH¢30</strong>{" "} for lash and {" "}<strong>GH¢50</strong>{" "} for braids secures your booking. Your appointment is confirmed once the deposit is paid.
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
            
          <Button type="submit" 
          bg={isValid ? "purple.600" : "purple.300"}
          color="white"
          _hover={{ bg: isValid ? "purple.700" : "purple.400" }}>
            Confirm Appointment
          </Button>
        </Stack>
      </form>

      {statusMessage && (
        <Box
          mt="4"
          p="3"
          position="fixed"
          left="50%"
          top="50%"
          transform="translate(-50%, -50%)"
          zIndex={2000}
          animation={"scale-fade-in"}
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

      <Dialog.Root open={showSuccess} onOpenChange={(e) => setShowSuccess(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
        <Dialog.Content mx={6} maxW="420px">
          <Dialog.Header>
            <Dialog.Title>Booking Confirmed! 🎉</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Text>Your appointment has been booked successfully.</Text>
            <Text mt={2}>Check your email for a confirmation code to finalize your booking.</Text>
          </Dialog.Body>
          <Dialog.Footer>
            <Button 
              bg="purple.500" 
              color="white" 
              _hover={{ bg: "purple.600" }} 
              onClick={() => setShowSuccess(false)}
            >
              Done
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default BookingPage;