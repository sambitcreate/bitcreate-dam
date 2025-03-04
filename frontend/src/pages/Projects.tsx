import { useState, useEffect } from 'react';
import { Grid, Card, Text, Group, Button, Stack, Title } from '@mantine/core';
import { UploadModal } from '../components/UploadModal';

interface Project {
  projectName: string;
  latestImage: string;
  uploadDates: string[];
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadModalOpened, setUploadModalOpened] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3091/api/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
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

      await fetchProjects(); // Refresh projects after upload
    } catch (error) {
      console.error('Error uploading:', error);
      throw error;
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Title order={2}>Projects</Title>
        <Button onClick={() => setUploadModalOpened(true)}>Add New</Button>
      </Group>

      <Grid>
        {projects.map((project, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Card shadow="sm">
              <Card.Section>
                <img
                  src={project.latestImage}
                  alt={project.projectName}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              </Card.Section>
              <Text fw={500} size="lg" mt="md">
                {project.projectName}
              </Text>
              <Text size="sm" c="dimmed">
                {project.uploadDates.length} uploads
              </Text>
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