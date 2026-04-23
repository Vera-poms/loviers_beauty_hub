import { Box, Flex, Text, Image, Heading } from '@chakra-ui/react';
import {
  fetchMainServices,
} from '../../api/client'
import { useEffect, useState } from 'react'
// import { robotoSerif, montserrat } from '@/app/font'; 
// import NextLink from 'next/link';


export default function WghSlider() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [services, setServices] = useState<any>(null)
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
        console.log(data)
        setServices(data)
      } catch (error) {
        showMessage(`Error fetching services: ${error}`, "error")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])
  
   
  if (loading || !services?.length) return null

  return (
    <Box 
    
    overflow="hidden">
        <Heading 
        paddingTop={{base:"25px", md: "45px"}} 
        fontWeight="bold"
        fontSize="26px"
        textAlign="center"
        color="purple.500">
            Services
        </Heading>
      <Flex 
        justify="center" 
        align="center" 
        position="relative" 
        h={{base:"350px", md: "500px"}} 
        perspective="400px"
      >
        {services.map((image: any, index: number) => {
          const isActive = activeSlide === index;
          const offset = index - activeSlide;

          return (
            <Box
              key={image.id}
              position="absolute"
              transition="all 0.5s ease-in-out"
              cursor="pointer"
              transform={`
                translateX(${offset * 150}px) 
                scale(${isActive ? 1 : 0.8}) 
                rotateY(${offset * -15}deg)
              `}
              zIndex={isActive ? 10 : 5 - Math.abs(offset)}
              opacity={Math.abs(offset) > 2 ? 0 : 1}
              onClick={() => setActiveSlide(index)}
            >
              
                <Box
                  bg="white"
                  borderRadius="lg"
                  boxShadow="0 4px 6px 1px rgba(213, 137, 241, 0.8)"
                  overflow="hidden"
                  w={{base:"200px", md: "270px"}}
                >
                  <Image 
                  src={image.image_url} 
                  alt={image.service} 
                  h={{base:"200px", md: "270px"}} w="100%" 
                  objectFit="cover" objectPosition="top" />
                  <Text 
                    fontWeight="bold"
                    p="3" 
                    fontSize="lg"
                    textAlign="center"
                    pt="5px"
                    color="purple.600"
                  >
                    {image.service}
                  </Text>
                </Box>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}