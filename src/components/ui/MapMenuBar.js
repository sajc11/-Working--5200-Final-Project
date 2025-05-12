import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Fade from '@mui/material/Fade';

const FILTERS = [
  { label: 'Flood Days', value: 'floodDays' },
  { label: 'Sea Level', value: 'seaLevel' },
  { label: 'Extreme Heat', value: 'extremeHeat' },
  { label: 'Migration', value: 'migration' },
];

const PROJECTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Bangladesh', value: 'bangladesh' },
  { label: 'Maldives', value: 'maldives' },
  { label: 'Philippines', value: 'philippines' },
];

export default function MapMenuBar({
  selectedYear,
  setSelectedYear,
  availableYears,
  activeOverlays,
  setActiveOverlays,
  projectionCenter,
  setProjectionCenter,
  handleResetFilters,
  handleProjectionChange,
}) {
  const [menuOpen, setMenuOpen] = useState(true);
  const [yearSearch, setYearSearch] = useState('');

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleFilterClick = (filter) => {
    if (activeOverlays.includes(filter)) {
      setActiveOverlays(activeOverlays.filter((f) => f !== filter));
    } else {
      setActiveOverlays([...activeOverlays, filter]);
    }
  };

  const handleYearSearchChange = (event) => {
    setYearSearch(event.target.value);
  };

  const filteredYears = availableYears.filter((year) =>
    year.toString().includes(yearSearch)
  );

  const handleProjection = (event, newProjection) => {
    if (newProjection !== null) {
      setProjectionCenter(newProjection);
      handleProjectionChange(newProjection);
    }
  };

  return (
    <Box
      sx={{
        width: menuOpen ? 360 : 48,
        bgcolor: 'background.paper',
        boxShadow: 3,
        p: 1,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        transition: 'width 0.3s ease',
        overflowX: 'auto',
      }}
      aria-label="Map menu bar"
    >
      <Tooltip title={menuOpen ? 'Close menu' : 'Open menu'}>
        <IconButton onClick={toggleMenu} size="large" aria-label="Toggle menu">
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </Tooltip>

      {menuOpen && (
        <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              flexGrow: 1,
              width: '100%',
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box
                component="h3"
                sx={{
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: '8px',
                  paddingBottom: '4px',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  color: 'text.primary',
                }}
              >
                Data Layers
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  minWidth: 180,
                  marginBottom: 2,
                }}
              >
                {FILTERS.map(({ label, value }) => (
                  <Tooltip key={value} title={`Toggle ${label} overlay`}>
                    <Chip
                      label={label}
                      color={activeOverlays.includes(value) ? 'primary' : 'default'}
                      onClick={() => handleFilterClick(value)}
                      variant={activeOverlays.includes(value) ? 'filled' : 'outlined'}
                      clickable
                      aria-pressed={activeOverlays.includes(value)}
                      size="small"
                      sx={{
                        px: 1.5,
                        transition: 'color 0.3s ease, background-color 0.3s ease',
                        bgcolor: activeOverlays.includes(value)
                          ? 'primary.main'
                          : 'background.paper',
                        color: activeOverlays.includes(value)
                          ? 'primary.contrastText'
                          : 'text.primary',
                        borderColor: activeOverlays.includes(value)
                          ? 'primary.main'
                          : 'divider',
                        '&:hover': {
                          bgcolor: activeOverlays.includes(value)
                            ? 'primary.dark'
                            : 'action.hover',
                          color: activeOverlays.includes(value)
                            ? 'primary.contrastText'
                            : 'text.primary',
                          borderColor: activeOverlays.includes(value)
                            ? 'primary.dark'
                            : 'primary.main',
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>

            <Fade in={true} key={selectedYear} timeout={300}>
              <Box sx={{ minWidth: 100, maxWidth: 120 }}>
                <FormControl size="small" variant="outlined" fullWidth>
                  <Tooltip title="Select year">
                    <Select
                      displayEmpty
                      value={selectedYear || ''} // Use empty string instead of null/undefined
                      onChange={(e) => setSelectedYear(e.target.value)}
                      renderValue={(selected) => selected || 'Year'}
                      size="small"
                      aria-label="Select year"
                      MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                      sx={{ mr: 1, transition: 'all 0.3s ease', minWidth: 100 }}
                    >
                      <MenuItem disabled>
                        <TextField
                          size="small"
                          autoFocus
                          placeholder="Search year"
                          value={yearSearch}
                          onChange={handleYearSearchChange}
                          onClick={(e) => e.stopPropagation()}
                          inputProps={{ 'aria-label': 'Search year' }}
                          fullWidth
                        />
                      </MenuItem>
                      {filteredYears.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </Tooltip>
                </FormControl>
              </Box>
            </Fade>

            <Tooltip title="Select projection orientation">
              <ToggleButtonGroup
                value={projectionCenter}
                exclusive
                onChange={handleProjection}
                aria-label="Projection orientation"
                size="small"
                sx={{ mr: 1, flexWrap: 'wrap' }}
              >
                {PROJECTIONS.map(({ label, value }) => (
                  <ToggleButton
                    key={value}
                    value={value}
                    aria-label={label}
                    sx={{
                      transition: 'border-color 0.3s ease, background-color 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Tooltip>

            <Box sx={{ flexGrow: 1, minWidth: 48 }} />

            <Tooltip title="Reset all filters">
              <IconButton
                onClick={handleResetFilters}
                aria-label="Reset filters"
                size="large"
                color="secondary"
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );
}
