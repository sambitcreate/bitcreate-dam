import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  TextInput,
  Group,
  Modal,
  Textarea,
  FileInput,
  Badge,
  Box,
} from '@mantine/core';
import axios from 'axios';

const Assets: React.FC = () => {
  const [assets, setAssets] = useState([]);
  const [opened, setOpened] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetDescription, setNewAssetDescription] = useState('');
  const [newAssetTags, setNewAssetTags] = useState('');
  const [newAssetJpg, setNewAssetJpg] = useState<File | null>(null);
  const [newAssetTiff, setNewAssetTiff] = useState<File | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('http://localhost:3091/api/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleCreateAsset = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newAssetName);
      formData.append('description', newAssetDescription);
      formData.append('tags', newAssetTags);
      formData.append('jpg', newAssetJpg as File);
      if (newAssetTiff) {
        formData.append('tiff', newAssetTiff as File);
      }

      const response = await axios.post(
        'http://localhost:3091/api/assets',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 201) {
        fetchAssets();
        setOpened(false);
        setNewAssetName('');
        setNewAssetDescription('');
        setNewAssetTags('');
        setNewAssetJpg(null);
        setNewAssetTiff(null);
      } else {
        console.error('Failed to create asset');
      }
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  return (
    <Box p="md">
      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="Search assets..."
          onChange={() => {
            // Implement search
          }}
        />
        <Button onClick={() => setOpened(true)}>Create New Asset</Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Tags</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {assets.map((asset: any) => (
            <Table.Tr key={asset.id}>
              <Table.Td>{asset.name}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {asset.tags &&
                    JSON.parse(asset.tags).map((tag: string) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                </Group>
              </Table.Td>
              <Table.Td>{new Date(asset.created_at).toLocaleString()}</Table.Td>
              <Table.Td>
                <Button onClick={() => {/* Handle action */}}>
                  Send via WeTransfer
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Create New Asset"
      >
        <Box component="form" maw={400} mx="auto">
          <TextInput
            label="Name"
            placeholder="Asset Name"
            value={newAssetName}
            onChange={(event) => setNewAssetName(event.currentTarget.value)}
            mb="md"
          />
          <Textarea
            label="Description"
            placeholder="Asset Description"
            value={newAssetDescription}
            onChange={(event) =>
              setNewAssetDescription(event.currentTarget.value)
            }
            mb="md"
          />
          <TextInput
            label="Tags"
            placeholder="Comma-separated tags"
            value={newAssetTags}
            onChange={(event) => setNewAssetTags(event.currentTarget.value)}
            mb="md"
          />
          <FileInput
            label="JPG File"
            accept="image/jpeg"
            onChange={setNewAssetJpg}
            value={newAssetJpg}
            mb="md"
          />
          <FileInput
            label="TIFF File (Optional)"
            accept="image/tiff"
            onChange={setNewAssetTiff}
            value={newAssetTiff}
            mb="md"
          />
          <Button onClick={handleCreateAsset} fullWidth>
            Create Asset
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Assets;
