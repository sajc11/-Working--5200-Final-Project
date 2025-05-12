import React from 'react';
import { Box, Typography, Card, useTheme } from '@mui/material';

const ThemeAwareChartWrapper = React.forwardRef(({ 
  children, 
  title, 
  className = "chart-container chart-card",
  showTitle = true,
  disableHover = false,
  sx = {}
}, ref) => {
  const theme = useTheme();
  
  return (
    <Card
      elevation={4}
      ref={ref}
      className={className}
      sx={{
        borderRadius: 3,
        overflow: 'visible',
        mt: 5,
        mb: 4,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.default,
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        },
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 16px rgba(0,0,0,0.4)'
          : '0 8px 16px rgba(0,0,0,0.1)',
        maxWidth: 900,
        margin: 'top: 40, right: 70, bottom: 80, left: 100',
        color: theme.palette.text.primary,
        ...sx
      }}
    >
      <Box sx={{ p: { xs: 3, sm: 4 }, pb: 0 }}>
        {showTitle && title && (
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              fontWeight: 600, 
              color: '#fff', 
              mb: 0.5 
            }}
          >
            {title}
          </Typography>
        )}
      </Box>
      {children}
    </Card>
  );
});

ThemeAwareChartWrapper.displayName = 'ThemeAwareChartWrapper';

export default ThemeAwareChartWrapper;
