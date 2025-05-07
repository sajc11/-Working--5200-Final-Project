import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import "./ChartStyles.css";
import {
  useTheme,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Slider
} from "@mui/material";

import { createTooltip, showTooltip, hideTooltip } from "../../utils/tooltipUtils";

const LaggedCorrelationChart = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [country, setCountry] = useState("Bangladesh");
  const [lag, setLag] = useState(0);
  const [targets, setTargets] = useState([]);

  const setRefs = (node) => {
    wrapperRef.current = node;
  };

  useEffect(() => {
    d3.json("/data/processed_lead_lag_correlations.json").then((json) => {
      setData(json);
      const allTargets = Array.from(new Set(json.map((d) => d.Target)));
      setTargets(allTargets);
    });
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !wrapperRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const filtered = data.filter((d) => d.Country === country && d.Lag === lag);
    const predictors = Array.from(new Set(filtered.map((d) => d.Predictor)));
    const colorScale = d3.scaleOrdinal()
      .domain(predictors)
      .range(d3.schemeSet2);

    const width = wrapperRef.current.clientWidth || 700;
    const panelHeight = 100;
    const margin = { top: 30, right: 20, bottom: 40, left: 140 };
    const totalHeight = targets.length * panelHeight + 60;

    svg.attr("viewBox", [0, 0, width, totalHeight]);

    const x = d3.scaleLinear().domain([-1, 1]).range([margin.left, width - margin.right]);

    const tooltip = createTooltip(theme);

    targets.forEach((target, i) => {
      const subset = filtered.filter((d) => d.Target === target);
      const y = d3.scaleBand()
        .domain(subset.map((d) => d.Predictor))
        .range([margin.top + i * panelHeight, margin.top + (i + 1) * panelHeight - 20])
        .padding(0.2);

      // Axes
      svg.append("g")
        .attr("transform", `translate(0,${y.range()[0]})`)
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("fill", theme.palette.text.primary)
        .style("font-weight", "600");

      svg.append("g")
        .attr("transform", `translate(0,${y.range()[1]})`)
        .call(d3.axisBottom(x).ticks(5))
        .selectAll("text")
        .style("fill", theme.palette.text.primary);

      // Section label
      svg.append("text")
        .attr("x", margin.left)
        .attr("y", y.range()[0] - 10)
        .text(target)
        .style("font-weight", "bold")
        .style("fill", theme.palette.text.primary)
        .style("font-size", "1rem");

      // Bars
      svg.selectAll(`.bar-${target}`)
        .data(subset)
        .join("rect")
        .attr("x", (d) => x(Math.min(0, d.Correlation)))
        .attr("y", (d) => y(d.Predictor))
        .attr("width", (d) => Math.abs(x(d.Correlation) - x(0)))
        .attr("height", y.bandwidth())
        .attr("fill", (d) => colorScale(d.Predictor))
        .attr("rx", 4)
        .on("mouseover", (event, d) => {
          showTooltip(
            tooltip,
            event,
            `<strong>${d.Predictor} → ${d.Target}</strong><br/>Lag: ${d.Lag}<br/>r = ${d.Correlation.toFixed(2)}`
          );
        })
        .on("mousemove", (event) => showTooltip(tooltip, event))
        .on("mouseout", () => hideTooltip(tooltip));
    });
  }, [data, country, lag, theme]);

  const countries = Array.from(new Set(data.map((d) => d.Country)));
  const lagMarks = Array.from({ length: 21 }, (_, i) => ({ value: i - 10 }));

  return (
    <div className="chart-container chart-card" ref={setRefs}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Country</InputLabel>
          <Select
            value={country}
            label="Country"
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
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
      </Box>

      <h3 style={{ fontFamily: "var(--font-header)", marginBottom: "1rem" }}>
        Lagged Climate-Social Correlations by Outcome
      </h3>
      <svg ref={svgRef} width="100%" height="auto" />
    </div>
  );
};

export default LaggedCorrelationChart;