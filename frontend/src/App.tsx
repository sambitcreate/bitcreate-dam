import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Assets from './Assets';
import Dashboard from './pages/Dashboard';
import { MantineProvider, createTheme, AppShell } from '@mantine/core';
import '@mantine/core/styles.css';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'sm',
});

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

const App: React.FC = () => {
  const [mobileOpened, setMobileOpened] = useState(false);

  return (
    <ErrorBoundary>
      <MantineProvider theme={theme}>
        <Router>
          <AppShell
            header={{ height: 60 }}
            navbar={{
              width: 300,
              breakpoint: 'sm',
              collapsed: { mobile: !mobileOpened },
            }}
            padding="md"
          >
            <AppShell.Header p="md">
              <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Jewelry DAM</h1>
              </div>
            </AppShell.Header>

            <Navigation mobileOpened={mobileOpened} onMobileOpenedChange={setMobileOpened} />

            <AppShell.Main>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/assets" element={<Assets />} />
              </Routes>
            </AppShell.Main>
          </AppShell>
        </Router>
      </MantineProvider>
    </ErrorBoundary>
  );
};

export default App;