import { useState, useEffect } from 'react';
import { Modal, TextInput, Textarea, Button, Stack, Select, MultiSelect, Group, Badge, ActionIcon } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconX } from '@tabler/icons-react';

interface Asset {
  id: string;
  name: string;
  description?: string;
  tags?: string;
  project_name?: string;
  project_id?: string;
  project_date?: string;
  client_name?: string;
  jpg_url: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  project_date?: string;
  created_at: string;
}

interface EditAssetModalProps {
  asset: Asset | null;
  opened: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditAssetModal({ asset, opened, onClose, onUpdate }: EditAssetModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectDate, setProjectDate] = useState<Date | null>(null);
  const [clientName, setClientName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setDescription(asset.description || '');
      setProjectId(asset.project_id || null);
      setProjectDate(asset.project_date ? new Date(asset.project_date) : null);
      setClientName(asset.client_name || '');
      setTags(asset.tags ? asset.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []);
    }
  }, [asset]);

  useEffect(() => {
    if (opened) {
      fetchProjects();
    }
  }, [opened]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3091/api/projects');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch projects',
        color: 'red',
      });
    }
  };

  const handleSubmit = async () => {
    if (!asset) return;
    
    try {
      setLoading(true);
      
      const selectedProject = projects.find(p => p.id === projectId);
      
      const response = await fetch(`http://localhost:3091/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          project_id: projectId,
          project_name: selectedProject?.name,
          project_date: projectDate ? projectDate.toISOString() : null,
          client_name: clientName,
          tags: tags.join(', '),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update asset');
      }
      
      notifications.show({
        title: 'Success',
        message: 'Asset updated successfully',
        color: 'green',
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating asset:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update asset',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Asset Metadata"
      size="lg"
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
          label="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
        
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          autosize
          minRows={3}
        />
        
        <Select
          label="Project"
          placeholder="Select a project"
          data={projects.map(project => ({ value: project.id, label: project.name }))}
          value={projectId}
          onChange={setProjectId}
          clearable
        />
        
        <DatePickerInput
          label="Project Date"
          placeholder="Select date"
          value={projectDate}
          onChange={setProjectDate}
          clearable
        />
        
        <TextInput
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.currentTarget.value)}
        />
        
        <Stack gap="xs">
          <Group justify="space-between">
            <TextInput
              label="Tags"
              placeholder="Enter a tag and press Add"
              value={newTag}
              onChange={(e) => setNewTag(e.currentTarget.value)}
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <ActionIcon 
              size="lg" 
              variant="filled" 
              color="blue" 
              onClick={addTag}
              style={{ marginTop: 'auto' }}
              disabled={!newTag.trim()}
            >
              <IconPlus size={16} />
            </ActionIcon>
          </Group>
          
          <Group gap="xs">
            {tags.map((tag, index) => (
              <Badge 
                key={index} 
                size="lg"
                rightSection={
                  <ActionIcon 
                    size="xs" 
                    color="blue" 
                    radius="xl" 
                    variant="transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                {tag}
              </Badge>
            ))}
          </Group>
        </Stack>
        
        <Button onClick={handleSubmit} loading={loading} mt="md">
          Update Asset
        </Button>
      </Stack>
    </Modal>
  );
} 