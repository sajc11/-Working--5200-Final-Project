import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Divider,
  IconButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { updateTooltipTheme } from '../../d3/tooltipUtils';

const Header = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const [animate, setAnimate] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const handleScroll = () => {
      setScrolling(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    updateTooltipTheme();
  }, [theme.palette.mode]);

  const toggleDrawer = () => {
    setOpenMenu(!openMenu);
  };

  const handleMenuItemClick = () => {
    setOpenMenu(false);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: theme.palette.background.default,
        boxShadow: theme.shadows[2],
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* TITLE ROW */}
      <Box
        sx={{
          textAlign: 'center',
          mt: scrolling ? 0 : 3,
          mb: scrolling ? 0 : 0,
          opacity: scrolling ? 0 : (animate ? 1 : 0),
          transform: scrolling ? 'translateY(-50px)' : 'translateY(0)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          height: scrolling ? 0 : 'auto',
          pointerEvents: scrolling ? 'none' : 'auto',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ m: 0 }}>
          CLIMATE RISKS IN RAPIDLY URBANIZING NATIONS
        </Typography>
      </Box>

      {/* NAVIGATION BAR */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: scrolling ? 1 : 2,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Hamburger Menu (Mobile) */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={toggleDrawer}>
            <MenuIcon sx={{ color: theme.palette.text.primary }} />
          </IconButton>
        </Box>

        {/* Drawer Menu */}
        <Drawer anchor="left" open={openMenu} onClose={toggleDrawer}>
          <Box sx={{ width: 250 }}>
            <List>
              {/* Dark Mode Toggle */}
              <ListItem>
                <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </Typography>
                <Switch
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  color="default"
                />
              </ListItem>

              {/* Main Navigation */}
              <ListItemButton component="a" href="/#introduction" onClick={handleMenuItemClick} sx={{ color: 'primary.main' }}>
                PROLOGUE
              </ListItemButton>
              <ListItemButton component="a" href="/#climateDrivers" onClick={handleMenuItemClick} sx={{ color: 'primary.main' }}>
                CLIMATE DRIVERS
              </ListItemButton>
              <ListItemButton component="a" href="/#vulnerabilities" onClick={handleMenuItemClick} sx={{ color: 'primary.main' }}>
                VULNERABILITIES
              </ListItemButton>
              <ListItemButton component="a" href="/#migrationDisplacement" onClick={handleMenuItemClick} sx={{ color: 'primary.main' }}>
                MIGRATION & DISPLACEMENT
              </ListItemButton>
              <ListItemButton component="a" href="/#urbanization" onClick={handleMenuItemClick} sx={{ color: 'primary.main' }}>
                UBRANIZATION
              </ListItemButton>
              <ListItemButton component="a" href="/#conclusion" onClick={handleMenuItemClick} sx={{ color: 'primary.main' }}>
                CONCLUSION
              </ListItemButton>
            </List>

            {/* Divider between sections */}
            <Divider sx={{ my: 1 }} />

            {/* EDA Links with adaptive color */}
            <List>
              <ListItemButton
                component="a"
                href="/Climate_Vulnerability_Analysis.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleMenuItemClick}
                sx={{
                  color: theme.palette.mode === 'dark' ? '#4dabf7' : '#0a1e3f',
                  fontWeight: 600,
                }}
              >
                EDA REPORT
              </ListItemButton>
              <ListItemButton
                component="a"
                href="/gallerygrid"
                onClick={handleMenuItemClick}
                sx={{
                  color: theme.palette.mode === 'dark' ? '#4dabf7' : '#0a1e3f',
                  fontWeight: 600,
                }}
              >
                EDA GALLERY
              </ListItemButton>
              <ListItemButton
                component="a"
                href="/DSAN5200_FinalPaper.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleMenuItemClick}
                sx={{
                  color: theme.palette.mode === 'dark' ? '#4dabf7' : '#0a1e3f',
                  fontWeight: 600,
                }}
              >
                FINAL PAPER (PDF)
              </ListItemButton>
            </List>
          </Box>
        </Drawer>

        {/* Desktop Nav Links */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'center',
            flexGrow: 1,
            '& a': {
              textDecoration: 'none',
              color: theme.palette.text.primary,
              transition: 'all 0.2s ease',
              textUnderlineOffset: '6px',
            },
            '& a:hover': {
              textDecoration: 'underline',
              textDecorationColor: '#6fa8dc',
            },
          }}
        >
          <a href="/#introduction">PROLOGUE</a>
          <a href="/#climateDrivers">CLIMATE DRIVERS</a>
          <a href="/#vulnerabilities">VULNERABILITIES</a>
          <a href="/#migrationDisplacement">MIGRATION & DISPLACEMENT</a>
          <a href="/#urbanization">UBRANIZATION</a>
          <a href="/#conclusion">CONCLUSION</a>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
