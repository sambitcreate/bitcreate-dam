import { Routes, Route, Link } from 'react-router-dom';
import { MantineProvider, AppShell, Text, Box, Group, Navbar, Header } from '@mantine/core';

// Simple placeholder components for our routes
const Dashboard = () => <div>Dashboard Page</div>;
const Assets = () => <div>Assets Page</div>;
const Transfers = () => <div>Transfers Page</div>;

// Navigation component that uses Link
const Navigation = () => {
  return (
    <Box>
      <Text weight={500} size="lg" mb="md">Navigation</Text>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box component={Link} to="/" sx={{ textDecoration: 'none', padding: '8px' }}>
          Dashboard
        </Box>
        <Box component={Link} to="/assets" sx={{ textDecoration: 'none', padding: '8px' }}>
          Assets
        </Box>
        <Box component={Link} to="/transfers" sx={{ textDecoration: 'none', padding: '8px' }}>
          Transfers
        </Box>
      </Box>
    </Box>
  );
};

// Main App component
const App = () => {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <AppShell
        padding="md"
        navbar={
          <Navbar width={{ base: 300 }}>
            <Navigation />
          </Navbar>
        }
        header={
          <Header height={60}>
            <Group p="md">
              <Text weight={700} size="xl">Jewelry DAM</Text>
            </Group>
          </Header>
        }
      >
        {/* In Mantine v6, AppShell.Main doesn't exist, content goes directly inside AppShell */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/transfers" element={<Transfers />} />
        </Routes>
      </AppShell>
    </MantineProvider>
  );
};

export default App;
