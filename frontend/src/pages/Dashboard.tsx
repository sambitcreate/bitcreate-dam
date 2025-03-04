import React, { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Card,
  Container,
  Button,
  Modal,
  Grid,
  Image,
  TextInput,
  Textarea,
  FileInput,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';

// Define a type for the image object
interface Image {
  id: string;
  url: string;
  name: string;
  description: string;
}

const Dashboard: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [opened, setOpened] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const [newImageDescription, setNewImageDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the correct endpoint
        const response = await axios.get('http://localhost:3091/api/assets').catch((error) => {
          if (error.response) {
            throw new Error(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
          } else if (error.request) {
            throw new Error('No response from server. Please check if the backend is running.');
          } else {
            throw new Error('Failed to make request: ' + error.message);
          }
        });

        // Validate response data
        if (!response || !response.data) {
          throw new Error('No data received from the API');
        }

        // Map the assets response to our Image interface
        const validatedImages = response.data.map((asset: any): Image => ({
          id: asset.id || String(Date.now()),
          url: asset.jpg_url || 'https://placehold.co/600x400?text=No+Image',
          name: asset.name || 'Untitled',
          description: asset.description || 'No description available',
        }));

        setImages(validatedImages);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images. Please try again later.');
        setImages([]); // Reset to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageName || !newImageDescription || !newImageFile) {
      setError('Name, description, and image file are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('name', newImageName);
      formData.append('description', newImageDescription);
      formData.append('jpg', newImageFile);

      const response = await axios.post('http://localhost:3091/api/assets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 201) {
        // Refresh the images list
        const assetsResponse = await axios.get('http://localhost:3091/api/assets');
        const validatedImages = assetsResponse.data.map((asset: any): Image => ({
          id: asset.id || String(Date.now()),
          url: asset.jpg_url || 'https://placehold.co/600x400?text=No+Image',
          name: asset.name || 'Untitled',
          description: asset.description || 'No description available',
        }));
        setImages(validatedImages);
        
        // Reset form
        setOpened(false);
        setNewImageName('');
        setNewImageDescription('');
        setNewImageFile(null);
        setError(null);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container pos="relative">
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

      <Grid>
        {Array.isArray(images) && images.map((image) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={image.id}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section>
                <Image
                  src={image.url}
                  alt={image.name}
                  height={200}
                  fallbackSrc="https://placehold.co/600x400?text=Image+Not+Found"
                />
              </Card.Section>

              <Text fw={500} mt="md" size="lg">
                {image.name}
              </Text>
              <Text size="sm" c="dimmed" mt={5}>
                {image.description}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Add New Image">
        <form onSubmit={handleAddNew}>
          <TextInput
            required
            label="Image Name"
            placeholder="Enter image name"
            value={newImageName}
            onChange={(event) => setNewImageName(event.currentTarget.value)}
            mb="sm"
          />
          <Textarea
            required
            label="Description"
            placeholder="Enter image description"
            value={newImageDescription}
            onChange={(event) => setNewImageDescription(event.currentTarget.value)}
            mb="sm"
            minRows={3}
          />
          <FileInput
            required
            label="Image File"
            placeholder="Choose an image"
            accept="image/*"
            onChange={setNewImageFile}
            mb="md"
          />
          <Button type="submit" fullWidth>
            Upload
          </Button>
        </form>
      </Modal>
    </Container>
  );
};

export default Dashboard;

