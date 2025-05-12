import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Box, Button, Typography, Slider, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import ThemeAwareChartWrapper from '../ui/ThemeAwareChartWrapper';
import { useTheme } from '@mui/material/styles';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { createTooltip, showTooltip, hideTooltip } from "../../d3/tooltipUtils";

const FloodSeverityMap = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [currentYear, setCurrentYear] = useState(2000);
  const [selectedCountries, setSelectedCountries] = useState(['Bangladesh', 'Philippines']);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [animationSpeed, setAnimationSpeed] = useState(700);
  const [helpHovered, setHelpHovered] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    // Load flood data
    d3.json('/data/processed_flood_days.json').then((loadedData) => {
      setData(loadedData);
      
      // Get available years from the data
      const years = [...new Set(loadedData.map(d => +d.Year))].sort((a, b) => a - b);
      setAvailableYears(years);
      setCurrentYear(years[0] || 2000);
    });
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Filter data for current year and selected countries
    const filteredData = data.filter(d => 
      +d.Year === currentYear && 
      selectedCountries.includes(d.Country)
    );

    renderMap(filteredData);
  }, [data, currentYear, selectedCountries, theme]);

  const renderMap = (filteredData) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // Clear SVG completely first
    svg.selectAll("*").remove();
    
    // Create new group
    const g = svg.append('g').attr('class', 'map-group');

    const width = 800;
    const height = 500;
    const margin = { top: 40, right: 60, bottom: 100, left: 60 }; // Adjusted margins to match other charts

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Improved projection to show all of Philippines
    const projection = d3.geoMercator()
      .center([112, 8])
      .scale((width / 320) * 300)
      .translate([width / 2.15, height / 2]);
    
    const path = d3.geoPath(projection);

    // Create tooltip
    const tooltip = createTooltip(theme);

    // Load world map
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world) => {
      const countries = topojson.feature(world, world.objects.countries);

      const g = svg.select('.map-group');

      // Define theme-aware colors
      const severityColors = {
        Minor: theme.palette.mode === 'dark' ? '#64b5f6' : '#2196f3',
        Moderate: theme.palette.mode === 'dark' ? '#ffb74d' : '#ff9800',
        Major: theme.palette.mode === 'dark' ? '#ef5350' : '#f44336'
      };

      // Theme-aware map colors
      const mapColors = {
        // More transparent base fill for countries
        baseCountry: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.03)',
        // Darker base stroke for country borders (increased visibility)
        baseStroke: theme.palette.mode === 'dark' ? '#eeeeee' : '#444444',
        // High-contrast country boundary strokes (darkened)
        countryStroke: theme.palette.mode === 'dark' ? '#eeeeee' : '#184F6AFF',
        text: theme.palette.text.primary,
        secondaryText: theme.palette.text.secondary
      };

      // Draw base map only if it doesn't exist
      if (g.select('.base-countries').empty()) {
        g.append('g')
          .attr('class', 'base-countries')
          .selectAll('path')
          .data(countries.features)
          .join('path')
          .attr('d', path)
          .attr('fill', mapColors.baseCountry)
          .attr('stroke', mapColors.baseStroke)
          .attr('stroke-width', 1)
          .style('opacity', 1);
      } else {
        // Update existing base map colors for theme changes
        g.select('.base-countries')
          .selectAll('path')
          .attr('fill', mapColors.baseCountry)
          .attr('stroke', mapColors.baseStroke)
          .attr('stroke-width', 1);
      }

      // Create country-to-data mapping with aggregated flood days
      const countryData = {};
      filteredData.forEach(d => {
        if (!countryData[d.Country]) {
          countryData[d.Country] = {
            Minor: 0,
            Moderate: 0,
            Major: 0,
            totalDays: 0
          };
        }
        const floodDays = +d["Flood Days"] || 0;
        countryData[d.Country][d.Severity] += floodDays;
        countryData[d.Country].totalDays += floodDays;
      });

      // Function to create gradient definition for a country with minimum visibility
      const createCountryGradient = (country, data, suffix = '') => {
        const gradientId = `gradient-${country.replace(/\s+/g, '')}-${suffix}`;
        const { Minor, Moderate, Major, totalDays } = data;
        
        if (totalDays === 0) return null;

        // Remove existing gradient if it exists
        svg.select(`#${gradientId}`).remove();

        // Calculate percentages with minimum 10% visibility for present types
        let minorPercent = Minor > 0 ? (Minor / totalDays) * 100 : 0;
        let moderatePercent = Moderate > 0 ? (Moderate / totalDays) * 100 : 0;
        let majorPercent = Major > 0 ? (Major / totalDays) * 100 : 0;

        // Apply minimum visibility rules
        if (minorPercent > 0 && minorPercent < 10) minorPercent = 10;
        if (moderatePercent > 0 && moderatePercent < 10) moderatePercent = 10;
        if (majorPercent > 0 && majorPercent < 10) majorPercent = 10;

        // Normalize percentages to 100%
        const total = minorPercent + moderatePercent + majorPercent;
        if (total > 100) {
          minorPercent = (minorPercent / total) * 100;
          moderatePercent = (moderatePercent / total) * 100;
          majorPercent = (majorPercent / total) * 100;
        }

        // Create gradient
        let defs = svg.select('defs');
        if (defs.empty()) {
          defs = svg.append('defs');
        }
        
        // Change gradient orientation to vertical (top-to-bottom)
        const gradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%')
          .attr('x2', '0%')
          .attr('y1', '0%')
          .attr('y2', '100%');

        // Calculate cumulative percentages for vertical gradient
        let offset = 0;
        
        // Add Minor color
        if (minorPercent > 0) {
          gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', severityColors.Minor);
          offset += minorPercent;
          gradient.append('stop')
            .attr('offset', `${offset}%`)
            .attr('stop-color', severityColors.Minor);
        }

        // Add Moderate color
        if (moderatePercent > 0) {
          if (minorPercent === 0) {
            gradient.append('stop')
              .attr('offset', '0%')
              .attr('stop-color', severityColors.Moderate);
          } else {
            gradient.append('stop')
              .attr('offset', `${offset}%`)
              .attr('stop-color', severityColors.Moderate);
          }
          offset += moderatePercent;
          gradient.append('stop')
            .attr('offset', `${offset}%`)
            .attr('stop-color', severityColors.Moderate);
        }

        // Add Major color
        if (majorPercent > 0) {
          if (minorPercent === 0 && moderatePercent === 0) {
            gradient.append('stop')
              .attr('offset', '0%')
              .attr('stop-color', severityColors.Major);
          } else {
            gradient.append('stop')
              .attr('offset', `${offset}%`)
              .attr('stop-color', severityColors.Major);
          }
          gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', severityColors.Major);
        }

        return `url(#${gradientId})`;
      };

      // Function to get country path based on name
      const getCountryFeature = (countryName) => {
        const nameMap = {
          'Bangladesh': ['Bangladesh', 'BGD'],
          'Philippines': ['Philippines', 'PHL'],
          'Maldives': ['Maldives', 'MDV']
        };

        const searchNames = nameMap[countryName] || [countryName];
        
        return countries.features.find(feature => 
          searchNames.some(name => 
            feature.properties.name === name || 
            feature.properties.iso_a3 === name ||
            feature.properties.admin === name
          )
        );
      };

      // Remove country paths for countries no longer selected
      g.selectAll('[class^="country-"]')
        .filter(function() {
          // classList contains "country-..." for each country
          const className = d3.select(this).attr('class');
          // Extract country name from class, e.g. "country-Bangladesh"
          const match = className && className.match(/^country-(.+)$/);
          if (!match) return false;
          // We'll compare by removing spaces from selectedCountries as well
          return !selectedCountries.some(c => c.replace(/\s+/g, '') === match[1]);
        })
        .remove();

      // Update selected countries with flood data - NO FLASHING
      selectedCountries.forEach(country => {
        // Guard clause: only proceed if country is currently selected
        if (!selectedCountries.includes(country)) return;
        const feature = getCountryFeature(country);
        if (feature) {
          const floodStats = countryData[country] || {
            Minor: 0, Moderate: 0, Major: 0, totalDays: 0
          };

          // Create new gradient for this year
          const newGradientUrl = createCountryGradient(country, floodStats, currentYear);

          // Get existing country path or create new one
          let countryPath = g.select(`.country-${country.replace(/\s+/g, '')}`);

          if (countryPath.empty()) {
            // Create new path with initial fill
            countryPath = g.append('path')
              .datum(feature)
              .attr('class', `country-${country.replace(/\s+/g, '')}`)
              .attr('d', path)
              .attr('stroke', mapColors.countryStroke)
              .attr('stroke-width', 2)
              .style('opacity', 0)
              .attr('fill', newGradientUrl || mapColors.baseCountry); // Set initial fill
          } else {
            // Update stroke color for theme changes
            countryPath.attr('stroke', mapColors.countryStroke);
          }

          // Update with smooth transition - no blank state
          countryPath
            .datum(feature)
            .attr('d', path)
            .style('opacity', floodStats.totalDays > 0 ? 0.9 : 0)
            .attr('fill', newGradientUrl || mapColors.baseCountry); // Set fill immediately

          // Set up event handlers with improved tooltip positioning and cached content
          let tooltipContent = '';
          countryPath
            .on('mouseover', (event) => {
              d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .style('opacity', 1)
                .attr('stroke-width', 3);

              const { Minor, Moderate, Major, totalDays } = floodStats;
              tooltipContent =
                `<div style="text-align: left; line-height: 1.4;">
                   <strong style="font-size: 14px;">${country} (${currentYear})</strong>
                   <div style="margin-top: 8px;">
                     <div style="display: flex; align-items: center; margin-bottom: 3px;">
                       <div style="width: 12px; height: 12px; background-color: ${severityColors.Minor}; margin-right: 8px; border-radius: 2px;"></div>
                       <span>Minor: ${Minor} days</span>
                     </div>
                     <div style="display: flex; align-items: center; margin-bottom: 3px;">
                       <div style="width: 12px; height: 12px; background-color: ${severityColors.Moderate}; margin-right: 8px; border-radius: 2px;"></div>
                       <span>Moderate: ${Moderate} days</span>
                     </div>
                     <div style="display: flex; align-items: center; margin-bottom: 3px;">
                       <div style="width: 12px; height: 12px; background-color: ${severityColors.Major}; margin-right: 8px; border-radius: 2px;"></div>
                       <span>Major: ${Major} days</span>
                     </div>
                     <div style="margin-top: 8px; border-top: 1px solid #666; padding-top: 4px;">
                       <strong>Total: ${totalDays} flood days</strong>
                     </div>
                   </div>
                 </div>`;
              showTooltip(
                tooltip,
                event,
                tooltipContent,
                { offsetX: 15, offsetY: 15 }
              );
            })
            .on('mousemove', (event) => {
              showTooltip(tooltip, event, tooltipContent, { offsetX: 15, offsetY: 15 });
            })
            .on('mouseout', (event) => {
              d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .style('opacity', floodStats.totalDays > 0 ? 0.9 : 0)
                .attr('stroke-width', 2);
              hideTooltip(tooltip);
            });
        }
      });

      // Update legend - position at bottom
      if (g.select('.legend').empty()) {
        const legend = g.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${margin.left}, ${height + 20})`);

        ['Minor', 'Moderate', 'Major'].forEach((severity, i) => {
          const legendItem = legend.append('g')
            .attr('transform', `translate(${i * 100}, 0)`);

          legendItem.append('circle')
            .attr('r', 8)
            .attr('fill', severityColors[severity]);

          legendItem.append('text')
            .attr('x', 15)
            .attr('y', 4)
            .text(severity)
            .attr('font-size', '12px')
            .attr('fill', mapColors.text);
        });

        // Add "Proportional Fill" label
        legend.append('text')
          .attr('x', 350)
          .attr('y', 4)
          .text('(Proportional to flood days)')
          .attr('font-size', '11px')
          .attr('fill', mapColors.secondaryText)
          .style('font-style', 'italic');
      } else {
        // Update legend colors for theme changes
        g.select('.legend')
          .selectAll('text')
          .attr('fill', mapColors.text)
          .filter((d, i, nodes) => i === nodes.length - 1)
          .attr('fill', mapColors.secondaryText);

        // Update legend circles
        ['Minor', 'Moderate', 'Major'].forEach((severity, i) => {
          g.select('.legend')
            .select(`g:nth-child(${i + 1})`)
            .select('circle')
            .attr('fill', severityColors[severity]);
        });
      }
    }).catch((error) => {
      console.error('Error loading world map:', error);
    });
  };

  const toggleCountry = (country) => {
    setSelectedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };


  useEffect(() => {
    let interval;
    if (isPlaying && availableYears.length > 0) {
      interval = setInterval(() => {
        setCurrentYear(prev => {
          const currentIndex = availableYears.indexOf(prev);
          if (currentIndex < availableYears.length - 1) {
            return availableYears[currentIndex + 1];
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, animationSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, availableYears, animationSpeed]);

  // Create slider marks
  const createSliderMarks = () => {
    if (availableYears.length === 0) return [];
    
    if (availableYears.length <= 10) {
      return availableYears.map(year => ({ 
        value: year, 
        label: year.toString() 
      }));
    } else {
      const marks = [];
      marks.push({ value: availableYears[0], label: availableYears[0].toString() });
      
      const yearRange = availableYears[availableYears.length - 1] - availableYears[0];
      const idealInterval = Math.ceil(yearRange / 6);
      
      for (let year = availableYears[0] + idealInterval; year < availableYears[availableYears.length - 1]; year += idealInterval) {
        const closestYear = availableYears.reduce((prev, curr) => 
          Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
        );
        
        if (!marks.some(m => m.value === closestYear) && 
            marks.every(m => Math.abs(m.value - closestYear) >= idealInterval / 2)) {
          marks.push({ value: closestYear, label: closestYear.toString() });
        }
      }
      
      const lastYear = availableYears[availableYears.length - 1];
      if (!marks.some(m => m.value === lastYear)) {
        marks.push({ value: lastYear, label: lastYear.toString() });
      }
      
      return marks.sort((a, b) => a.value - b.value);
    }
  };

  const sliderMarks = createSliderMarks();

  return (
    <ThemeAwareChartWrapper title="Flood Severity Map by Country and Year">
      <Box sx={{ p: { xs: 3, sm: 4 }, pt: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, position: 'relative' }}>
          <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
            This map shows flood severity levels (Minor, Moderate, Major) by country and year in South Asia. 
            The fill color shows the proportional breakdown of flood days by severity. Colors smoothly transition between years.
          </Typography>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <IconButton
              size="small"
              color="#f5f5f5"
              sx={{ ml: 1 }}
              onMouseEnter={() => setHelpHovered(true)}
              onMouseLeave={() => setHelpHovered(false)}
              tabIndex={0}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
            {helpHovered && (
              <Box
                sx={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-10%)',
                  zIndex: 30,
                  minWidth: 260,
                  maxWidth: 320,
                  p: 2,
                  ml: 1,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(30,30,30,0.97)'
                    : 'rgba(40,40,40,0.97)',
                  color: '#fff',
                  borderRadius: '8px',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 3px 16px 2px rgba(0,0,0,0.55)'
                    : '0 3px 16px 2px rgba(0,0,0,0.18)',
                  fontSize: '14px',
                  lineHeight: 1.4,
                  pointerEvents: 'none', // So it doesn't block mouseleave
                  border: theme.palette.mode === 'dark'
                    ? '1.5px solid #333'
                    : '1.5px solid #222',
                  padding: '14px 17px',
                  fontWeight: 400,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    fontWeight: 700,
                    color: '#F4F3EEFF',
                    fontSize: '15px',
                    lineHeight: 1.3,
                  }}
                >
                  How to use the Flood Severity Map:
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, color: '#F4F3EEFF', fontSize: '14px', lineHeight: 1.4 }}>
                  • <strong>Toggle Countries:</strong> Click buttons to show/hide Bangladesh or Philippines
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, color: '#F4F3EEFF', fontSize: '14px', lineHeight: 1.4 }}>
                  • <strong>Year Navigation:</strong> Drag the slider or click Play to animate through years
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, color: '#F4F3EEFF', fontSize: '14px', lineHeight: 1.4 }}>
                  • <strong>Animation Speed:</strong> Choose Fast, Normal, or Slow animation speed
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, color: '#F4F3EEFF', fontSize: '14px', lineHeight: 1.4 }}>
                  • <strong>Country Colors:</strong> Horizontal gradients show proportional flood severity
                </Typography>
                <Typography variant="body2" sx={{ color: '#F4F3EEFF', fontSize: '14px', lineHeight: 1.4 }}>
                  • <strong>Hover:</strong> Mouse over countries to see detailed flood data
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
          Note: No severity data is available for Maldives.
        </Typography>
        
        {/* Year Control */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 'bold' }}>
            Year: {currentYear}
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 48,
              px: 3,
              py: 2,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Slider
              value={currentYear}
              min={Math.min(...availableYears)}
              max={Math.max(...availableYears)}
              marks={sliderMarks}
              step={1}
              onChange={(e, newValue) => setCurrentYear(newValue)}
              valueLabelDisplay="off"
              sx={{
                flex: 1,
                height: 8,
                '& .MuiSlider-thumb': { height: 20, width: 20, backgroundColor: theme.palette.primary.main },
                '& .MuiSlider-track': { height: 6, backgroundColor: theme.palette.primary.main },
                '& .MuiSlider-rail': { height: 6 },
                '& .MuiSlider-markLabel': {
                  fontSize: '18px',
                  fontWeight: 500,
                  transform: 'translateX(-50%)',
                  top: '30px',
                  color: theme.palette.text.secondary
                },
                '& .MuiSlider-mark': {
                  height: '15px',
                  width: '2px',
                  backgroundColor: theme.palette.text.secondary
                },
                '& .MuiSlider-markActive': {
                  backgroundColor: theme.palette.primary.main,
                  opacity: 1
                }
              }}
            />
            <IconButton onClick={() => setCurrentYear(availableYears[0])} sx={{ ml: 4, color: theme.palette.text.primary }}>
              <RestartAltIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Play/Pause and Animation Speed Control */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={handlePlayPause}
            sx={{ 
              textTransform: 'none', 
              width: 90,
              py: 0.5,
              px: 2,
              fontSize: '0.85rem',
              fontWeight: 500,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark
              }
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="speed-select-label" sx={{ color: theme.palette.text.primary }}>
              Animation Speed
            </InputLabel>
            <Select
              labelId="speed-select-label"
              id="speed-select"
              value={animationSpeed}
              label="Animation Speed"
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              sx={{ 
                color: theme.palette.text.primary,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <MenuItem value={300}>Fast</MenuItem>
              <MenuItem value={700}>Normal</MenuItem>
              <MenuItem value={1500}>Slow</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Fixed Country Toggle Buttons */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ 
            color: theme.palette.text.primary, 
            marginBottom: '10px',
            fontWeight: 700,
            borderBottom: `2px solid ${theme.palette.divider}`,
            paddingBottom: '8px'
          }}>
            Toggle Countries:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['Bangladesh', 'Philippines'].map(country => (
              <Button
                key={country}
                variant={selectedCountries.includes(country) ? 'contained' : 'outlined'}
                onClick={() => toggleCountry(country)}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: selectedCountries.includes(country) ? 600 : 500,
                  py: 0.3,
                  px: 1,
                  borderRadius: 1,
                  color: selectedCountries.includes(country) ? theme.palette.primary.contrastText : theme.palette.text.primary,
                  borderColor: theme.palette.primary.main,
                  backgroundColor: selectedCountries.includes(country) ? theme.palette.primary.main : 'transparent',
                  '&:hover': {
                    backgroundColor: selectedCountries.includes(country) ? theme.palette.primary.dark : theme.palette.action.hover,
                    borderColor: theme.palette.primary.main,
                  }
                }}
              >
                {country}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 3, sm: 4 }, pt: 1 }}>
        <Box
          component="svg"
          ref={svgRef}
          sx={{
            width: '100%',
            height: 500,
            display: 'block',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            backgroundColor: theme.palette.mode === 'dark' ? '#0A1929' : '#F5F5F5',
          }}
        />
      </Box>

      <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4 }}>
        {/* Additional legend or info can go here */}
      </Box>
    </ThemeAwareChartWrapper>
  );
};

export default FloodSeverityMap;
