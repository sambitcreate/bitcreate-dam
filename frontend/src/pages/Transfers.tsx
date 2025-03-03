import React from 'react';
import {
  Title,
  Text,
  Table,
  Button,
  Container,
} from '@mantine/core';

const Transfers: React.FC = () => {
  // Placeholder data for transfers
  const transfers = [
    { id: '1', assetName: 'Diamond Ring', recipient: 'client1@example.com', status: 'Pending' },
    { id: '2', assetName: 'Gold Necklace', recipient: 'client2@example.com', status: 'Completed' },
  ];

  return (
    <Container>
      <Title order={2}>Transfers</Title>
      <Text>Manage your file transfers here.</Text>

      <Table striped mt="md">
        <thead>
          <tr>
            <th>Asset Name</th>
            <th>Recipient</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => (
            <tr key={transfer.id}>
              <td>{transfer.assetName}</td>
              <td>{transfer.recipient}</td>
              <td>{transfer.status}</td>
              <td>
                <Button size="xs">View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default Transfers;

