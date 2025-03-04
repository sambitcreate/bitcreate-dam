import { Modal, Text, Group, Stack, Badge, Image } from '@mantine/core';

interface Asset {
  id: string;
  name: string;
  description?: string;
  tags?: string;
  project_name?: string;
  project_date?: string;
  client_name?: string;
  jpg_url: string;
  created_at: string;
}

interface AssetDetailsProps {
  asset: Asset | null;
  onClose: () => void;
}

export function AssetDetails({ asset, onClose }: AssetDetailsProps) {
  if (!asset) return null;

  return (
    <Modal
      opened={!!asset}
      onClose={onClose}
      size="xl"
      title={asset.name}
      styles={{
        root: { zIndex: 1000 },
        overlay: { zIndex: 999 },
        body: { backgroundColor: 'white' }
      }}
    >
      <Group align="flex-start" grow>
        <div style={{ flex: 2 }}>
          <Image
            src={asset.jpg_url}
            alt={asset.name}
            fit="contain"
            style={{ maxHeight: '70vh', width: '100%', backgroundColor: 'white' }}
          />
        </div>
        <Stack style={{ flex: 1 }}>
          <Text fw={500}>Details</Text>
          
          <Text size="sm">
            <strong>Upload Date:</strong>{' '}
            {new Date(asset.created_at).toLocaleDateString()}
          </Text>

          {asset.project_name && (
            <Text size="sm">
              <strong>Project:</strong> {asset.project_name}
            </Text>
          )}

          {asset.project_date && (
            <Text size="sm">
              <strong>Project Date:</strong>{' '}
              {new Date(asset.project_date).toLocaleDateString()}
            </Text>
          )}

          {asset.client_name && (
            <Text size="sm">
              <strong>Client:</strong> {asset.client_name}
            </Text>
          )}

          {asset.description && (
            <>
              <Text fw={500} mt="md">Description</Text>
              <Text size="sm">{asset.description}</Text>
            </>
          )}

          {asset.tags && (
            <>
              <Text fw={500} mt="md">Tags</Text>
              <Group>
                {asset.tags.split(',').map((tag, index) => (
                  <Badge key={index}>{tag.trim()}</Badge>
                ))}
              </Group>
            </>
          )}
        </Stack>
      </Group>
    </Modal>
  );
} 