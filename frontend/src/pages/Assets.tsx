import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  TextInput,
  Group,
  Modal,
  Textarea,
  FileInput,
  Badge,
} from '@mantine/core';
import axios from 'axios';

const Assets = () => {
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
      } else {
        console.error('Failed to create asset');
      }
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  return (
    <div>
      <Group position="apart" mb="md">
        <TextInput
          placeholder="Search assets..."
          onChange={() => {
            // Implement search
          }}
        />
        <Button onClick={() => setOpened(true)}>Create New Asset</Button>
      </Group>

      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Tags</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset: any) => (
            <tr key={asset.id}>
              <td>{asset.name}</td>
              <td>
                <Group spacing="xs">
                  {asset.tags && JSON.parse(asset.tags).map((tag: string) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </Group>
              </td>
              <td>{new Date(asset.created_at).toLocaleString()}</td>
              <td>
                <Button onClick={() => {/* Handle action */}}>
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
        />
        <Textarea
          label="Description"
          placeholder="Asset Description"
          value={newAssetDescription}
          onChange={(event) => setNewAssetDescription(event.currentTarget.value)}
        />
        <TextInput
          label="Tags"
          placeholder="Comma-separated tags"
          value={newAssetTags}
          onChange={(event) => setNewAssetTags(event.currentTarget.value)}
        />
        <FileInput
          label="JPG File"
          accept="image/jpeg"
          onChange={(file) => setNewAssetJpg(file)}
        />
        <FileInput
          label="TIFF File (Optional)"
          accept="image/tiff"
          onChange={(file) => setNewAssetTiff(file)}
        />
        <Button onClick={handleCreateAsset}>Create Asset</Button>
      </Modal>
    </div>
  );
};

export default Assets;
