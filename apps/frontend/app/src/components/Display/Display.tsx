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


// const items = Array.from({ length: 5 })

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
        console.error("Error fetching services:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleClick = () => {
    navigate("/appointments/book")
  }

  if (loading || !services?.videos?.length) return null

  return (
    <Carousel.Root
      autoplay={{ delay: 100000 }}
      slideCount={services.video.length}
      mx="auto"
      w="100vw"
    >
      <Carousel.ItemGroup>
        {services.video.map((video: any, index: number) => (
          <Carousel.Item key={index} index={index}>
            <Box 
            w="100%" 
            h="300px" 
            bg="gray.200"
            py="10px"
            pl="20px">
              <video 
              src={video.video_url}
              autoPlay
              loop
              muted
              ref={videoRef}
              playsInline
              width="100%"
              height="100%"
              style={{objectFit: "contain"}}
              />
              <Flex
              direction="column"
              justifyContent="flex-end"
              alignItems="flex-start"
              h="100%"
              gap="4">
                <Box
                pl="4px"
                w="250px">
                  <Heading
                  fontSize="22px">
                    Loviers Beauty Hub / LashnMore
                  </Heading>
                  <Text
                  fontSize="12px">
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