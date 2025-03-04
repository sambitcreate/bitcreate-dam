import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppShell, NavLink, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { IconHome, IconPhoto, IconFolder } from '@tabler/icons-react';
import Dashboard from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Projects } from './pages/Projects';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function Navigation() {
  const location = useLocation();

  return (
    <>
      <NavLink
        label="Dashboard"
        leftSection={<IconHome size="1rem" />}
        component={Link}
        to="/"
        active={location.pathname === '/'}
      />
      <NavLink
        label="Assets"
        leftSection={<IconPhoto size="1rem" />}
        component={Link}
        to="/assets"
        active={location.pathname === '/assets'}
      />
      <NavLink
        label="Projects"
        leftSection={<IconFolder size="1rem" />}
        component={Link}
        to="/projects"
        active={location.pathname === '/projects'}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <MantineProvider>
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
            <AppShell.Main>
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