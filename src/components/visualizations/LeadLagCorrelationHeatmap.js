import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Box, FormControl, InputLabel, Select, MenuItem,
  ToggleButton, ToggleButtonGroup, Typography, TextField,
  FormControlLabel, Checkbox
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import { createTooltip, showTooltip, hideTooltip } from '../../d3/tooltipUtils';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import ThemeAwareChartWrapper from '../ui/ThemeAwareChartWrapper';

const LeadLagCorrelationHeatmap = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true });
  const setRefs = (node) => {
    wrapperRef.current = node;
    inViewRef(node);
  };

  const { width = 600 } = useResizeObserver(wrapperRef);
  const theme = useTheme();

  const [data, setData] = useState([]);
  const [country, setCountry] = useState("Bangladesh");
  const [predictor, setPredictor] = useState("Sea Level (mm)");
  const [lagRange, setLagRange] = useState([-5, 5]);
  const [threshold, setThreshold] = useState(false);

  useEffect(() => {
    fetch("/data/processed_lead_lag_correlations.json")
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  const filteredData = data.filter(d =>
    d.Country === country &&
    d.Predictor === predictor &&
    d.Lag >= lagRange[0] &&
    d.Lag <= lagRange[1] &&
    (!threshold || Math.abs(d.Correlation) >= 0.3)
  );

  const lags = [...new Set(filteredData.map(d => d.Lag))].sort((a, b) => a - b);
  const targets = [...new Set(filteredData.map(d => d.Target))];

  useEffect(() => {
    if (!svgRef.current || !inView || filteredData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const panelHeight = 140;
    const height = targets.length * panelHeight + 140;
    const margin = { top: 40, right: 70, bottom: 80, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().domain(lags).range([0, innerWidth]).padding(0.05);
    const yScale = d3.scaleBand().domain(targets).range([0, innerHeight]).padding(0.05);
    const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([1, -1]);

    const tooltip = createTooltip(theme);

    // Rectangles
    g.selectAll("rect")
      .data(filteredData)
      .join("rect")
      .attr("x", d => xScale(d.Lag))
      .attr("y", d => yScale(d.Target))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("rx", 4)
      .style("fill", d => colorScale(d.Correlation))
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        showTooltip(tooltip, event,
          `<strong>${d.Target}</strong><br/>Lag: ${d.Lag}<br/>r = ${d.Correlation.toFixed(2)}`
        );
      })
      .on("mousemove", (event) => showTooltip(tooltip, event))
      .on("mouseleave", () => hideTooltip(tooltip));

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
      .selectAll("text")
      .style("fill", theme.palette.text.primary);

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("fill", theme.palette.text.primary);

    // X Axis Label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 50)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.primary)
      .style("font-size", "13px")
      .text("Lag (Years)");

    // Y Axis Label
    svg.append("text")
      .attr("transform", `translate(20,${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.primary)
      .style("font-size", "13px")
      .text("Target Variable");

    // Color Legend
    const legendWidth = 140;
    const legendHeight = 10;
    const defs = svg.append("defs");
    const gradientId = "color-gradient";

    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%").attr("x2", "100%");

    d3.range(0, 1.01, 0.01).forEach(t => {
      gradient.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", d3.interpolateRdBu(t));
    });

    const legendX = width - margin.right - legendWidth;
    const legendY = height - 50;

    svg.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradientId})`);

    const legendScale = d3.scaleLinear().domain([-1, 1]).range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".1f"));

    svg.append("g")
      .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", "10px");

  }, [filteredData, width, inView, theme]);

  const countries = [...new Set(data.map(d => d.Country))];
  const predictors = [...new Set(data.filter(d => d.Country === country).map(d => d.Predictor))];

  return (
    <ThemeAwareChartWrapper title="Lead-Lag Correlation Heatmap" ref={setRefs}>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1 }}>
        <Typography variant="h4" sx={{ 
          color: theme.palette.text.primary, 
          marginBottom: '10px',
          fontWeight: 600,
          borderBottom: `2px solid ${theme.palette.divider}`,
          paddingBottom: '8px'
        }}>
          Data Filters
        </Typography>
        
        <Box sx={{
          display: 'flex',
          flexDirection:  'column',
          gap: 2,
          mb: 3
        }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 0.5}}>
              <Typography variant="subtitle2" sx={{ 
                mt:2,
                mb: 1, 
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: '1rem',
                borderBottom: `1px solid ${theme.palette.divider}`,
                paddingBottom: '8px'
              }}>
                Select Country
              </Typography>
              <FormControl size="small" sx={{ pt: 1, minWidth: 230 }}>
                <InputLabel sx={{ pt: 1 }}>Country</InputLabel>
                <Select label="Max Lag" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {countries.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ 
                mt: 2,
                mb: 1, 
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: '1rem',
                borderBottom: `1px solid ${theme.palette.divider}`,
                paddingBottom: '8px'
              }}>
                Climate Predictor
              </Typography>
              <ToggleButtonGroup
                value={predictor}
                exclusive
                onChange={(e, val) => val && setPredictor(val)}
                paddingTop={2}
                size="small"
                sx={{
                  pt: 1,
                  flexWrap: 'wrap',
                  '& .MuiToggleButton-root': {
                    color: theme.palette.text.primary,
                    textTransform: 'none',
                    fontWeight: 500,
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
                {predictors.map(p => (
                  <ToggleButton key={p} value={p}>
                    {p}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ 
              mt:2,
              mb: 1, 
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontSize: '1rem',
              borderBottom: `1px solid ${theme.palette.divider}`,
              paddingBottom: '8px'
            }}>
              Lag Range (Years)
            </Typography>
            <Box sx={{ pt: 1, display: 'flex', gap: 1 }}>
              <TextField
                type="number"
                label="Min Lag"
                size="small"
                sx={{ mr: 1 }}
                value={lagRange[0]}
                onChange={e => setLagRange([+e.target.value, lagRange[1]])}
              />
              <TextField
                type="number"
                label="Max Lag"
                size="small"
                value={lagRange[1]}
                onChange={e => setLagRange([lagRange[0], +e.target.value])}
              />
            </Box>
          </Box>
        </Box>
      </Box>
      <svg ref={svgRef} style={{ width: "100%", height: `${targets.length * 140 + 190}px` }} />
      <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={threshold}
                  onChange={(e) => setThreshold(e.target.checked)}
                />
              }
              label="Show only significant correlations (|r| ≥ 0.3)"
              sx={{ ml: 1 }}
            />
          </Box>
    </ThemeAwareChartWrapper>
  );
};

export default LeadLagCorrelationHeatmap;
