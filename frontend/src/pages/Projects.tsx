import { useState, useEffect } from 'react';
import { Container, Title, Text, Card, Group, Button, Stack, Alert, Modal, TextInput, ActionIcon, Grid, Image, AspectRatio } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconAlertCircle, IconDotsVertical, IconEdit, IconTrash, IconFolder } from '@tabler/icons-react';
import { UploadModal } from '../components/UploadModal';
import { notifications } from '@mantine/notifications';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  project_date?: string;
}

interface Asset {
  id: string;
  name: string;
  description?: string;
  jpg_url: string;
  project_id: string;
  project_name: string;
  client_name?: string;
  created_at: string;
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  const [newProjectModalOpened, setNewProjectModalOpened] = useState(false);
  const [editProjectModalOpened, setEditProjectModalOpened] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDate, setNewProjectDate] = useState<Date | null>(new Date());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectAssets, setProjectAssets] = useState<Asset[]>([]);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);

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
      
      // Check if project name already exists
      const existingProject = projects.find(p => p.name.toLowerCase() === newProjectName.trim().toLowerCase());
      if (existingProject) {
        notifications.show({
          title: 'Error',
          message: 'A project with this name already exists',
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
          description: newProjectDescription.trim(),
          project_date: newProjectDate ? newProjectDate.toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectDate(new Date());
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

  const handleEditProject = async () => {
    try {
      if (!selectedProject || !selectedProject.name.trim()) {
        notifications.show({
          title: 'Error',
          message: 'Project name is required',
          color: 'red',
        });
        return;
      }

      const response = await fetch(`http://localhost:3091/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedProject.name.trim(),
          description: selectedProject.description?.trim(),
          project_date: selectedProject.project_date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      setEditProjectModalOpened(false);
      await fetchProjects();
      
      notifications.show({
        title: 'Success',
        message: 'Project updated successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating project:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update project',
        color: 'red',
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated assets.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3091/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      await fetchProjects();
      
      notifications.show({
        title: 'Success',
        message: 'Project deleted successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete project',
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

  const fetchProjectAssets = async (projectId: string) => {
    try {
      setLoadingAssets(true);
      const response = await fetch(`http://localhost:3091/api/projects/${projectId}/assets`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project assets');
      }
      
      const data = await response.json();
      setProjectAssets(data);
    } catch (error) {
      console.error('Error fetching project assets:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load project assets',
        color: 'red',
      });
      setProjectAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setViewingProject(project);
    fetchProjectAssets(project.id);
  };

  const handleBackToProjects = () => {
    setViewingProject(null);
    setProjectAssets([]);
  };

  if (loading) {
    return (
      <Container>
        <Text>Loading projects...</Text>
      </Container>
    );
  }

  if (viewingProject) {
    return (
      <Container>
        <Stack gap="xl">
          <Group justify="space-between" align="center">
            <Group>
              <Button variant="subtle" onClick={handleBackToProjects}>
                Back to Projects
              </Button>
              <Title order={2}>{viewingProject.name}</Title>
            </Group>
            <Button onClick={() => setUploadModalOpened(true)}>Add Images</Button>
          </Group>

          {loadingAssets ? (
            <Text>Loading assets...</Text>
          ) : projectAssets.length === 0 ? (
            <Alert icon={<IconAlertCircle size={16} />} title="No Assets" color="blue">
              No assets found for this project. Click "Add Images" to upload images.
            </Alert>
          ) : (
            <Stack gap="xl">
              <Grid>
                {projectAssets.map((asset) => (
                  <Grid.Col key={asset.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                      <Card.Section>
                        <AspectRatio ratio={1}>
                          <Image
                            src={asset.jpg_url}
                            alt={asset.name}
                            fit="cover"
                          />
                        </AspectRatio>
                      </Card.Section>
                      <Text fw={500} mt="md" lineClamp={1}>
                        {asset.name}
                      </Text>
                      {asset.client_name && (
                        <Text size="sm" c="dimmed" lineClamp={1}>
                          Client: {asset.client_name}
                        </Text>
                      )}
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </Stack>
          )}
        </Stack>

        <UploadModal
          opened={uploadModalOpened}
          onClose={() => setUploadModalOpened(false)}
          onUpload={handleUpload}
          projectId={viewingProject.id}
        />
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
            <Card 
              key={project.id} 
              shadow="sm" 
              padding="lg" 
              withBorder 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => handleViewProject(project)}
            >
              <ActionIcon 
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
                variant="light"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(project);
                  setEditProjectModalOpened(true);
                }}
              >
                <IconDotsVertical size={16} />
              </ActionIcon>
              <Group justify="space-between">
                <Group>
                  <IconFolder size={24} />
                  <div>
                    <Title order={3}>{project.name}</Title>
                    {project.description && (
                      <Text c="dimmed" size="sm" mt="sm">
                        {project.description}
                      </Text>
                    )}
                    <Text size="sm" c="dimmed" mt="sm">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </Text>
                    {project.project_date && (
                      <Text size="sm" c="dimmed">
                        Project Date: {new Date(project.project_date).toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                </Group>
                <Group onClick={(e) => e.stopPropagation()}>
                  <ActionIcon 
                    color="blue" 
                    variant="light"
                    onClick={() => {
                      setSelectedProject(project);
                      setEditProjectModalOpened(true);
                    }}
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                  <ActionIcon 
                    color="red" 
                    variant="light"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>

        <Modal
          opened={newProjectModalOpened}
          onClose={() => setNewProjectModalOpened(false)}
          title="Create New Project"
          size="md"
          styles={{
            root: { zIndex: 9999 },
            overlay: { zIndex: 9998, backdropFilter: 'blur(3px)' },
            content: { position: 'relative' },
            inner: { padding: '20px' },
            header: { zIndex: 10000 }
          }}
          centered
          fullScreen={false}
          overlayProps={{ blur: 3 }}
          transitionProps={{ duration: 200 }}
        >
          <Stack>
            <TextInput
              label="Project Name"
              placeholder="Enter project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Description"
              placeholder="Enter project description"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.currentTarget.value)}
            />
            <div style={{ zIndex: 1001, position: 'relative' }}>
              <DatePickerInput
                label="Project Date"
                placeholder="Select project date"
                value={newProjectDate}
                onChange={setNewProjectDate}
              />
            </div>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </Stack>
        </Modal>

        <Modal
          opened={editProjectModalOpened}
          onClose={() => setEditProjectModalOpened(false)}
          title="Edit Project"
          size="md"
          styles={{
            root: { zIndex: 9999 },
            overlay: { zIndex: 9998, backdropFilter: 'blur(3px)' },
            content: { position: 'relative' },
            inner: { padding: '20px' },
            header: { zIndex: 10000 }
          }}
          centered
          fullScreen={false}
          overlayProps={{ blur: 3 }}
          transitionProps={{ duration: 200 }}
        >
          <Stack>
            <TextInput
              label="Project Name"
              placeholder="Enter project name"
              value={selectedProject?.name || ''}
              onChange={(e) => setSelectedProject(prev => prev ? {...prev, name: e.currentTarget.value} : null)}
              required
            />
            <TextInput
              label="Description"
              placeholder="Enter project description"
              value={selectedProject?.description || ''}
              onChange={(e) => setSelectedProject(prev => prev ? {...prev, description: e.currentTarget.value} : null)}
            />
            <div style={{ zIndex: 1001, position: 'relative' }}>
              <DatePickerInput
                label="Project Date"
                placeholder="Select project date"
                value={selectedProject?.project_date ? new Date(selectedProject.project_date) : null}
                onChange={(date: Date | null) => setSelectedProject(prev => prev ? {...prev, project_date: date ? date.toISOString() : undefined} : null)}
              />
            </div>
            <Button onClick={handleEditProject} disabled={!selectedProject?.name?.trim()}>
              Update Project
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