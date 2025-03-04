import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Box,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Grid,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';
import { UploadModal } from './components/UploadModal';

interface Transfer {
  id: number;
  name: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  recipient_email: string;
  message?: string;
}

const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Transfer[]>('http://localhost:3091/api/transfers');
      setTransfers(response.data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setError('Failed to fetch transfers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:3091/api/transfers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        await fetchTransfers();
        setOpened(false);
      } else {
        throw new Error('Failed to create transfer');
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      setError('An error occurred while creating the transfer.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Transfer['status']) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      default:
        return 'yellow';
    }
  };

  return (
    <Container size="xl" p="md" style={{ maxWidth: '100%' }}>
      <LoadingOverlay visible={loading} />

      <Box mb="xl">
        <Group justify="space-between">
          <Title order={2}>Transfers</Title>
          <Button onClick={() => setOpened(true)}>Add New</Button>
        </Group>
      </Box>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          variant="light"
          mb="lg"
        >
          {error}
        </Alert>
      )}

      <Grid>
        {transfers.map((transfer) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={transfer.id}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={500} size="lg" lineClamp={1}>
                {transfer.name}
              </Text>
              <Text size="sm" c="dimmed" mt="xs">
                Recipient: {transfer.recipient_email}
              </Text>
              <Text size="sm" c="dimmed">
                Date: {new Date(transfer.created_at).toLocaleDateString()}
              </Text>
              <Box mt="md">
                <Badge color={getStatusColor(transfer.status)}>
                  {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                </Badge>
              </Box>
              {transfer.message && (
                <Text size="sm" mt="sm" lineClamp={2}>
                  {transfer.message}
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

export default Transfers; 