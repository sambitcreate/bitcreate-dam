import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { MantineProvider, AppShell, Text } from '@mantine/core';
import type { MantineThemeOverride } from '@mantine/core';

import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Transfers from './pages/Transfers';

// Define the theme
const theme: MantineThemeOverride = {
  components: {
    AppShell: {
      styles: {
        main: {
          backgroundColor: 'var(--mantine-color-gray-0)',
          '@media (prefers-color-scheme: dark)': {
            backgroundColor: 'var(--mantine-color-dark-8)',
          },
        },
      },
    },
  },
};

const App: React.FC = () => {
  return (
    <MantineProvider
      withCssVariables
      defaultColorScheme="light"
      theme={theme}
    >
      <AppShell
        padding="md"
        navbar={{ width: 300, breakpoint: 'sm' }}
        header={{ height: 60 }}
      >
        <AppShell.Navbar p="md">
          <Text fw={500} size="lg">
            Navigation
          </Text>
          <Link to="/">Dashboard</Link>
          <Link to="/assets">Assets</Link>
          <Link to="/transfers">Transfers</Link>
        </AppShell.Navbar>

        <AppShell.Header p="md">
          <Text fw={700} size="xl">
            Jewelry DAM
          </Text>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/transfers" element={<Transfers />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
};

export default App;
