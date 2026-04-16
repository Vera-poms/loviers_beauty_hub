import { useState } from 'react';
import { Box, Card, Image, Heading, Text, Collapsible, Button, Flex, Stack } from '@chakra-ui/react';

interface Addon {
  id: number;
  title: string;
  price: number;
}

interface ServiceCardProps {
  image: string;
  title: string;
  description: string;
  addons: Addon[];
}

export function ServiceCard({ image, title, description, addons }: ServiceCardProps) {
  const [showAddons, setShowAddons] = useState(false);

  return (
    <Card.Root maxW="sm" mb={4}>
      <Card.Body>
        <Collapsible.Root>
        <Collapsible.Trigger>
            <Flex>
                <Image src={image} alt={title} borderRadius="md" mb={2} />
                <Box>
                    <Heading size="md" mb={1}>{title}</Heading>
                <Text mb={2}>{description}</Text>
                </Box>
            </Flex>
        </Collapsible.Trigger>
        <Collapsible.Content>
            <Stack gap={2} mt={2}>
                {addons.map((addon) => (
                <Flex key={addon.id} align="center" justify="space-between" p={2} borderWidth={1} borderRadius="md">
                    <Box>
                    <Text fontWeight="medium">{addon.title}</Text>
                    <Text fontSize="sm" color="gray.500">${addon.price.toFixed(2)}</Text>
                    </Box>
                    <Button size="xs" colorScheme="blue">Add</Button>
                </Flex>
                ))}
            </Stack>
        </Collapsible.Content>
          
        </Collapsible.Root>
      </Card.Body>
    </Card.Root>
  );
}
