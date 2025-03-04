import { useState, useEffect } from 'react';
import { Grid, Card, Text, Group, Button, Stack, Title } from '@mantine/core';
import { UploadModal } from './components/UploadModal';

interface Asset {
  id: string;
  name: string;
  description: string;
  jpg_url: string;
  project_name: string;
  created_at: string;
}

export function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploadModalOpened, setUploadModalOpened] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('http://localhost:3091/api/assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
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

      await fetchAssets(); // Refresh assets after upload
    } catch (error) {
      console.error('Error uploading:', error);
      throw error;
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Title order={2}>Assets</Title>
        <Button onClick={() => setUploadModalOpened(true)}>Add New</Button>
      </Group>

      <Grid>
        {assets.map((asset) => (
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

      <UploadModal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
        onUpload={handleUpload}
      />
    </Stack>
  );
}