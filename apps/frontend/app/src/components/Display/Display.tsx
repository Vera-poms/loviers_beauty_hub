import { useNavigate } from 'react-router-dom'
import 
{ Carousel, 
  IconButton, 
  Box, 
  Button, 
  Heading, 
  Text,
  Flex 
}  from "@chakra-ui/react"
import {
  LuChevronLeft,
  LuChevronRight,
  LuPause,
  LuPlay,
} from "react-icons/lu"
import {
  fetchMainServices,
} from '../../api/client'
import { useEffect, useState, useRef } from 'react'



const Display = () => {
  const navigate = useNavigate()
  const [services, setServices] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState<{text: string, type: "error" | "success"} | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const showMessage = (text: string, type: "error" | "success") => {
    setStatusMessage({text, type})
    setTimeout(() => setStatusMessage(null), 5000)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchMainServices()
        setServices(data)
      } catch (error) {
        showMessage(`Error fetching services: ${error}`, "error")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleClick = () => {
    navigate("/appointments/book")
  }

  if (loading || !services?.length) return null

  return (
    <Carousel.Root
      autoplay={{ delay: 7000 }}
      slideCount={services.length}
      maxW="100p%"
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
              loop
              muted
              ref={videoRef}
              playsInline
              width="100%"
              height="100%"
              style={{objectFit: "cover"}}
              />
              <Flex
              position="absolute"
              bottom="10px"
              left="20px"
              direction="column"
              justifyContent="flex-end"
              alignItems="flex-start"
              h={{ sm: "110px"}}
              py="2"
              px="3"
              rounded="lg"
              w={{base:"80%"}}
                bg="blackAlpha.400"
              >
                <Box
                color="white">
                  <Heading
                  fontSize={{base:"18px", sm: "22px"}}
                  >
                    Loviers Beauty Hub / LashnMore
                  </Heading>
                  <Text
                  fontSize={{base:"11px", sm: "13px"}}
                  >
                    Expert braiding and lash services to help you look your best
                  </Text>
                </Box>
                <Button
                size="sm"
                onClick={handleClick}>
                  Book appointment
                </Button>
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


  )
}

export default Display