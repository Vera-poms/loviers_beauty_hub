import { Box, Card, Image, Heading, Text, Collapsible, Button, Flex, Stack } from '@chakra-ui/react';
import {LuClock} from "react-icons/lu"
import { useNavigate } from 'react-router-dom';

export interface Addon {
  name: string;
  price: number;
}

interface ServiceCardProps {
  id: string;
  image: string;
  title: string;
  description: string;
  braidingHours?: string
  addons?: Addon[];
  addonsRequired?: boolean;
}

export function ServiceCard({ 
  id,
  image, 
  title, 
  description, 
  braidingHours, 
  addons = [],
 }: ServiceCardProps) {
  const navigate = useNavigate();

  const bookAppointmentNow = (addonName?: string) => {
    const params = new URLSearchParams({ service_id: id });
    if (addonName) params.set('addon', addonName);
    navigate(`/booking?${params.toString()}`);
  }

  return (
    <Card.Root 
    maxW="sm"
    boxShadow="2px 4px 6px -2px rgba(199, 73, 245, 0.98)" 
    bg="purple.100"
    mb={4}>
      <Card.Body>
        <Collapsible.Root>
        <Collapsible.Trigger>
            <Flex>
              <Image src={image} alt={title} borderRadius="md" mb={2} width="100px" height="120px" />
              <Box
              textAlign="left"
              pl="10px">
                <Heading size="lg" mb={1}>
                  {title}
                </Heading>
                <Text mb={2}
                fontSize="xs">{description}</Text>
                {braidingHours && (
                  <Flex align="center" gap={1}>
                    <LuClock />
                    <Text fontSize="xs" color="gray.500">
                      {braidingHours}
                    </Text>
                  </Flex>
                )}
              </Box>
            </Flex>
        </Collapsible.Trigger>
        <Collapsible.Content>
            <Stack gap={2} 
            mt={2}
            >
                {addons?.map((addon, index:number) => (
                <Flex key={index} 
                align="center" 
                justify="space-between" 
                p={2} 
                borderWidth={1} 
                borderColor="purple.400"
                borderRadius="md">
                    <Box>
                    <Text fontWeight="medium">{addon.name}</Text>
                    <Text fontSize="sm" color="gray.500">GH¢{addon.price.toFixed(2)}</Text>
                    </Box>
                    <Button 
                    size="xs" 
                    bg="purple.600"
                    onClick={() => bookAppointmentNow(addon.name)}>Book</Button>
                </Flex>
                ))}
            </Stack>
        </Collapsible.Content>
          
        </Collapsible.Root>
      </Card.Body>
    </Card.Root>
  );
}
