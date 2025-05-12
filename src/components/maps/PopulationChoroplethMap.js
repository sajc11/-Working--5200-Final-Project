import React, { useState, useEffect, useRef } from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';
import { useTheme, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

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

const maxPopulation = Math.max(...cityData.map(d => d.population));
const minRadius = 5;
const maxRadius = 25;

function scaleRadius(population) {
  return minRadius + ((population / maxPopulation) * (maxRadius - minRadius));
}

// Format numbers to abbreviated form (e.g., 1.2M, 1.5B)
function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Color scales for different data layers
const colorScales = {
  population: d3.scaleSequential()
    .domain([0, maxPopulation])
    .interpolator(d3.interpolatePlasma),
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
      .style('background-color', theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)')
      .style('color', theme.palette.mode === 'dark' ? '#fff' : '#000')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('opacity', 0)
      .style('box-shadow', '0 0 10px rgba(0,0,0,0.25)')
      .style('z-index', 1000);
  }
  return d3.select('#tooltip');
}

export default function PopulationChoroplethMap() {
  const [selectedCountries, setSelectedCountries] = useState(['Bangladesh', 'Maldives', 'Philippines']);
  const [selectedDataLayer, setSelectedDataLayer] = useState('floodDays');
  const [projectionCenterKey, setProjectionCenterKey] = useState('default');
  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });
  const [countryLabelData, setCountryLabelData] = useState([]);
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const gRef = useRef(null);
  const theme = useTheme();

  // Filter cities based on selected countries
  const filteredCities = cityData.filter(city => selectedCountries.includes(city.country));

  // Update dimensions on window resize
  useEffect(() => {
    function handleResize() {
      const width = svgRef.current ? svgRef.current.clientWidth : 900;
      const height = svgRef.current ? svgRef.current.clientHeight : 600;
      setDimensions({ width, height });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create projection based on selected countries
  const getOptimalProjection = () => {
    const width = dimensions.width;
    const height = dimensions.height;

    // Define centers and scale factors for different views
    const projectionSettings = {
      default: {
        center: [105, 10], // Updated center for correct alignment
        scale: 600,       // Updated scale for better zoom
        translate: [width / 2, height / 2],
      },
      Bangladesh: {
        center: [90, 23],
        scale: 4000,
        translate: [width / 2, height / 2],
      },
      Maldives: {
        center: [73, 2],
        scale: 5000,
        translate: [width / 2, height / 2],
      },
      Philippines: {
        center: [122, 12],
        scale: 2000,
        translate: [width / 2, height / 2],
      }
    };

    const settings = projectionSettings[projectionCenterKey];
    return d3.geoMercator()
      .center(settings.center)
      .scale(settings.scale)
      .translate(settings.translate);
  };

  // Get color based on the selected data layer
  const getCountryColor = (countryName) => {
    if (!selectedDataLayer || !countryName) return theme.palette.mode === 'dark' ? '#003049' : '#F4F3EEFF';
    
    const dataItem = climateData[selectedDataLayer].find(item => item.country === countryName);
    if (!dataItem) return theme.palette.mode === 'dark' ? '#003049' : '#F4F3EEFF';
    
    return colorScales[selectedDataLayer](dataItem.value);
  };

  // Render the map
  useEffect(() => {
    renderMap();
  }, [dimensions, selectedCountries, projectionCenterKey, selectedDataLayer, theme.palette.mode]);

  // Projection based on selected center
  const renderMap = () => {
    if (!svgRef.current) return;

    // Clear both SVG and g references
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    gRef.current = null;

    // Create new g and subgroups for layering
    const g = svg.append("g").attr("class", "map-layer");
    gRef.current = g.node();
    
    // Debug country features
    console.log("PopulationChoroplethMap - Selected countries:", selectedCountries);

    // Layer order: base map, city circles, labels
    const baseLayer = g.append("g").attr("class", "base-layer");
    const cityLayer = g.append("g").attr("class", "city-layer");
    const labelLayer = g.append("g").attr("class", "label-layer");

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
      const countryNameMap = {
        50: 'Bangladesh',
        462: 'Maldives',
        608: 'Philippines'
      };

      // Render base map countries FIRST
      baseLayer.selectAll('path')
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
          return selectedCountries.includes(countryName) ? 0.9 : 0.8;
        });

      // Prepare city points data
      const cityPoints = filteredCities.map(city => {
        const coords = projection(city.coords);
        const radius = scaleRadius(city.population);
        return { ...city, x: coords[0], y: coords[1], radius };
      });

      // Render city circles in cityLayer
      cityLayer.selectAll('.city-circle')
        .data(cityPoints)
        .join('circle')
        .attr('class', 'city-circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => d.radius)
        .attr('fill', d => colorScales.population(d.population))
        .attr('stroke', theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000')
        .attr('stroke-width', 1)
        .style('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          const tooltip = d3.select('#tooltip');
          tooltip.style('opacity', 1)
            .html(`
              <strong>${d.name}</strong><br/>
              Country: ${d.country}<br/>
              Population: ${d.population.toLocaleString()}<br/>
              ${selectedDataLayer === 'floodDays' ? 'Flood Days: ' + climateData.floodDays.find(item => item.country === d.country)?.value : ''}
              ${selectedDataLayer === 'seaLevelRise' ? 'Sea Level Rise: ' + climateData.seaLevelRise.find(item => item.country === d.country)?.value + 'm' : ''}
              ${selectedDataLayer === 'extremeHeatDays' ? 'Extreme Heat Days: ' + climateData.extremeHeatDays.find(item => item.country === d.country)?.value : ''}
              ${selectedDataLayer === 'netMigration' ? 'Net Migration: ' + climateData.netMigration.find(item => item.country === d.country)?.value.toLocaleString() : ''}
            `);
        })
        .on('mousemove', (event) => {
          const tooltip = d3.select('#tooltip');
          tooltip.style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('opacity', 0);
        });

      // Render dynamic legend labels at the bottom (vertical list)
      const labelData = selectedCountries.map((country, i) => {
        const dataItem = climateData[selectedDataLayer].find(d => d.country === country);
        return {
          label: `${country}: ${dataItem ? dataItem.value : 'N/A'}${selectedDataLayer === 'seaLevelRise' ? 'm' : ''}`,
          color: getCountryColor(country),
          y: height - 150 + i * 25
        };
      });

      const legendGroup = labelLayer.selectAll('.dynamic-label-legend')
        .data(labelData, d => d.label);

      legendGroup.join(
        enter => enter.append('text')
          .attr('class', 'dynamic-label-legend')
          .attr('x', 30)
          .attr('y', d => d.y + 15)
          .attr('fill', d => d.color)
          .attr('opacity', 0)
          .style('font-size', '16px')
          .style('font-weight', 700)
          .style('text-shadow', theme.palette.mode === 'dark' 
            ? '0 0 3px #000, 0 0 5px #000, 0 0 7px #000'
            : '0 0 3px #fff, 0 0 5px #fff, 0 0 7px #fff')
          .text(d => d.label)
          .transition()
          .duration(500)
          .attr('opacity', 1),
        update => update
          .transition()
          .duration(500)
          .attr('y', d => d.y + 15)
          .attr('fill', d => d.color)
          .text(d => d.label),
        exit => exit
          .transition()
          .duration(300)
          .attr('opacity', 0)
          .remove()
      );

      // Delayed zoom reset (after rendering)
      setTimeout(() => {
        svg.transition()
          .duration(300)
          .call(
            zoomRef.current?.transform,
            d3.zoomIdentity
              .translate(dimensions.width / 3, dimensions.height / 3)
              .scale(1.5)
          );
      }, 100);
    });
  };

  // Setup zoom and pan behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .translateExtent([
        [-dimensions.width, -dimensions.height],
        [dimensions.width * 2, dimensions.height * 2]
      ])
      .extent([[0, 0], [dimensions.width, dimensions.height]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Initial zoom state to show all countries better
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(dimensions.width / 6, dimensions.height / 6)
        .scale(1.2)
    );

    return () => {
      svg.on('.zoom', null); // Clean up zoom behavior on unmount
    };
  }, [dimensions]);

  // Update projection when center changes
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Reset zoom to identity on projection center change
    svg.transition()
      .duration(750)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, [projectionCenterKey]);

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

  const handleProjectionToggle = (event, newKey) => {
    if (newKey !== null) {
      setProjectionCenterKey(newKey);
    }
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity
          .translate(dimensions.width / 6, dimensions.height / 6)
          .scale(1.2)
      );
  };

  return (
    <Card
      elevation={4}
      sx={{
        borderRadius: 3,
        overflow: 'visible',
        mt: 5,
        mb: 5,
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
        margin: 'auto',
        color: theme.palette.text.primary,
      }}
    >
      <Box sx={{ p: { xs: 3, sm: 4 }, pb: 0 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
          Climate Impact Visualization
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Circle size represents city population. Colors indicate climate impact data. Pan and zoom to explore.
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 3, sm: 4 }, pt: 0, pb: 0 }}>
        <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 600 }}>
          Data Layer:
        </Typography>
        <ToggleButtonGroup
          value={selectedDataLayer}
          exclusive
          onChange={handleToggleDataLayer}
          aria-label="data layer"
          sx={{
            marginBottom: 2,
            '& .MuiToggleButton-root': {
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              }
            }
          }}
        >
          <ToggleButton value="floodDays" aria-label="Flood Days">
            FLOOD DAYS
          </ToggleButton>
          <ToggleButton value="seaLevelRise" aria-label="Sea Level Rise">
            SEA LEVEL RISE
          </ToggleButton>
          <ToggleButton value="extremeHeatDays" aria-label="Extreme Heat Days">
            EXTREME HEAT DAYS
          </ToggleButton>
          <ToggleButton value="netMigration" aria-label="Net Migration">
            NET MIGRATION
          </ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, mb: 1, mt: 3, fontWeight: 600 }}>
          Toggle Countries:
        </Typography>
        <ToggleButtonGroup
          value={selectedCountries}
          onChange={handleToggleCountries}
          aria-label="select countries"
          sx={{
            marginBottom: 2,
            '& .MuiToggleButton-root': {
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              }
            }
          }}
        >
          {['Bangladesh', 'Maldives', 'Philippines'].map(country => (
            <ToggleButton key={country} value={country} aria-label={country}>
              {country.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={projectionCenterKey}
          exclusive
          onChange={handleProjectionToggle}
          aria-label="projection center"
          sx={{
            marginBottom: 2,
            marginLeft: 2,
            '& .MuiToggleButton-root': {
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              }
            }
          }}
        >
          <ToggleButton value="default" aria-label="Default Projection">All</ToggleButton>
          <ToggleButton value="Bangladesh" aria-label="Bangladesh Center">B</ToggleButton>
          <ToggleButton value="Maldives" aria-label="Maldives Center">M</ToggleButton>
          <ToggleButton value="Philippines" aria-label="Philippines Center">P</ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="outlined"
          onClick={handleResetZoom}
          sx={{
            mb: 2,
            ml: 2,
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.action.hover,
            }
          }}
        >
          Reset Zoom
        </Button>
      </Box>

      <Box sx={{ p: { xs: 3, sm: 4 }, pt: 1 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          width="100%"
          height="500px"
          style={{
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === 'dark' ? '#0A1929' : '#F5F5F5',
            cursor: 'grab'
          }}
        >
          <g ref={gRef}>
            {/* Map and circles rendered by D3 */}
          </g>
        </svg>
      </Box>


      <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 2 }}>
          Legend
        </Typography>
        
        {/* Horizontal layout for legends */}
        <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between' }}>
          {/* Population size legend (always shown) */}
          <Box sx={{ mb: 2, flex: '1 1 300px' }}>
            <Typography sx={{ color: theme.palette.text.primary, mb: 1 }}>
              Circle Size (Population):
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 300 }}>
              {[100000, 1000000, 5000000, 9000000].map((pop, i) => {
                const r = scaleRadius(pop);
                return (
                  <Box key={pop} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <svg width={r * 2 + 10} height={r * 2 + 10}>
                      <circle
                        cx={r + 5}
                        cy={r + 5}
                        r={r}
                        fill={theme.palette.text.disabled}
                        stroke={theme.palette.text.primary}
                        strokeWidth={1}
                      />
                    </svg>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                      {formatNumber(pop)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Dynamic legend based on selected data layer */}
          <Box sx={{ mb: 2, flex: '1 1 300px' }}>
            <Typography sx={{ color: theme.palette.text.primary, mb: 1 }}>
              {selectedDataLayer === 'floodDays' && 'Annual Flood Days:'}
              {selectedDataLayer === 'seaLevelRise' && 'Sea Level Rise (meters by 2050):'}
              {selectedDataLayer === 'extremeHeatDays' && 'Extreme Heat Days (over 35°C annually):'}
              {selectedDataLayer === 'netMigration' && 'Net Migration (annual):'}
            </Typography>
            <Box sx={{ width: '100%', maxWidth: 300 }}>
              <svg width="100%" height={40}>
                <defs>
                  {selectedDataLayer === 'floodDays' && (
                    <linearGradient id="data-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                        <stop key={i} offset={`${t * 100}%`} stopColor={colorScales.floodDays(t * 50)} />
                      ))}
                    </linearGradient>
                  )}
                  {selectedDataLayer === 'seaLevelRise' && (
                    <linearGradient id="data-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                        <stop key={i} offset={`${t * 100}%`} stopColor={colorScales.seaLevelRise(t * 0.7)} />
                      ))}
                    </linearGradient>
                  )}
                  {selectedDataLayer === 'extremeHeatDays' && (
                    <linearGradient id="data-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                        <stop key={i} offset={`${t * 100}%`} stopColor={colorScales.extremeHeatDays(t * 100)} />
                      ))}
                    </linearGradient>
                  )}
                  {selectedDataLayer === 'netMigration' && (
                    <linearGradient id="data-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                        <stop key={i} offset={`${t * 100}%`} stopColor={colorScales.netMigration(-500000 + (t * 1000000))} />
                      ))}
                    </linearGradient>
                  )}
                </defs>
                <rect x={0} y={0} width="100%" height={25} fill="url(#data-gradient)" stroke={theme.palette.text.primary} strokeWidth={1} />
                <text x={0} y={38} fontSize={11} fill={theme.palette.text.secondary}>
                  {selectedDataLayer === 'floodDays' && '0'}
                  {selectedDataLayer === 'seaLevelRise' && '0'}
                  {selectedDataLayer === 'extremeHeatDays' && '0'}
                  {selectedDataLayer === 'netMigration' && '-500K'}
                </text>
                <text x="50%" y={38} fontSize={11} fill={theme.palette.text.secondary} textAnchor="middle">
                  {selectedDataLayer === 'floodDays' && '25'}
                  {selectedDataLayer === 'seaLevelRise' && '0.35'}
                  {selectedDataLayer === 'extremeHeatDays' && '50'}
                  {selectedDataLayer === 'netMigration' && '0'}
                </text>
                <text x="100%" y={38} fontSize={11} fill={theme.palette.text.secondary} textAnchor="end">
                  {selectedDataLayer === 'floodDays' && '50+'}
                  {selectedDataLayer === 'seaLevelRise' && '0.7+'}
                  {selectedDataLayer === 'extremeHeatDays' && '100+'}
                  {selectedDataLayer === 'netMigration' && '+500K'}
                </text>
              </svg>
            </Box>
          </Box>
        </Box>
      </Box>

      <div id="tooltip" style={{
        position: 'absolute',
        pointerEvents: 'none',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        opacity: 0,
        transition: 'opacity 0.3s',
        zIndex: 10,
        boxShadow: '0 0 10px rgba(0,0,0,0.25)'
      }} />
    </Card>
  );
}
