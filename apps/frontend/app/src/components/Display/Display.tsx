'use client'

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
  LuClock,
  LuPause,
  LuPlay,
} from "react-icons/lu"

const items = Array.from({ length: 5 })

const Display = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate("/appointments/book")
  }


  return (
    <Carousel.Root
      autoplay={{ delay: 1000000 }}
      slideCount={items.length}
      mx="auto"
      w="100vw"
    >
      <Carousel.ItemGroup>
        {items.map((_, index) => (
          <Carousel.Item key={index} index={index}>
            <Box 
            w="100%" 
            h="300px" 
            bg="gray.200"
            py="10px"
            pl="20px">
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