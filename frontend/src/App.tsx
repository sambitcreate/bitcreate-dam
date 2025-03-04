import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider, AppShell, Title, Group } from '@mantine/core';
import '@mantine/core/styles.css';
import { ErrorBoundary } from 'react-error-boundary';
import { Notifications } from '@mantine/notifications';
import { Navigation } from './components/Navigation';
import Dashboard from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Projects } from './pages/Projects';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Something went wrong.</h1>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>Reload Page</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MantineProvider>
        <Notifications position="top-right" zIndex={1000} />
        <Router>
          <AppShell
            navbar={{ width: 300, breakpoint: 'sm' }}
            padding="md"
            styles={{
              main: {
                background: '#f8f9fa',
              },
            }}
          >
            <AppShell.Navbar p="xs">
              <Navigation />
            </AppShell.Navbar>
            <AppShell.Header p="xs">
              <Group h="100%" px="md" justify="space-between">
                <Title order={1} size="h2">Asset Manager</Title>
              </Group>
            </AppShell.Header>
            <AppShell.Main pt={60}>
              <div style={{ minHeight: '100vh', width: '100%' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/projects" element={<Projects />} />
                </Routes>
              </div>
            </AppShell.Main>
          </AppShell>
        </Router>
      </MantineProvider>
    </ErrorBoundary>
  );
}

export default App;