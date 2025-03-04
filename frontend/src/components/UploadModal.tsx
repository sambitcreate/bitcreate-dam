import { useState } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  FileInput,
  TextInput,
  Select,
  ActionIcon,
  Box,
  Grid,
  Card,
  Image,
} from '@mantine/core';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { IconPlus } from '@tabler/icons-react';

interface UploadModalProps {
  opened: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}

interface Client {
  value: string;
  label: string;
}

export function UploadModal({ opened, onClose, onUpload }: UploadModalProps) {
  const [step, setStep] = useState(1);
  const [uploadType, setUploadType] = useState<'single' | 'multiple' | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDate, setProjectDate] = useState<Date | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [newClient, setNewClient] = useState('');
  const [clients, setClients] = useState<Client[]>([
    { value: 'client1', label: 'Client 1' },
    { value: 'client2', label: 'Client 2' },
  ]);
  const [showNewClientInput, setShowNewClientInput] = useState(false);

  const handleFileSelect = (files: File[] | null) => {
    if (files) {
      setSelectedFiles(files);
      setStep(3); // Move to project details after file selection
    }
  };

  const handleAddNewClient = () => {
    if (newClient) {
      const newClientObj = {
        value: newClient.toLowerCase().replace(/\s+/g, '-'),
        label: newClient,
      };
      setClients([...clients, newClientObj]);
      setSelectedClient(newClientObj.value);
      setNewClient('');
      setShowNewClientInput(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    setProjectDate(date);
  };

  const handleSubmit = async () => {
    if (!projectName || !projectDate || !selectedClient || selectedFiles.length === 0) {
      return;
    }

    const formData = new FormData();
    formData.append('projectName', projectName);
    formData.append('projectDate', projectDate.toISOString());
    formData.append('clientId', clients.find(c => c.value === selectedClient)?.label || selectedClient);

    selectedFiles.forEach((file) => {
      formData.append(`images`, file);
    });

    try {
      await onUpload(formData);
      onClose();
      // Reset form
      setStep(1);
      setUploadType(null);
      setSelectedFiles([]);
      setProjectName('');
      setProjectDate(null);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Upload Assets"
      size={step === 3 ? 'xl' : 'md'}
      styles={{
        root: { zIndex: 1000 },
        overlay: { zIndex: 999 }
      }}
    >
      {step === 1 && (
        <Stack>
          <Text>Choose upload type:</Text>
          <Group grow>
            <Button
              variant={uploadType === 'single' ? 'filled' : 'light'}
              onClick={() => {
                setUploadType('single');
                setStep(2);
              }}
            >
              Single Image
            </Button>
            <Button
              variant={uploadType === 'multiple' ? 'filled' : 'light'}
              onClick={() => {
                setUploadType('multiple');
                setStep(2);
              }}
            >
              Multiple Images
            </Button>
          </Group>
        </Stack>
      )}

      {step === 2 && (
        <FileInput
          label="Select Images"
          placeholder="Choose files"
          multiple={uploadType === 'multiple'}
          accept="image/*"
          onChange={(files) => handleFileSelect(Array.isArray(files) ? files : files ? [files] : null)}
        />
      )}

      {step === 3 && (
        <Stack>
          <TextInput
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.currentTarget.value)}
            required
          />
          
          <Box>
            <Text size="sm" fw={500} mb={4}>Project Date *</Text>
            <DatePicker
              selected={projectDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              className="mantine-input"
              wrapperClassName="mantine-datepicker-wrapper"
              required
            />
          </Box>

          <Box>
            <Group align="flex-end">
              <Select
                style={{ flex: 1 }}
                label="Client"
                placeholder="Select client"
                data={clients}
                value={selectedClient}
                onChange={setSelectedClient}
                required
              />
              <ActionIcon
                size={36}
                variant="light"
                onClick={() => setShowNewClientInput(true)}
              >
                <IconPlus size={20} />
              </ActionIcon>
            </Group>

            {showNewClientInput && (
              <Group mt="xs">
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="New client name"
                  value={newClient}
                  onChange={(e) => setNewClient(e.currentTarget.value)}
                />
                <Button onClick={handleAddNewClient}>Add</Button>
              </Group>
            )}
          </Box>

          <Text fw={500} mt="md">Selected Files:</Text>
          <Grid>
            {selectedFiles.map((file, index) => (
              <Grid.Col span={{ base: 6, sm: 4, md: 3 }} key={index}>
                <Card p="xs">
                  <Card.Section>
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      height={150}
                      fit="cover"
                    />
                  </Card.Section>
                  <Text size="sm" mt={4} lineClamp={1}>
                    {file.name}
                  </Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          <Group justify="flex-end" mt="xl">
            <Button onClick={handleSubmit}>Upload Assets</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
} 