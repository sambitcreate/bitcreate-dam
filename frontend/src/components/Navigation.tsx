import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Input, ActionIcon, Modal, List, Group, AppShell, Burger, Alert, Text } from '@mantine/core';
import { IconBell, IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';

// Define a type for the upload log
interface UploadLog {
  message: string;
  timestamp?: string;
}

interface NavigationProps {
  mobileOpened: boolean;
  onMobileOpenedChange: (opened: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ mobileOpened, onMobileOpenedChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpened, setNotificationsOpened] = useState(false);
  const [uploadLog, setUploadLog] = useState<UploadLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUploadLog = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/uploads/log');
        
        // Validate response data
        if (!response.data) {
          throw new Error('No data received from the API');
        }

        // Handle different response formats
        let logData = response.data;
        if (!Array.isArray(response.data)) {
          if (response.data.logs && Array.isArray(response.data.logs)) {
            logData = response.data.logs;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            logData = response.data.data;
          } else {
            console.warn('Unexpected API response format:', response.data);
            throw new Error('Invalid response format from server');
          }
        }

        // Validate and transform each log entry
        const validatedLogs = logData.map((log: any): UploadLog => {
          if (typeof log === 'string') {
            return { message: log };
          }
          return {
            message: log.message || 'Unknown message',
            timestamp: log.timestamp,
          };
        });

        setUploadLog(validatedLogs);
      } catch (err) {
        console.error('Error fetching upload log:', err);
        setError(err instanceof Error ? err.message : 'Failed to load upload log');
        setUploadLog([]); // Reset to empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (notificationsOpened) {
      fetchUploadLog();
    }
  }, [notificationsOpened]);

  const navLinkStyle = {
    display: 'block',
    textDecoration: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    marginBottom: '5px',
    color: 'inherit',
    '&:hover': {
      backgroundColor: 'var(--mantine-color-blue-0)',
    },
    '&.active': {
      backgroundColor: 'var(--mantine-color-blue-1)',
      fontWeight: 'bold',
    },
  };

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section>
        <Group justify="space-between" align="center" mb="md">
          <Burger
            opened={mobileOpened}
            onClick={() => onMobileOpenedChange(!mobileOpened)}
            hiddenFrom="sm"
            size="sm"
          />
          <Group ml="auto" gap="xs">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              size="sm"
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setNotificationsOpened(true)}
            >
              <IconBell size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Section>

      <AppShell.Section grow>
        <NavLink to="/" style={navLinkStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/assets" style={navLinkStyle}>
          Assets
        </NavLink>
        <NavLink to="/transfers" style={navLinkStyle}>
          Transfers
        </NavLink>
      </AppShell.Section>

      <Modal
        opened={notificationsOpened}
        onClose={() => setNotificationsOpened(false)}
        title="Upload Log"
      >
        {loading && <Text>Loading...</Text>}
        
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {!loading && !error && uploadLog.length === 0 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="No Uploads"
            color="blue"
            variant="light"
          >
            No upload logs found.
          </Alert>
        )}

        {!loading && !error && uploadLog.length > 0 && (
          <List>
            {uploadLog.map((log, index) => (
              <List.Item key={index}>
                {log.timestamp && (
                  <Text size="sm" c="dimmed">
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                )}
                <Text>{log.message}</Text>
              </List.Item>
            ))}
          </List>
        )}
      </Modal>
    </AppShell.Navbar>
  );
};

export default Navigation;

