import { NavLink, Stack, Avatar, Group, Text, Modal, FileInput, Button } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconPhoto, IconFolder, IconUser } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

export function Navigation() {
  const location = useLocation();
  const [userModalOpened, setUserModalOpened] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Load user image from localStorage if available
    const savedImage = localStorage.getItem('userProfileImage');
    if (savedImage) {
      setUserImage(savedImage);
    }
  }, []);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleSaveUserImage = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserImage(base64String);
        localStorage.setItem('userProfileImage', base64String);
        setUserModalOpened(false);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <Stack justify="space-between" style={{ height: 'calc(100vh - 60px)' }}>
      <Stack>
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
      </Stack>
      
      <Group p="md" onClick={() => setUserModalOpened(true)} style={{ cursor: 'pointer' }}>
        <Avatar 
          src={userImage} 
          alt="User" 
          color="blue" 
          radius="sm"
        >
          <IconUser size="1.5rem" />
        </Avatar>
        <Text size="sm">User Profile</Text>
      </Group>

      <Modal
        opened={userModalOpened}
        onClose={() => setUserModalOpened(false)}
        title="User Profile"
        centered
        styles={{
          content: { position: 'relative' }
        }}
      >
        <Stack>
          <Group justify="center" p="md">
            <Avatar 
              src={userImage} 
              alt="User" 
              size="xl" 
              radius="sm"
            >
              <IconUser size="2rem" />
            </Avatar>
          </Group>
          <FileInput
            label="Upload Profile Image"
            placeholder="Choose image"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <Button onClick={handleSaveUserImage} disabled={!selectedFile}>
            Save Profile Image
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}

