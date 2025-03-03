import React from 'react';
import { NavLink } from 'react-router-dom';
import { createStyles } from '@mantine/core';

const useStyles = createStyles((theme) => ({
  navLink: {
    display: 'block',
    textDecoration: 'none',
    color: theme.colorScheme === 'dark' ? theme.colors.gray[0] : theme.colors.dark[9],
    padding: '10px 15px',
    borderRadius: theme.radius.sm,
    fontWeight: 500,
    marginBottom: 5,
    
    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' 
        ? theme.colors.dark[6] 
        : theme.colors.gray[1],
    },
    
    '&.active': {
      backgroundColor: theme.colorScheme === 'dark' 
        ? theme.colors.dark[5] 
        : theme.colors.gray[2],
    }
  }
}));

const Navigation: React.FC = () => {
  const { classes } = useStyles();
  
  return (
    <nav>
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          isActive ? `${classes.navLink} active` : classes.navLink
        }
      >
        Dashboard
      </NavLink>
      <NavLink 
        to="/assets" 
        className={({ isActive }) => 
          isActive ? `${classes.navLink} active` : classes.navLink
        }
      >
        Assets
      </NavLink>
      <NavLink 
        to="/transfers" 
        className={({ isActive }) => 
          isActive ? `${classes.navLink} active` : classes.navLink
        }
      >
        Transfers
      </NavLink>
    </nav>
  );
};

export default Navigation;

