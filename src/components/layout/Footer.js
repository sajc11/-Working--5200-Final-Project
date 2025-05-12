import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';
import CollectionsIcon from '@mui/icons-material/Collections';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <Box 
      sx={{
        mt: 10,
        mb: 4,
        py: 3,
        borderTop: theme => `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap'
        }}
      >
        {/* GitHub Link */}
        <Box 
          component={MuiLink}
          href="https://github.com/gu-dsan5200/dsan5200-spring2025-project-group-24.git" 
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 3,
            py: 1.5,
            borderRadius: '4px',
            border: theme => `1px solid ${theme.palette.divider}`,
            backgroundColor: theme => theme.palette.background.paper,
            color: theme => theme.palette.text.primary,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: theme => theme.palette.action.hover,
              borderColor: theme => theme.palette.primary.main
            }
          }}
        >
          <GitHubIcon fontSize="small" color="#f5f5f5" />
          <Typography variant="body1">View on GitHub</Typography>
        </Box>

        {/* Data Gallery Link */}
        <Box 
          component={MuiLink}
          href="/gallerygrid"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 3,
            py: 1.5,
            borderRadius: '4px',
            border: theme => `1px solid ${theme.palette.divider}`,
            backgroundColor: theme => theme.palette.background.paper,
            color: theme => theme.palette.text.primary,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: theme => theme.palette.action.hover,
              borderColor: theme => theme.palette.primary.main
            }
          }}
        >
          <CollectionsIcon fontSize="small" sx={{color:"text.primary"}} />
          <Typography variant="body1"sx={{color:"text.primary"}} >Data Gallery</Typography>
        </Box>
          
        {/* EDA Report */}
        <Box 
          component={MuiLink}
          href="/preprocessing-eda.html"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 3,
            py: 1.5,
            borderRadius: '4px',
            border: theme => `1px solid ${theme.palette.divider}`,
            backgroundColor: theme => theme.palette.background.paper,
            color: theme => theme.palette.text.primary,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: theme => theme.palette.action.hover,
              borderColor: theme => theme.palette.primary.main
            }
          }}
        >
          <DescriptionIcon fontSize="small" color="#f5f5f5" />
          <Typography variant="body1">EDA Report</Typography>
        </Box>

        {/* Final Research Paper */}
        <Box 
          component={MuiLink}
          href="/DSAN5200_FinalPaper.pdf"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 3,
            py: 1.5,
            borderRadius: '4px',
            border: theme => `1px solid ${theme.palette.divider}`,
            backgroundColor: theme => theme.palette.background.paper,
            color: theme => theme.palette.text.primary,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: theme => theme.palette.action.hover,
              borderColor: theme => theme.palette.primary.main
            }
          }}
        >
          <DescriptionIcon fontSize="small" color="#f5f5f5" />
          <Typography variant="body1">Research Paper (PDF)</Typography>
        </Box>
      </Box>

      <Typography 
        variant="body1" 
        color="textSecondary"
        sx={{ 
          textAlign: 'center',
          opacity: 0.8 
        }}
      >
        © {new Date().getFullYear()} DSAN 5200 Final Project. Built with D3, React, and Material UI.
      </Typography>
    </Box>
  );
};

export default Footer;