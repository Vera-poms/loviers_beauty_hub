'use client';

import { useState } from 'react';
import { Box, Flex, Text, Image, VStack, Heading, Link } from '@chakra-ui/react';
// import { robotoSerif, montserrat } from '@/app/font'; 
// import NextLink from 'next/link';

const slides = [
  { id: 1, img: '/assets/3.png', title: 'Braids', category: 'Services' },
  { id: 2, img: '/assets/2.png', title: 'Training', category: 'Services' },
  { id: 3, img: '/assets/1.png', title: 'Lash', category: 'Services' },
  { id: 4, img: '/assets/4.png', title: 'Extras', category: 'Services' },
];

export default function WghSlider() {
  const [activeSlide, setActiveSlide] = useState(2);

  return (
    <Box className="container" py={10} overflow="hidden">
        <Heading>
            Services
        </Heading>
      <Flex 
        justify="center" 
        align="center" 
        position="relative" 
        h="400px" 
        perspective="400px"
      >
        {slides.map((slide) => {
          const isActive = activeSlide === slide.id;
          const offset = slide.id - activeSlide;

          return (
            <Box
              key={slide.id}
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
            >
              <Link
              href={`/services/${slide.id}`} style={{ textDecoration: 'none' }}>
                <Box
                  bg="white"
                  borderRadius="lg"
                  boxShadow={isActive ? '2xl' : 'md'}
                  overflow="hidden"
                  w="180px"
                >
                  <Image src={slide.img} alt={slide.title} h="150px" w="100%" objectFit="cover" />
                  
                  <VStack p={4} align="start">
                    <Text 
                      fontWeight="bold" 
                    //   fontFamily={robotoSerif.style.fontFamily}
                      fontSize="lg"
                    >
                      {slide.title}
                    </Text>
                    <Text 
                      fontSize="sm" 
                      color="gray.500"
                    //   fontFamily={montserrat.style.fontFamily}
                      fontStyle="italic"
                    >
                      {slide.category}
                    </Text>
                  </VStack>
                </Box>
              </Link>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}