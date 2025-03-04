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
  Text,
} from '@mantine/core';
import axios from 'axios';

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [opened, setOpened] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetDescription, setNewAssetDescription] = useState('');
  const [newAssetTags, setNewAssetTags] = useState('');
  const [newAssetJpg, setNewAssetJpg] = useState<File | null>(null);
  const [newAssetTiff, setNewAssetTiff] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchQuery, assets]);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('http://localhost:3091/api/assets');
      setAssets(response.data);
      setFilteredAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setError('Failed to fetch assets. Please try again later.');
    }
  };

  const filterAssets = () => {
    const filtered = assets.filter((asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAssets(filtered);
  };

  const handleCreateAsset = async () => {
    if (!newAssetName || !newAssetDescription || !newAssetJpg) {
      setError('Name, description, and JPG file are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newAssetName);
      formData.append('description', newAssetDescription);
      formData.append('tags', newAssetTags);
      formData.append('jpg', newAssetJpg as File);
      if (newAssetTiff) {
        formData.append('tiff', newAssetTiff as File);
      }

      const response = await axios.post('http://localhost:3091/api/assets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        fetchAssets();
        setOpened(false);
        setNewAssetName('');
        setNewAssetDescription('');
        setNewAssetTags('');
        setNewAssetJpg(null);
        setNewAssetTiff(null);
        setError('');
      } else {
        setError('Failed to create asset. Please try again.');
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      setError('An error occurred while creating the asset.');
    }
  };

  return (
    <div>
      <Group position="apart" mb="md">
        <TextInput
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={() => setOpened(true)}>Create New Asset</Button>
      </Group>

      {error && (
        <Text color="red" mb="md">
          {error}
        </Text>
      )}

      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Tags</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAssets.map((asset) => (
            <tr key={asset.id}>
              <td>{asset.name}</td>
              <td>
                <Group spacing="sm">
                  {asset.tags &&
                    JSON.parse(asset.tags).map((tag: string) => (
                      <Badge key={tag} color="blue">
                        {tag}
                      </Badge>
                    ))}
                </Group>
              </td>
              <td>{new Date(asset.created_at).toLocaleString()}</td>
              <td>
                <Button onClick={() => alert('Send via WeTransfer')}>
                  Send via WeTransfer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Create New Asset">
        <TextInput
          label="Name"
          placeholder="Asset Name"
          value={newAssetName}
          onChange={(event) => setNewAssetName(event.currentTarget.value)}
          required
          mb="md"
        />
        <Textarea
          label="Description"
          placeholder="Asset Description"
          value={newAssetDescription}
          onChange={(event) => setNewAssetDescription(event.currentTarget.value)}
          required
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
          onChange={(file) => setNewAssetJpg(file)}
          required
          mb="md"
        />
        <FileInput
          label="TIFF File (Optional)"
          accept="image/tiff"
          onChange={(file) => setNewAssetTiff(file)}
          mb="md"
        />
        <Button onClick={handleCreateAsset} fullWidth>
          Create Asset
        </Button>
      </Modal>
    </div>
  );
};

export default Assets;