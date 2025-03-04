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
  Group,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';
import { UploadModal } from '../components/UploadModal';
import { AssetDetails } from '../components/AssetDetails';

interface Asset {
  id: string;
  name: string;
  description: string;
  tags: string;
  created_at: string;
  jpg_url: string;
  project_name?: string;
  project_date?: string;
  client_name?: string;
}

const Dashboard: React.FC = () => {
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    fetchRecentAssets();
  }, []);

  const fetchRecentAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3091/api/assets/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch recent assets');
      }
      const data = await response.json();
      setRecentAssets(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching recent assets:', error);
      setError('Failed to load recent assets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    try {
      const response = await fetch('http://localhost:3091/api/assets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      await fetchRecentAssets();
      setOpened(false);
    } catch (error) {
      console.error('Error uploading:', error);
      throw error;
    }
  };

  return (
    <Container pos="relative" size="xl">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

      <Group justify="space-between" mb="xl">
        <Title order={2}>Dashboard</Title>
        <Button onClick={() => setOpened(true)}>Add New</Button>
      </Group>

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

      {!loading && !error && recentAssets.length === 0 && (
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
              <Card 
                shadow="sm" 
                padding="lg" 
                radius="md" 
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedAsset(asset)}
              >
                <Card.Section>
                  <AspectRatio ratio={1}>
                    <Image
                      src={asset.jpg_url}
                      alt={asset.name}
                      fit="cover"
                      fallbackSrc="https://placehold.co/600x400?text=Image+Not+Found"
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
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>

      <UploadModal
        opened={opened}
        onClose={() => setOpened(false)}
        onUpload={handleUpload}
      />

      <AssetDetails
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </Container>
  );
};

export default Dashboard;

