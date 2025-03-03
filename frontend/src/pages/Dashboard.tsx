import React from 'react';
import {
  Title,
  Text,
  Card,
  Container,
} from '@mantine/core';

const Dashboard: React.FC = () => {
  return (
    <Container>
      <Title order={2}>Dashboard</Title>
      <Text>Welcome to the Jewelry DAM System!</Text>

      <Card shadow="sm" padding="lg" radius="md" withBorder mt="md">
        <Title order={3}>Quick Stats</Title>
        <Text>Total Assets: 100</Text>
        <Text>Recent Uploads: 10</Text>
        <Text>Pending Transfers: 5</Text>
      </Card>
    </Container>
  );
};

export default Dashboard;

