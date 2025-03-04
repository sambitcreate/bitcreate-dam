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
  Menu,
  Checkbox,
  Slider,
  ActionIcon
} from '@mantine/core';
import { IconAlertCircle, IconDotsVertical, IconDownload, IconEdit, IconTrash, IconSortAscending } from '@tabler/icons-react';
import axios from 'axios';
import { UploadModal } from '../components/UploadModal';
import { AssetDetails } from '../components/AssetDetails';
import { EditAssetModal } from '../components/EditAssetModal';

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
  const [editAssetModalOpened, setEditAssetModalOpened] = useState(false);
  const [imageSize, setImageSize] = useState(50);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      const response = await fetch(`http://localhost:3091/api/assets/${assetId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await fetchRecentAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset');
    }
  };

  const handleDownload = (asset: Asset) => {
    window.open(asset.jpg_url, '_blank');
  };

  const handleEditMetadata = (asset: Asset) => {
    setSelectedAsset(asset);
    setEditAssetModalOpened(true);
  };

  const sortedAssets = [...recentAssets].sort((a, b) => {
    let valueA = a[sortBy as keyof Asset] || '';
    let valueB = b[sortBy as keyof Asset] || '';
    
    if (sortBy === 'created_at' || sortBy === 'project_date') {
      valueA = new Date(valueA as string).getTime().toString();
      valueB = new Date(valueB as string).getTime().toString();
    }
    
    return sortOrder === 'asc' 
      ? valueA.localeCompare(valueB as string) 
      : valueB.localeCompare(valueA as string);
  });

  const calculateSpan = () => {
    if (imageSize < 30) return { base: 12, sm: 6, md: 3, lg: 2 };
    if (imageSize < 60) return { base: 12, sm: 6, md: 4, lg: 3 };
    if (imageSize < 80) return { base: 12, sm: 6, md: 6, lg: 4 };
    return { base: 12, sm: 12, md: 6, lg: 6 };
  };

  return (
    <div style={{ position: 'relative', width: '100%', padding: '0 16px' }}>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

      <Group justify="space-between" mb="xl">
        <Title order={2}>Dashboard</Title>
        <Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button leftSection={<IconSortAscending size={16} />} variant="light">
                Sort By
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Sort Field</Menu.Label>
              <Menu.Item 
                onClick={() => setSortBy('name')}
                rightSection={sortBy === 'name' ? <Checkbox checked readOnly /> : null}
              >
                Name
              </Menu.Item>
              <Menu.Item 
                onClick={() => setSortBy('project_name')}
                rightSection={sortBy === 'project_name' ? <Checkbox checked readOnly /> : null}
              >
                Project
              </Menu.Item>
              <Menu.Item 
                onClick={() => setSortBy('project_date')}
                rightSection={sortBy === 'project_date' ? <Checkbox checked readOnly /> : null}
              >
                Project Date
              </Menu.Item>
              <Menu.Item 
                onClick={() => setSortBy('created_at')}
                rightSection={sortBy === 'created_at' ? <Checkbox checked readOnly /> : null}
              >
                Upload Date
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>Order</Menu.Label>
              <Menu.Item 
                onClick={() => setSortOrder('asc')}
                rightSection={sortOrder === 'asc' ? <Checkbox checked readOnly /> : null}
              >
                Ascending
              </Menu.Item>
              <Menu.Item 
                onClick={() => setSortOrder('desc')}
                rightSection={sortOrder === 'desc' ? <Checkbox checked readOnly /> : null}
              >
                Descending
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Group>
            <Text size="sm">Zoom:</Text>
            <Slider
              value={imageSize}
              onChange={setImageSize}
              min={20}
              max={100}
              style={{ width: 100 }}
            />
          </Group>
          <Button onClick={() => setOpened(true)}>Add New</Button>
        </Group>
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
          {sortedAssets.map((asset) => (
            <Grid.Col key={asset.id} span={calculateSpan()}>
              <Card 
                shadow="sm" 
                padding="lg" 
                radius="md" 
                withBorder
                style={{ position: 'relative' }}
              >
                <ActionIcon 
                  style={{ position: 'absolute', top: 5, right: 5, zIndex: 10 }}
                  variant="light"
                  color="gray"
                >
                  <Menu shadow="md" width={200} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon>
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item 
                        leftSection={<IconEdit size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMetadata(asset);
                        }}
                      >
                        Edit Metadata
                      </Menu.Item>
                      <Menu.Item 
                        leftSection={<IconDownload size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(asset);
                        }}
                      >
                        Download
                      </Menu.Item>
                      <Menu.Item 
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id);
                        }}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </ActionIcon>
                <Card.Section onClick={() => setSelectedAsset(asset)} style={{ cursor: 'pointer' }}>
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

      <EditAssetModal
        asset={selectedAsset}
        opened={editAssetModalOpened}
        onClose={() => setEditAssetModalOpened(false)}
        onUpdate={fetchRecentAssets}
      />
    </div>
  );
};

export default Dashboard;

