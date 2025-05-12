import React, { useState, useEffect, useRef } from 'react';
import { useTheme, ToggleButton, ToggleButtonGroup, Button, Typography, Box } from '@mui/material';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import ThemeAwareChartWrapper from '../ui/ThemeAwareChartWrapper';

// City data with correct coordinates
const cityData = [
  { name: 'Dhaka', country: 'Bangladesh', population: 8906000, coords: [90.4125, 23.8103] },
  { name: 'Chittagong', country: 'Bangladesh', population: 2690000, coords: [91.7832, 22.3569] },
  { name: 'Malé', country: 'Maldives', population: 133412, coords: [73.5089, 4.1755] },
  { name: 'Addu City', country: 'Maldives', population: 37000, coords: [73.1014, -0.6297] },
  { name: 'Manila', country: 'Philippines', population: 1780148, coords: [120.9842, 14.5995] },
  { name: 'Quezon City', country: 'Philippines', population: 2936111, coords: [121.0509, 14.6760] },
];

// Climate data layers (sample data - replace with actual data)
const climateData = {
  floodDays: [
    { country: 'Bangladesh', value: 45, description: 'Annual flood days' },
    { country: 'Maldives', value: 12, description: 'Annual flood days' },
    { country: 'Philippines', value: 30, description: 'Annual flood days' }
  ],
  seaLevelRise: [
    { country: 'Bangladesh', value: 0.45, description: 'Meters by 2050' },
    { country: 'Maldives', value: 0.6, description: 'Meters by 2050' },
    { country: 'Philippines', value: 0.38, description: 'Meters by 2050' }
  ],
  extremeHeatDays: [
    { country: 'Bangladesh', value: 85, description: 'Days over 35°C annually' },
    { country: 'Maldives', value: 25, description: 'Days over 35°C annually' },
    { country: 'Philippines', value: 65, description: 'Days over 35°C annually' }
  ],
  netMigration: [
    { country: 'Bangladesh', value: -450000, description: 'Net migration (2023)' },
    { country: 'Maldives', value: 12000, description: 'Net migration (2023)' },
    { country: 'Philippines', value: -130000, description: 'Net migration (2023)' }
  ]
};

// Color scales for different data layers
const colorScales = {
  floodDays: d3.scaleSequential()
    .domain([0, 50])
    .interpolator(d3.interpolateBlues),
  seaLevelRise: d3.scaleSequential()
    .domain([0, 0.7])
    .interpolator(d3.interpolateBuGn),
  extremeHeatDays: d3.scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateOrRd),
  netMigration: d3.scaleSequential()
    .domain([-500000, 500000])
    .interpolator(d3.interpolatePuOr)
};

// Create tooltip function
function createTooltip(theme) {
  // Make sure we only create tooltip once
  if (d3.select('#tooltip').empty()) {
    d3.select('body').append('div')
      .attr('id', 'tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background-color', 'rgba(0,0,0,0.8)')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('opacity', 0)
      .style('box-shadow', '0 0 10px rgba(0,0,0,0.25)')
      .style('z-index', 1000);
  }
  return d3.select('#tooltip');
}

// Map component
export default function ClimateRiskMap() {
  const [selectedCountries, setSelectedCountries] = useState(['Bangladesh', 'Maldives', 'Philippines']);
  const [selectedDataLayer, setSelectedDataLayer] = useState('floodDays');
  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });
  const [year, setYear] = useState(2023);
  const [isPlaying, setIsPlaying] = useState(false);
  const svgRef = useRef(null);
  const mapGroupRef = useRef(null);
  const zoomRef = useRef(null);
  const theme = useTheme();

  // Filter cities based on selected countries
  const filteredCities = cityData.filter(city => selectedCountries.includes(city.country));

  // Update dimensions on window resize
  useEffect(() => {
    function handleResize() {
      const width = svgRef.current ? svgRef.current.clientWidth : 900;
      const height = svgRef.current ? svgRef.current.clientHeight : 500;
      setDimensions({ width, height });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create optimized projection for South Asia focus
  const getOptimalProjection = () => {
    const width = dimensions.width;
    const height = dimensions.height;

    // Dramatically zoomed in projection focusing on the three countries
    return d3.geoMercator()
      .center([98, 10]) // Centered slightly northeast of the actual center to better show all three countries
      .scale(width * 1) // Very high zoom level
      .translate([width / 2, height / 2]);
  };

  // Get color based on selected data layer
  const getCountryColor = (countryName) => {
    if (!selectedDataLayer || !countryName) return '#1e3a5f';
    
    const dataItem = climateData[selectedDataLayer].find(item => item.country === countryName);
    if (!dataItem) return '#1e3a5f';
    
    return colorScales[selectedDataLayer](dataItem.value);
  };

  // Render the map
  useEffect(() => {
    renderMap();
  }, [dimensions, selectedCountries, selectedDataLayer, year]);

  // Setup play/pause animation
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setYear(prev => {
          // Cycle between 2020-2050
          const next = prev + 1;
          return next > 2050 ? 2020 : next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Render map with D3
  const renderMap = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    // Clear SVG completely first
    svg.selectAll("*").remove();
    
    // Create new group
    const g = svg.append('g').attr('class', 'map-group');
    // Store reference to the group
    mapGroupRef.current = g.node();
    
    const width = dimensions.width;
    const height = dimensions.height;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Get the projection based on the current center key
    const projection = getOptimalProjection();
    const path = d3.geoPath(projection);

    // Create tooltip
    createTooltip(theme);

    // Load and render world map
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world) => {
      const countries = topojson.feature(world, world.objects.countries);
      
      // Map of numeric IDs to country names
      const countryNameMap = {
        50: 'Bangladesh',
        462: 'Maldives',
        608: 'Philippines'
      };
      
      console.log("Selected countries:", selectedCountries);
      console.log("Country features:", countries.features.map(f => ({ id: f.id, name: countryNameMap[f.id] })));

      // Create base map
      g.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(countries.features)
        .join('path')
        .attr('d', path)
        .attr('fill', (d) => {
          const countryName = countryNameMap[d.id];
          if (selectedCountries.includes(countryName)) {
            return getCountryColor(countryName);
          }
          return theme.palette.mode === 'dark' ? 'rgba(230,230,230,0.1)' : 'rgba(0,21,41,0.1)';
        })
        .attr('stroke', theme.palette.mode === 'dark' ? '#184F6AFF' : '#CCCCCC')
        .attr('stroke-width', 0.5)
        .style('opacity', d => {
          const countryName = countryNameMap[d.id];
          return selectedCountries.includes(countryName) ? 0.8 : 0.8;
        })
        .on('mouseenter', (event, d) => {
          const countryName = countryNameMap[d.id];
          if (selectedCountries.includes(countryName)) {
            const dataItem = climateData[selectedDataLayer].find(item => item.country === countryName);
            if (dataItem) {
              const tooltip = d3.select('#tooltip');
              tooltip.style('opacity', 1)
                .html(`
                  <strong>${countryName}</strong><br/>
                  ${selectedDataLayer === 'floodDays' ? 'Flood Days: ' + dataItem.value : ''}
                  ${selectedDataLayer === 'seaLevelRise' ? 'Sea Level Rise: ' + dataItem.value + 'm' : ''}
                  ${selectedDataLayer === 'extremeHeatDays' ? 'Extreme Heat Days: ' + dataItem.value : ''}
                  ${selectedDataLayer === 'netMigration' ? 'Net Migration: ' + dataItem.value.toLocaleString() : ''}
                  <br/>${dataItem.description}
                `);
            }
          }
        })
        .on('mousemove', (event) => {
          const tooltip = d3.select('#tooltip');
          tooltip.style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('opacity', 0);
        });

      // Add city circles
      const cityPoints = filteredCities.map(city => {
        const coords = projection(city.coords);
        return { ...city, x: coords[0], y: coords[1] };
      });

      g.selectAll('.city-circle')
        .data(cityPoints)
        .join('circle')
        .attr('class', 'city-circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 4)
        .attr('fill', '#fff')
        .attr('stroke', '#000')
        .attr('stroke-width', 2);

      // Add city labels
      g.selectAll('.city-label')
        .data(cityPoints)
        .join('text')
        .attr('class', 'city-label')
        .attr('x', d => d.x)
        .attr('y', d => d.y - 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#8361C2FF')
        .text(d => d.name);
    });
  };

  // Setup zoom and pan behavior
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.map-group');

    const zoom = d3.zoom()
      .scaleExtent([0.8, 20])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Don't apply initial transform - we're already zoomed in with the projection
    
    return () => {
      svg.on('.zoom', null); // Clean up zoom behavior on unmount
    };
  }, [dimensions]);

  const handleToggleCountries = (event, newCountries) => {
    if (newCountries.length) {
      setSelectedCountries(newCountries);
    }
  };

  const handleToggleDataLayer = (event, newLayer) => {
    if (newLayer !== null) {
      setSelectedDataLayer(newLayer);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetAnimation = () => {
    setYear(2020);
    setIsPlaying(false);
  };

  // Legend generator based on selected data layer
  const getLegend = () => {
    const legends = {
      floodDays: {
        title: 'Annual Flood Days',
        min: 0,
        max: 50,
        unit: 'days',
        mid: 25,
        colorScale: colorScales.floodDays
      },
      seaLevelRise: {
        title: 'Sea Level Rise',
        min: 0,
        max: 0.7,
        unit: 'm',
        mid: 0.35,
        colorScale: colorScales.seaLevelRise
      },
      extremeHeatDays: {
        title: 'Extreme Heat Days',
        min: 0,
        max: 100, 
        unit: 'days',
        mid: 50,
        colorScale: colorScales.extremeHeatDays
      },
      netMigration: {
        title: 'Net Migration',
        min: -500000,
        max: 500000,
        unit: 'people',
        mid: 0,
        colorScale: colorScales.netMigration
      }
    };

    return legends[selectedDataLayer];
  };

  const legend = getLegend();

  return (
    <ThemeAwareChartWrapper title="Climate Risk Visualization">

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
          Year: {year}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={togglePlayPause}
            startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            sx={{ 
              py: 0.3, 
              px: 1.5,
              textTransform: 'none',
              fontSize: '0.85rem',
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark
              }
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={resetAnimation}
            startIcon={<RefreshIcon />}
            sx={{ 
              py: 0.3, 
              px: 1.5,
              textTransform: 'none',
              fontSize: '0.85rem',
              color: theme.palette.text.primary,
              borderColor: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ 
        color: theme.palette.text.primary, 
        marginTop: '15px', 
        marginBottom: '10px',
        fontWeight: 700,
        borderBottom: `2px solid ${theme.palette.divider}`,
        paddingBottom: '8px'
      }}>
        Data Layer:
      </Typography>
      <ToggleButtonGroup
        value={selectedDataLayer}
        exclusive
        onChange={handleToggleDataLayer}
        aria-label="data layer"
        sx={{
          display: 'flex',
          width: '100%',
          mb: 3,
          '& .MuiToggleButton-root': {
            flex: 1,
            color: theme.palette.text.primary,
            borderColor: theme.palette.primary.main,
            textTransform: 'none',
            fontWeight: 500,
            py: 0.5,
            fontSize: '0.85rem',
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontWeight: 600
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            }
          }
        }}
      >
        <ToggleButton value="floodDays" aria-label="Flood Days">
          Flood Days
        </ToggleButton>
        <ToggleButton value="seaLevelRise" aria-label="Sea Level Rise">
          Sea Level Rise
        </ToggleButton>
        <ToggleButton value="extremeHeatDays" aria-label="Extreme Heat Days">
          Extreme Heat Days
        </ToggleButton>
        <ToggleButton value="netMigration" aria-label="Net Migration">
          Net Migration
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography variant="h6" sx={{ 
        color: theme.palette.text.primary, 
        marginBottom: '10px',
        fontWeight: 700,
        borderBottom: `2px solid ${theme.palette.divider}`,
        paddingBottom: '8px'
      }}>
        Toggle Countries:
      </Typography>
      <ToggleButtonGroup
        value={selectedCountries}
        onChange={handleToggleCountries}
        aria-label="select countries"
        sx={{
          display: 'flex',
          width: '100%',
          mt: 2,
          flexWrap: 'wrap',
          mb: 3,
          '& .MuiToggleButton-root': {
            flex: 1,
            color: theme.palette.text.primary,
            borderColor: theme.palette.primary.main,
            textTransform: 'none',
            fontWeight: 500,
            py: 1,
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontWeight: 600
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            }
          }
        }}
      >
        {['Bangladesh', 'Maldives', 'Philippines'].map(country => (
          <ToggleButton key={country} value={country} aria-label={country}>
            {country}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        width="100%"
        height="500px"
        style={{ 
          backgroundColor: theme.palette.mode === 'dark' ? '#0A1929' : '#F5F5F5',
          marginBottom: '20px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '8px'
        }}
      />

      {/* Dynamic legend based on selected data layer */}
      <Box sx={{ 
        mt: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        p: 2, 
        borderRadius: '8px', 
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,30,60,0.7)' : 'rgba(240,240,240,0.9)',
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        mx: { xs: 3, sm: 4 },
        mb: 3
      }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: theme.palette.text.primary }}>
          {legend.title}
        </Typography>
        <Box sx={{ position: 'relative', height: '55px' }}>
          <Box sx={{ 
            width: '100%', 
            height: '20px', 
            background: 'linear-gradient(to right, ' + 
              [...Array(20)].map((_, i) => {
                const t = i / 19;
                const value = legend.min + (legend.max - legend.min) * t;
                return legend.colorScale(value);
              }).join(', ') + 
            ')',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.3)'
          }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption">
              {legend.min.toLocaleString()} {legend.unit}
            </Typography>
            <Typography variant="caption">
              {legend.mid.toLocaleString()} {legend.unit}
            </Typography>
            <Typography variant="caption">
              {legend.max.toLocaleString()} {legend.unit}
            </Typography>
          </Box>
        </Box>
      </Box>

      <div id="tooltip" style={{
        position: 'absolute',
        pointerEvents: 'none',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        opacity: 0,
        transition: 'opacity 0.3s',
        zIndex: 10,
        boxShadow: '0 0 10px rgba(0,0,0,0.25)'
      }} />
    </ThemeAwareChartWrapper>
  );
}
