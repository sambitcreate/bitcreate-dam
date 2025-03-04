import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { MantineProvider, AppShell, Text, Box, Group, Navbar, Header } from '@mantine/core';

// Simple placeholder components for our routes
const Dashboard = () => <Text>Dashboard Page</Text>;
const Assets = () => <Text>Assets Page</Text>;
const Transfers = () => <Text>Transfers Page</Text>;

// Navigation component that uses Link
const Navigation = () => {
  const location = useLocation();

  // Helper function to check if a link is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <Box>
      <Text weight={500} size="lg" mb="md">
        Navigation
      </Text>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            padding: '8px',
            backgroundColor: isActive('/') ? '#e0e0e0' : 'transparent',
            borderRadius: '4px',
            '&:hover': { backgroundColor: '#f0f0f0' },
          }}
        >
          Dashboard
        </Box>
        <Box
          component={Link}
          to="/assets"
          sx={{
            textDecoration: 'none',
            padding: '8px',
            backgroundColor: isActive('/assets') ? '#e0e0e0' : 'transparent',
            borderRadius: '4px',
            '&:hover': { backgroundColor: '#f0f0f0' },
          }}
        >
          Assets
        </Box>
        <Box
          component={Link}
          to="/transfers"
          sx={{
            textDecoration: 'none',
            padding: '8px',
            backgroundColor: isActive('/transfers') ? '#e0e0e0' : 'transparent',
            borderRadius: '4px',
            '&:hover': { backgroundColor: '#f0f0f0' },
          }}
        >
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
          <Navbar width={{ base: 300 }} p="md">
            <Navigation />
          </Navbar>
        }
        header={
          <Header height={60} p="md">
            <Group>
              <Text weight={700} size="xl">
                Jewelry DAM
              </Text>
            </Group>
          </Header>
        }
      >
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