import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Box, FormControl, InputLabel, MenuItem, Select, Typography,
  Slider, IconButton, Paper, Tooltip, Checkbox, FormControlLabel
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PlayArrow, Pause, RestartAlt } from "@mui/icons-material";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { createTooltip, showTooltip, hideTooltip } from "../../d3/tooltipUtils";
import ThemeAwareChartWrapper from "../ui/ThemeAwareChartWrapper";

const LaggedCorrelationChart = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const theme = useTheme();

  const [data, setData] = useState([]);
  const [country, setCountry] = useState("Bangladesh");
  const [lag, setLag] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [threshold, setThreshold] = useState(false);
  const [selectedBar, setSelectedBar] = useState(null);

  const setRefs = (node) => {
    wrapperRef.current = node;
  };

  useEffect(() => {
    d3.json("/data/processed_lead_lag_correlations.json").then(setData);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setLag(prev => (prev >= 10 ? -10 : prev + 1));
    }, 800);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const filtered = data.filter(
    d => d.Country === country &&
         d.Lag === lag &&
         (!threshold || Math.abs(d.Correlation) >= 0.3)
  );

  const targets = Array.from(new Set(filtered.map(d => d.Target))).sort();
  const width = wrapperRef.current?.clientWidth || 700;
  const panelHeight = 100;
  const margin = { top: 30, right: 20, bottom: 50, left: 160 };
  const totalHeight = targets.length * panelHeight + 100;

  useEffect(() => {
    if (!filtered.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const x = d3.scaleLinear().domain([-1, 1]).range([margin.left, width - margin.right]);
    const colorScale = d3.scaleOrdinal()
      .domain([...new Set(filtered.map(d => d.Predictor))])
      .range(d3.schemeSet2);

    const tooltip = createTooltip(theme);

    targets.forEach((target, i) => {
      const section = filtered.filter(d => d.Target === target);
      const sorted = section.sort((a, b) => Math.abs(b.Correlation) - Math.abs(a.Correlation));
      const y = d3.scaleBand()
        .domain(sorted.map(d => d.Predictor))
        .range([margin.top + i * panelHeight, margin.top + (i + 1) * panelHeight - 20])
        .padding(0.2);

      svg.append("text")
        .attr("x", margin.left - 10)
        .attr("y", y.range()[0] - 12)
        .text(target)
        .style("font-weight", "bold")
        .style("fill", theme.palette.text.primary)
        .style("font-size", "13px")
        .style("text-anchor", "start");

      svg.append("g")
        .attr("transform", `translate(${margin.left - 10},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("fill", theme.palette.text.primary)
        .style("font-size", "10px")
        .style("font-weight", 500)
        .attr("dy", "0.35em");

      const bars = svg.selectAll(`.bar-${target}`)
        .data(sorted, d => `${d.Predictor}-${d.Target}`);

      bars.enter()
        .append("rect")
        .attr("class", `bar-${target}`)
        .attr("x", d => x(Math.min(0, d.Correlation)))
        .attr("y", d => y(d.Predictor))
        .attr("width", d => Math.abs(x(d.Correlation) - x(0)))
        .attr("height", y.bandwidth())
        .attr("rx", 4)
        .attr("fill", d => colorScale(d.Predictor))
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
          showTooltip(tooltip, event,
            `<strong>${d.Predictor} → ${d.Target}</strong><br/>Lag: ${d.Lag}<br/>r = ${d.Correlation.toFixed(2)}`
          );
        })
        .on("mousemove", (event) => showTooltip(tooltip, event))
        .on("mouseout", () => hideTooltip(tooltip))
        .on("click", (event, d) => setSelectedBar(d));

      bars.transition()
        .duration(400)
        .ease(d3.easeCubic)
        .attr("x", d => x(Math.min(0, d.Correlation)))
        .attr("y", d => y(d.Predictor))
        .attr("width", d => Math.abs(x(d.Correlation) - x(0)))
        .attr("height", y.bandwidth())
        .attr("fill", d =>
          selectedBar &&
          selectedBar.Predictor === d.Predictor &&
          selectedBar.Target === d.Target
            ? theme.palette.primary.main
            : colorScale(d.Predictor)
        );
    });

    // Bottom axis
    svg.append("g")
      .attr("transform", `translate(0,${targets.length * panelHeight + 20})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".1f")))
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", "11px");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", totalHeight - 10)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.primary)
      .style("font-size", "12px")
      .text("Correlation Coefficient (r)");

  }, [filtered, lag, theme, selectedBar, width]);

  const countries = [...new Set(data.map(d => d.Country))];
  const lagMarks = Array.from({ length: 21 }, (_, i) => ({ value: i - 10 }));

  return (
    <ThemeAwareChartWrapper
      title="Lagged Climate-Social Correlations by Outcome"
      ref={setRefs}
    >

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, mb: 3, justifyContent: "space-between" }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Country</InputLabel>
          <Select value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }}>
          <Typography gutterBottom>Lag (years)</Typography>
          <Slider
            value={lag}
            onChange={(e, v) => setLag(v)}
            step={1}
            min={-10}
            max={10}
            marks={lagMarks}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={autoPlay ? "Pause" : "Play"}>
            <IconButton onClick={() => setAutoPlay(p => !p)} sx={{ color: 'text.primary' }}>
              {autoPlay ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset to lag = 0">
            <IconButton onClick={() => setLag(0)} sx={{ color: 'text.primary' }}>
              <RestartAlt />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <svg ref={svgRef} width="100%" height={totalHeight} />

      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={threshold}
              onChange={(e) => setThreshold(e.target.checked)}
              sx={{ color: 'text.primary' }}
            />
          }
          label="Show only significant correlations (|r| ≥ 0.3)"
          sx={{ color: 'text.primary', ml: 0.5 }}
        />
      </Box>

      {selectedBar && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2, backgroundColor: theme.palette.background.default }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary'}}>
            Selected Relationship
          </Typography>
          <Typography variant="body1">{selectedBar.Predictor} → {selectedBar.Target}</Typography>
          <Typography variant="body1">Lag: {selectedBar.Lag}</Typography>
          <Typography variant="body1">Correlation: {selectedBar.Correlation.toFixed(3)}</Typography>
        </Paper>
      )}
    </ThemeAwareChartWrapper>
  );
};

export default LaggedCorrelationChart;
