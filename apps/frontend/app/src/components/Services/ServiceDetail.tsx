import { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Heading, 
  IconButton, 
  Carousel, 
  Button, 
  Stack,
  Center,
  Spinner
 } from '@chakra-ui/react';
import { ServiceCard } from './ServiceCard';
// import { robotoSerif, montserrat } from '@/app/font';
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay } from 'react-icons/lu';
import Navbar from '../Navbar/Navbar';
import {
  fetchMainServices,
  fetchSubServices
} from '../../api/client'


interface Subcategory {
    id: number;
    name: string;
    image: string | null;
}

interface ServiceData {
  id: number;
  image: string | null;
  video: string | null;
  title: string;
  description: string;
  braidingHours: string;
}

interface ServiceDetailsProps {
  service: ServiceData;
  subcategories: Subcategory[];
}

const ServiceDetails = ({ service, subcategories }: ServiceDetailsProps) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [services, setServices] = useState<any>(null)
  const [subServices, setSubServices] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState<{text: string, type: "error" | "success"} | null>(null)
  const showMessage = (text: string, type: "error" | "success") => {
    setStatusMessage({text, type})
    setTimeout(() => setStatusMessage(null), 5000)
  }


  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchMainServices()
        const subData = await fetchSubServices()
        setServices(data)
        setSubServices(subData)
      } catch (error) {
        showMessage(`Error fetching services: ${error}`, "error")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <Center pt="50%"><Spinner color="purple.600"/></Center>

  return (
    <Box>
      <Navbar />
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
        <Carousel.Root
          autoplay={{ delay: 7000 }}
          slideCount={services.length}
          mx="auto"
          w="100vw"
        >
          <Carousel.ItemGroup>
            {services.map((video: any, index: number) => (
          <Carousel.Item key={video.id} index={index}>
              <Box 
              position="relative"
              w="100%" 
              h={{base: "300px", sm: "400px", md: "600px"}} 
              bg="gray.200"
              overflow="hidden">
                
                <video
                  src={video.video_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  width="100%"
                  height="100%"
                  style={{
                    objectFit: 'cover',
                  }}
                />
               
                <Flex
                  position="absolute"
                  bottom="10px"
                  left="20px"
                  h={{ sm: "80px"}}
                  p="4"
                  rounded="lg"
                  w={{base:"50%"}}
                  bg="blackAlpha.600"
                  direction="column"
                  gap="1"
                >
                  <Heading
                    fontSize="22px"
                    color="white"
                    // fontFamily={robotoSerif.style.fontFamily}
                  >
                    {video.service}
                  </Heading>
                  <Text fontSize="12px" color="whiteAlpha.800">
                    {service.description}
                  </Text>
                </Flex>
              </Box>
            </Carousel.Item>
            ))}
          </Carousel.ItemGroup>

          <Carousel.Control justifyContent="center" gap="4">
            <Carousel.PrevTrigger asChild>
              <IconButton size="xs" variant="ghost">
                <LuChevronLeft />
              </IconButton>
            </Carousel.PrevTrigger>
            <Carousel.AutoplayTrigger asChild>
              <IconButton aria-label="Toggle autoplay" size="sm" variant="ghost">
                <Carousel.AutoplayIndicator
                  paused={<LuPause />}
                  play={<LuPlay />}
                />
              </IconButton>
            </Carousel.AutoplayTrigger>
            <Carousel.NextTrigger asChild>
              <IconButton size="xs" variant="ghost">
                <LuChevronRight />
              </IconButton>
            </Carousel.NextTrigger>
          </Carousel.Control>
        </Carousel.Root>

      
        
        
        <Box px="4" py="4">
          <Flex gap="2" overflowX="auto" >
            <Button
              size="sm"
              variant={activeTab === 'all' ? 'solid' : 'outline'}
              bg={activeTab === "all"? "purple.600" : ''}
              onClick={() => setActiveTab('all')}
            //   fontFamily={montserrat.style.fontFamily}
            >
              All
            </Button>
            {subServices.map((sub: any) => (
              <Button
                key={sub.id}
                size="sm"
                variant={activeTab === sub.sub_category ? 'solid' : 'outline'}
                onClick={() => setActiveTab(sub.sub_category)}
                // fontFamily={montserrat.style.fontFamily}
                whiteSpace="nowrap"
                bg={activeTab === sub.sub_category? "purple.600" : ''}
              >
                {sub.sub_category}
              </Button>
            ))}
          </Flex>
        </Box>

        
        <Stack px="4" py="4" gap={"4"}>
          {subServices.map((sub: any) => (
            <ServiceCard
            id={sub.id}
              image={sub.image_url}
              title={sub.title}
              description={sub.description}
              braidingHours={sub.braiding_hours}
              addons={sub.addons}
            />
          ))}
        </Stack>
    </Box>
  )
}

export default ServiceDetails