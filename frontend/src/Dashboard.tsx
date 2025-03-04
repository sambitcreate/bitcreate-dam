import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Box,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Grid,
  LoadingOverlay,
  Alert,
  Image,
  AspectRatio,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';
import { UploadModal } from './components/UploadModal';

interface Asset {
  id: number;
  name: string;
  description: string;
  tags: string;
  created_at: string;
  jpg_url?: string;
  project_name?: string;
  project_date?: string;
  client_name?: string;
}

const Dashboard: React.FC = () => {
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentAssets();
  }, []);

  const fetchRecentAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Asset[]>('http://localhost:3091/api/assets/recent');
      setRecentAssets(response.data);
    } catch (error) {
      console.error('Error fetching recent assets:', error);
      setError('Failed to fetch recent assets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:3091/api/assets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        await fetchRecentAssets();
        setOpened(false);
      } else {
        throw new Error('Failed to create asset');
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      setError('An error occurred while creating the asset.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl" p="md" style={{ maxWidth: '100%' }}>
      <LoadingOverlay visible={loading} />

      <Box mb="xl">
        <Group justify="space-between">
          <Title order={2}>Recent Assets</Title>
          <Button onClick={() => setOpened(true)}>Add New</Button>
        </Group>
      </Box>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          variant="light"
          mb="lg"
        >
          {error}
        </Alert>
      )}

      <Grid>
        {recentAssets.map((asset) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={asset.id}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section>
                <AspectRatio ratio={1}>
                  <Image
                    src={asset.jpg_url || 'https://placehold.co/600x400?text=No+Image'}
                    alt={asset.name}
                    fit="cover"
                  />
                </AspectRatio>
              </Card.Section>

              <Text fw={500} mt="md" size="lg" lineClamp={1}>
                {asset.name}
              </Text>
              {asset.project_name && (
                <Text size="sm" c="dimmed" lineClamp={1}>
                  Project: {asset.project_name}
                </Text>
              )}
              {asset.client_name && (
                <Text size="sm" c="dimmed" lineClamp={1}>
                  Client: {asset.client_name}
                </Text>
              )}
              {asset.project_date && (
                <Text size="sm" c="dimmed">
                  Date: {new Date(asset.project_date).toLocaleDateString()}
                </Text>
              )}
              {asset.tags && (
                <Box mt="xs">
                  {asset.tags.split(',').map((tag, index) => (
                    <Badge key={index} mr={4} mb={4}>
                      {tag.trim()}
                    </Badge>
                  ))}
                </Box>
              )}
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <UploadModal
        opened={opened}
        onClose={() => setOpened(false)}
        onUpload={handleUpload}
      />
    </Container>
  );
};

export default Dashboard; 