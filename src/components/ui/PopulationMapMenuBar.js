import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import InfoIcon from '@mui/icons-material/Info';
import FilterListIcon from '@mui/icons-material/FilterList';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';

const CITIES = [
  { label: 'Bangladesh', value: 'Bangladesh', description: 'Highly vulnerable to flooding and sea level rise' },
  { label: 'Maldives', value: 'Maldives', description: 'Island nation at risk of submersion' },
  { label: 'Philippines', value: 'Philippines', description: 'Exposed to typhoons and coastal flooding' },
];

const SCENARIOS = [
  { label: 'Baseline Scenario', value: 'baseline', description: 'Current projections based on historical data' },
  { label: 'Moderate Impact', value: 'scenario1', description: '25% increase in climate-related risks' },
  { label: 'High Impact', value: 'scenario2', description: '50% increase in climate-related risks' },
];

export default function PopulationMapMenuBar({
  selectedCities,
  setSelectedCities,
  scenario,
  setScenario,
  colors,
}) {
  const [menuOpen, setMenuOpen] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const theme = useTheme();

  const toggleCity = (city) => {
    if (selectedCities.includes(city)) {
      if (selectedCities.length > 1) {
        setSelectedCities(selectedCities.filter(c => c !== city));
      }
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const handleReset = () => {
    setSelectedCities(['Bangladesh']);
    setScenario('baseline');
  };
  
  // Find the current scenario object
  const currentScenario = SCENARIOS.find(s => s.value === scenario) || SCENARIOS[0];

  return (
    <Paper
      elevation={3}
      sx={{
        width: '100%',
        maxWidth: '100%',
        bgcolor: theme.palette.mode === 'dark' 
          ? theme.palette.background.paper 
          : theme.palette.background.paper,
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        overflow: 'visible',
        height: menuOpen ? 'auto' : '60px',
        minHeight: '60px',
        borderRadius: 2,
        marginBottom: 3,
        border: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        zIndex: 10,
      }}
      aria-label="Population chart controls"
    >
      {/* Header bar */}
      <Box 
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          borderBottom: menuOpen ? `2px solid ${theme.palette.divider}` : 'none',
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.05)' 
            : 'rgba(0,0,0,0.03)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon 
            fontSize="small" 
            sx={{ opacity: 0.7, color: theme.palette.text.secondary }}
          />
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' },
              color: theme.palette.text.secondary,
            }}
          >
            Data Filters
          </Typography>
          
          {/* Selected cities chips - only show when menu is collapsed */}
          {!menuOpen && (
            <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
              {selectedCities.map(city => (
                <Chip
                  key={city}
                  label={city}
                  size="small"
                  sx={{
                    bgcolor: colors?.cityPalette?.[city] || theme.palette.primary.main,
                    color: theme.palette.getContrastText(colors?.cityPalette?.[city] || theme.palette.primary.main),
                    height: 24,
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: '0.7rem',
                    }
                  }}
                />
              ))}
              <Chip
                label={currentScenario.label}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.7rem',
                  }
                }}
              />
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="About this data">
            <IconButton
              onClick={() => setShowInfo(!showInfo)}
              size="small"
              sx={{ color: theme.palette.text.secondary, opacity: 0.9 }}
              aria-label="Show information"
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={menuOpen ? "Collapse menu" : "Expand menu"}>
            <IconButton
              onClick={() => setMenuOpen(!menuOpen)}
              size="small"
              sx ={{ color: theme.palette.text.secondary, opacity: 0.9 }}
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Information panel */}
      <Zoom in={showInfo && menuOpen}>
        <Box 
          sx={{ 
            p: showInfo && menuOpen ? 2 : 0,
            height: showInfo && menuOpen ? 'auto' : 0,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.2)' 
              : 'rgba(0,0,0,0.03)',
            borderBottom: showInfo && menuOpen ? `1px solid ${theme.palette.divider}` : 'none',
          }}
        >
          {showInfo && menuOpen && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                About this visualization
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.875rem' }}>
                This chart shows population at risk from climate change impacts across three vulnerable countries.
                You can select different countries to compare and choose from three climate scenarios to see how
                population risk changes under different conditions.
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Climate Scenarios:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {SCENARIOS.map(({ label, value, description }) => (
                  <Box key={value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%',
                        bgcolor: value === 'baseline' 
                          ? theme.palette.success.main 
                          : value === 'scenario1' 
                            ? theme.palette.warning.main 
                            : theme.palette.error.main
                      }} 
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {label}:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Zoom>

      {/* Main filter content */}
      {menuOpen && (
        <Fade in={menuOpen}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2, 
            p: 2,
          }}>
            {/* Country selection section */}
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1, 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 0.5,
                  color: theme.palette.text.primary,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  paddingBottom: '4px',
                }}
              >
                Countries
              </Typography>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                }}
              >
                {CITIES.map(({ label, value, description }) => (
                  <Tooltip 
                    key={value} 
                    title={description}
                    placement="top"
                    arrow
                  >
                    <Button
                      onClick={() => toggleCity(value)}
                      variant={selectedCities.includes(value) ? 'contained' : 'outlined'}
                      size="small"
                      disableElevation
                      aria-pressed={selectedCities.includes(value)}
                      sx={{
                        color: selectedCities.includes(value) 
                          ? theme.palette.getContrastText(colors?.cityPalette?.[value] || theme.palette.primary.main) 
                          : theme.palette.text.primary,
                        bgcolor: selectedCities.includes(value) 
                          ? colors?.cityPalette?.[value] || theme.palette.primary.main 
                          : 'transparent',
                        borderColor: colors?.cityPalette?.[value] || theme.palette.primary.main,
                        borderWidth: selectedCities.includes(value) ? 1 : 1,
                        '&:hover': {
                          bgcolor: selectedCities.includes(value) 
                            ? colors?.cityPalette?.[value] || theme.palette.primary.dark 
                            : theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.08)' 
                              : 'rgba(0,0,0,0.04)',
                          borderColor: colors?.cityPalette?.[value] || theme.palette.primary.main,
                        },
                        transition: 'all 0.2s ease',
                        minWidth: '100px',
                        px: 1.2,
                        py: 0.4,
                        borderRadius: 4,
                        textTransform: 'none',
                        fontWeight: selectedCities.includes(value) ? 600 : 500,
                        fontSize: '0.85rem',
                      }}
                    >
                      {label}
                    </Button>
                  </Tooltip>
                ))}
              </Box>
            </Box>
            
            <Divider />
            
            {/* Scenario selection section */}
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1, 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 0.5,
                  color: theme.palette.text.primary,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  paddingBottom: '4px',
                }}
              >
                Climate Scenario
              </Typography>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                }}
              >
                {SCENARIOS.map(({ label, value, description }) => (
                  <Tooltip 
                    key={value} 
                    title={description}
                    placement="top"
                    arrow
                  >
                    <Button
                      onClick={() => setScenario(value)}
                      variant={scenario === value ? 'contained' : 'outlined'}
                      size="extraSmall"
                      disableElevation
                      aria-pressed={scenario === value}
                      color={
                        value === 'baseline' 
                          ? 'success' 
                          : value === 'scenario1' 
                            ? 'warning' 
                            : 'error'
                      }
                      sx={{
                        transition: 'all 0.2s ease',
                        minWidth: '130px',
                        px: 1.2,
                        py: 0.4,
                        borderRadius: 4,
                        textTransform: 'none',
                        fontWeight: scenario === value ? 600 : 500,
                        fontSize: '0.85rem',
                      }}
                    >
                      {label}
                    </Button>
                  </Tooltip>
                ))}
              </Box>
            </Box>
            
            
            
            {/* Actions section */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              pt: 1,
            }}>
              <Tooltip title="Reset to default selections">
                <Button
                  onClick={handleReset}
                  color="secondary"
                  size="medium"
                  startIcon={<RestartAltIcon />}
                  sx={{
                    borderRadius: 10,
                  }}
                >
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Fade>
      )}
    </Paper>
  );
}
