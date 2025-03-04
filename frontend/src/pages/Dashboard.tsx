import React, { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Card,
  Container,
  Button,
  Grid,
  Image,
  LoadingOverlay,
  Alert,
  AspectRatio,
  Stack,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';
import { UploadModal } from '../components/UploadModal';

interface Asset {
  id: string;
  url: string;
  name: string;
  description: string;
  projectName?: string;
  projectDate?: string;
  clientName?: string;
}

interface RecentAsset {
  id: string;
  name: string;
  jpg_url: string;
  project_name: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [images, setImages] = useState<Asset[]>([]);
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);

  useEffect(() => {
    fetchImages();
    fetchRecentAssets();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:3091/api/assets').catch((error) => {
        if (error.response) {
          throw new Error(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
        } else if (error.request) {
          throw new Error('No response from server. Please check if the backend is running.');
        } else {
          throw new Error('Failed to make request: ' + error.message);
        }
      });

      if (!response || !response.data) {
        throw new Error('No data received from the API');
      }

      const validatedImages = response.data.map((asset: any): Asset => ({
        id: asset.id || String(Date.now()),
        url: asset.jpg_url || 'https://placehold.co/600x400?text=No+Image',
        name: asset.name || 'Untitled',
        description: asset.description || 'No description available',
        projectName: asset.project_name,
        projectDate: asset.project_date,
        clientName: asset.client_name,
      }));

      setImages(validatedImages);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images. Please try again later.');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('http://localhost:3091/api/assets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 201) {
        await fetchImages();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAssets = async () => {
    try {
      const response = await fetch('http://localhost:3091/api/assets/recent');
      const data = await response.json();
      setRecentAssets(data);
    } catch (error) {
      console.error('Error fetching recent assets:', error);
    }
  };

  return (
    <Container pos="relative" size="xl">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

      <div style={{ marginBottom: '2rem' }}>
        <Title order={2}>Dashboard</Title>
        <Button onClick={() => setOpened(true)} mt="md">Add New</Button>
      </div>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          mb="lg"
          variant="light"
        >
          {error}
        </Alert>
      )}

      {!loading && !error && images.length === 0 && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="No Images"
          color="blue"
          mb="lg"
          variant="light"
        >
          No images found. Click "Add New" to upload your first image.
        </Alert>
      )}

      <Stack gap="xl">
        <Title order={2}>Recent Uploads</Title>

        <Grid>
          {recentAssets.map((asset) => (
            <Grid.Col key={asset.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <Card shadow="sm">
                <Card.Section>
                  <img
                    src={asset.jpg_url}
                    alt={asset.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                </Card.Section>
                <Text fw={500} size="lg" mt="md">
                  {asset.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {new Date(asset.created_at).toLocaleDateString()}
                </Text>
                {asset.project_name && (
                  <Text size="sm" c="dimmed">
                    Project: {asset.project_name}
                  </Text>
                )}
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>

      <Grid>
        {Array.isArray(images) && images.map((image) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={image.id}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section>
                <AspectRatio ratio={1}>
                  <Image
                    src={image.url}
                    alt={image.name}
                    fit="cover"
                    fallbackSrc="https://placehold.co/600x400?text=Image+Not+Found"
                  />
                </AspectRatio>
              </Card.Section>

              <Text fw={500} mt="md" size="lg" lineClamp={1}>
                {image.name}
              </Text>
              {image.projectName && (
                <Text size="sm" c="dimmed" lineClamp={1}>
                  Project: {image.projectName}
                </Text>
              )}
              {image.clientName && (
                <Text size="sm" c="dimmed" lineClamp={1}>
                  Client: {image.clientName}
                </Text>
              )}
              {image.projectDate && (
                <Text size="sm" c="dimmed">
                  Date: {new Date(image.projectDate).toLocaleDateString()}
                </Text>
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

