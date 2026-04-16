'use client';

import { useState } from 'react';
import { Box, Flex, Text, Image, Heading, IconButton, Carousel, Button, Stack } from '@chakra-ui/react';
import { ServiceCard } from './ServiceCard';
// import { robotoSerif, montserrat } from '@/app/font';
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay } from 'react-icons/lu';

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

  return (
    <Box>
        <Carousel.Root
          autoplay={{ delay: 5000 }}
          slideCount={3}
          mx="auto"
          w="100vw"
        >
          <Carousel.ItemGroup>
            <Carousel.Item index={0}>
              <Box w="100%" h="300px" bg="black" position="relative" overflow="hidden">
                {service.video ? (
                  <video
                    src={service.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : service.image ? (
                  <Image
                    src={service.image}
                    alt={service.title}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                ) : (
                  <Box w="100%" h="100%" bg="gray.200" />
                )}
                <Flex
                  position="absolute"
                  bottom="0"
                  left="0"
                  right="0"
                  p="4"
                  bg="blackAlpha.600"
                  direction="column"
                  gap="1"
                >
                  <Heading
                    fontSize="22px"
                    color="white"
                    // fontFamily={robotoSerif.style.fontFamily}
                  >
                    {service.title}
                  </Heading>
                  <Text fontSize="12px" color="whiteAlpha.800">
                    {service.description}
                  </Text>
                </Flex>
              </Box>
            </Carousel.Item>
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
          <Text
            fontSize="lg"
            // fontFamily={montserrat.style.fontFamily}
          >
            {service.braidingHours}
          </Text>
        </Box>

        <Box px="4" py="4">
          <Flex gap="2" overflowX="auto" pb="2">
            <Button
              size="sm"
              variant={activeTab === 'all' ? 'solid' : 'outline'}
              onClick={() => setActiveTab('all')}
            //   fontFamily={montserrat.style.fontFamily}
            >
              All
            </Button>
            {subcategories.map((sub) => (
              <Button
                key={sub.id}
                size="sm"
                variant={activeTab === sub.name ? 'solid' : 'outline'}
                onClick={() => setActiveTab(sub.name)}
                // fontFamily={montserrat.style.fontFamily}
                whiteSpace="nowrap"
              >
                {sub.name}
              </Button>
            ))}
          </Flex>
        </Box>

        
        <Stack px="4" py="4" gap={"4"}>
          <ServiceCard
            image={service.image || ''}
            title={service.title}
            description={service.description}
            addons={subcategories.map((sub) => ({
              id: sub.id,
              title: sub.name,
              price: Math.floor(Math.random() * 50) + 10 
            }))}
          />
        </Stack>
    </Box>
  )
}

export default ServiceDetails