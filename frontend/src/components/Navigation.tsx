import { NavLink } from '@mantine/core';
import { IconHome, IconPhoto, IconFolder } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
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

