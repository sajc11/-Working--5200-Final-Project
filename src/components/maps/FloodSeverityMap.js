// src/components/maps/FloodSeverityMap.js

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Box, Typography, Slider, Button, useTheme, ToggleButtonGroup, ToggleButton, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { getFloodSeverityColor, getSouthAsiaProjection } from '../../d3/mapUtils';
import { createTooltip, showTooltip, hideTooltip } from '../../d3/tooltipUtils';

const FloodSeverityMap = () => {
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltipRef = useRef();
  const theme = useTheme();
  const [worldData, setWorldData] = useState(null);
  const [floodData, setFloodData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(1979);
  const [autoplay, setAutoplay] = useState(false);
  const [dims, setDims] = useState({ width: 800, height: 520 });
  const [selectedCountries, setSelectedCountries] = useState(["Bangladesh", "Philippines"]);
  const [speed, setSpeed] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const zoomRef = useRef(d3.zoomIdentity);

  const availableYears = [...new Set(floodData.map(d => d.Year))].sort((a, b) => a - b);

  useEffect(() => {
    fetch('/world-110m.json').then(res => res.json()).then(setWorldData);
    fetch('/processed_flood_days.json').then(res => res.json()).then(setFloodData);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      setDims({ width: w, height: w * 0.65 });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!autoplay || !availableYears.length) return;
    const interval = setInterval(() => {
      setSelectedYear(prev => {
        const i = availableYears.indexOf(prev);
        return availableYears[(i + 1) % availableYears.length];
      });
    }, 1400 / speed);
    return () => clearInterval(interval);
  }, [autoplay, availableYears, speed]);

  useEffect(() => {
    if (!worldData || !floodData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { width, height } = dims;

    const projection = getSouthAsiaProjection(width, height);

    const path = d3.geoPath(projection);
    const mapGroup = svg.append('g');
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    // Create tooltip element if not already created
    if (!tooltipRef.current) {
      tooltipRef.current = createTooltip();
    }
    const tooltip = tooltipRef.current;

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        mapGroup.attr('transform', event.transform);
        zoomRef.current = event.transform;
      });

    svg.call(zoom);

    // Center the map with a smooth transition on initial render
    const bounds = path.bounds({ type: "FeatureCollection", features: countries });
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
    const translate = [width / 2 - scale * x, height / 2 - scale * y];
    const initialTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    svg.transition()
      .duration(750)
      .call(zoom.transform, initialTransform)
      .on('end', () => {
        zoomRef.current = initialTransform;
      });

    // Apply stored zoom transform on year change to preserve zoom/pan
    if (zoomRef.current) {
      svg.call(zoom.transform, zoomRef.current);
    }

    const countryPaths = mapGroup.selectAll('path')
      .data(countries)
      .join('path')
      .attr('d', path)
      .attr('stroke', theme.palette.divider)
      .attr('fill', d => {
        const name = d.properties.name;
        if (!selectedCountries.includes(name)) return '#f0f0f0';
        const yearData = floodData.find(
          row => row.Country === name && row.Year === selectedYear && row['Flood Days'] > 0
        );
        return yearData ? getFloodSeverityColor(yearData.Severity) : '#f0f0f0';
      });

    // Animate fill color transition on selectedYear change with staggered delay and easing
    countryPaths.transition()
      .delay((d, i) => i * 15)
      .duration(800)
      .ease(d3.easeCubicInOut)
      .attrTween('fill', function(d) {
        const name = d.properties.name;
        if (!selectedCountries.includes(name)) {
          const currentColor = d3.color(d3.select(this).attr('fill')) || d3.color('#f0f0f0');
          const targetColor = d3.color('#f0f0f0');
          return d3.interpolateRgb(currentColor, targetColor);
        }
        const yearData = floodData.find(
          row => row.Country === name && row.Year === selectedYear && row['Flood Days'] > 0
        );
        const targetColor = yearData ? getFloodSeverityColor(yearData.Severity) : '#f0f0f0';
        const currentColor = d3.color(d3.select(this).attr('fill')) || d3.color('#f0f0f0');
        return d3.interpolateRgb(currentColor, d3.color(targetColor));
      });

    // Add mouseover and mouseout handlers for tooltip
    countryPaths
      .on('mouseover', (event, d) => {
        const name = d.properties.name;
        if (!selectedCountries.includes(name)) {
          hideTooltip(tooltip);
          return;
        }
        const yearData = floodData.find(
          row => row.Country === name && row.Year === selectedYear && row['Flood Days'] > 0
        );
        if (!yearData) {
          hideTooltip(tooltip);
          return;
        }
        const htmlContent = `<strong>${name}</strong><br/>
          Severity: ${yearData.Severity}<br/>
          Flood Days: ${yearData['Flood Days']}`;
        showTooltip(tooltip, htmlContent, event);
      })
      .on('mousemove', (event) => {
        showTooltip(tooltip, null, event);
      })
      .on('mouseout', () => {
        hideTooltip(tooltip);
      });

  }, [worldData, floodData, dims, selectedYear, selectedCountries, theme]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    handleMenuClose();
  };

  return (
    <Box ref={containerRef} sx={{ mt: 6, mb: 2 }}>
      <Typography variant="h4">Flood Severity Map Animation</Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
        This map shows flood severity levels (Minor, Moderate, Major) by country and year. Note: No severity data is available for Maldives.
      </Typography>

      <svg ref={svgRef} style={{ width: '100%', height: 'auto', minHeight: 400 }} />

      <Box sx={{ mt: 3 }}>
        <Typography variant="body1">Year: {selectedYear}</Typography>
        <Slider
          value={selectedYear}
          min={availableYears[0]}
          max={availableYears[availableYears.length - 1]}
          step={1}
          onChange={(e, val) => setSelectedYear(val)}
          valueLabelDisplay="auto"
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <Button
            onClick={() => setAutoplay(prev => !prev)}
            variant="contained"
          >
            {autoplay ? 'Pause' : 'Play'}
          </Button>
          <IconButton
            aria-controls={anchorEl ? 'speed-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={anchorEl ? 'true' : undefined}
            onClick={handleMenuOpen}
            color="primary"
            sx={{ ml: 1 }}
            size="large"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="speed-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'speed-button',
            }}
          >
            {[1, 1.5, 2].map((spd) => (
              <MenuItem
                key={spd}
                selected={speed === spd}
                onClick={() => handleSpeedChange(spd)}
              >
                {spd}x
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" fontWeight={600}>Toggle Countries:</Typography>
        <ToggleButtonGroup
          value={selectedCountries}
          onChange={(event, newCountries) => {
            if (newCountries.length) setSelectedCountries(newCountries);
          }}
          aria-label="toggle countries"
          sx={{ mt: 1 }}
        >
          {["Bangladesh", "Philippines"].map(country => (
            <ToggleButton
              key={country}
              value={country}
              aria-label={country}
              sx={{
                borderColor: theme.palette.primary.main,
                color: selectedCountries.includes(country) ? '#fff' : theme.palette.primary.main,
                bgcolor: selectedCountries.includes(country) ? theme.palette.primary.main : 'transparent',
                '&:hover': {
                  bgcolor: selectedCountries.includes(country)
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
                },
                '&.Mui-selected': {
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                },
              }}
            >
              {country}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" fontWeight={600}>Flood Severity Legend:</Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          {["Minor", "Moderate", "Major"].map(severity => (
            <Box key={severity} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <div style={{
                width: 16,
                height: 16,
                backgroundColor: getFloodSeverityColor(severity),
                borderRadius: '50%'
              }}></div>
              <Typography variant="body2">{severity}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default FloodSeverityMap;
