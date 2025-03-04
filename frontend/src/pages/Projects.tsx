import { useState, useEffect } from 'react';
import { Container, Title, Text, Card, Group, Button, Stack, Alert, Modal, TextInput } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { UploadModal } from '../components/UploadModal';
import { notifications } from '@mantine/notifications';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  const [newProjectModalOpened, setNewProjectModalOpened] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3091/api/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      if (!Array.isArray(data)) {
        console.error('Unexpected API response:', data);
        throw new Error('Received invalid data format from server');
      }

      setProjects(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error instanceof Error ? error.message : 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      if (!newProjectName.trim()) {
        notifications.show({
          title: 'Error',
          message: 'Project name is required',
          color: 'red',
        });
        return;
      }

      const response = await fetch('http://localhost:3091/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setNewProjectName('');
      setNewProjectModalOpened(false);
      await fetchProjects();
      
      notifications.show({
        title: 'Success',
        message: 'Project created successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create project',
        color: 'red',
      });
    }
  };

  const handleUpload = async (formData: FormData) => {
    try {
      const response = await fetch('http://localhost:3091/api/assets', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      await fetchProjects();
      setUploadModalOpened(false);
      
      notifications.show({
        title: 'Success',
        message: 'Files uploaded successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error uploading:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to upload files',
        color: 'red',
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <Container>
        <Text>Loading projects...</Text>
      </Container>
    );
  }

  return (
    <Container>
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={2}>Projects</Title>
          <Group>
            <Button onClick={() => setNewProjectModalOpened(true)}>Add New Project</Button>
            <Button onClick={() => setUploadModalOpened(true)}>Upload Images</Button>
          </Group>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {!error && projects.length === 0 && (
          <Alert icon={<IconAlertCircle size={16} />} title="No Projects" color="blue">
            No projects found. Click "Add New Project" to create your first project.
          </Alert>
        )}

        <Stack gap="md">
          {Array.isArray(projects) && projects.map((project) => (
            <Card key={project.id} shadow="sm" padding="lg">
              <Title order={3}>{project.name}</Title>
              {project.description && (
                <Text c="dimmed" size="sm" mt="sm">
                  {project.description}
                </Text>
              )}
              <Text size="sm" c="dimmed" mt="sm">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </Text>
            </Card>
          ))}
        </Stack>

        <Modal
          opened={newProjectModalOpened}
          onClose={() => setNewProjectModalOpened(false)}
          title="Create New Project"
          size="md"
          zIndex={1000}
        >
          <Stack>
            <TextInput
              label="Project Name"
              placeholder="Enter project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.currentTarget.value)}
              required
            />
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </Stack>
        </Modal>

        <UploadModal
          opened={uploadModalOpened}
          onClose={() => setUploadModalOpened(false)}
          onUpload={handleUpload}
        />
      </Stack>
    </Container>
  );
} 