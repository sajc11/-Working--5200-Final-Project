import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from "d3";
import { useInView } from 'react-intersection-observer';

import "./ChartStyles.css";
import { 
  useTheme, 
  Box, 
  ToggleButton, 
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider
} from '@mui/material';
import ThemeAwareChartWrapper from '../ui/ThemeAwareChartWrapper';

import { floodDaysChartColors } from "../../theme/themeUtils";
import { createTooltip,  showTooltip,  hideTooltip } from "../../d3/tooltipUtils";
import { useResizeObserver } from "../../hooks/useResizeObserver";

const FloodDaysChart = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const { width = 600 } = useResizeObserver(wrapperRef);
  const [data, setData] = useState([]);
  const [severity, setSeverity] = useState("Major");
  const [clickedPoints, setClickedPoints] = useState([]);
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true });

  const theme = useTheme();
  const colors = floodDaysChartColors(theme);

  const setRefs = (node) => {
    wrapperRef.current = node;
    inViewRef(node);
  };

  useEffect(() => {
    d3.json("/data/processed_flood_days.json").then((fullData) => {
      setData(fullData);
    });
  }, []);

  useEffect(() => {
    if (!inView || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const height = 400;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };

    svg.attr("viewBox", [0, 0, width, height]);

    // Filter by severity
    const filtered = data.filter((d) => d.Severity === severity);
    const countries = [...new Set(filtered.map((d) => d.Country))];

    const x = d3
      .scaleLinear()
      .domain(d3.extent(filtered, (d) => +d.Year))
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(filtered, (d) => +d["Flood Days"])])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal()
      .domain(countries)
      .range(countries.map(c => colors.floodLines[c] || "#999"));

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5));

    // X axis label
    svg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("fill", colors.axisText)
      .style("font-size", "18px")
      .text("Year");

    // Y axis label
    svg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(15,${height / 2}) rotate(-90)`)
      .attr("fill", colors.axisText)
      .style("font-size", "18px")
      .text("Flood Days");

    const line = d3
      .line()
      .x((d) => x(+d.Year))
      .y((d) => y(+d["Flood Days"]))
      .curve(d3.curveMonotoneX);

    countries.forEach((country) => {
      const countryData = filtered.filter((d) => d.Country === country);

      const path = svg
        .append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", color(country))
        .attr("stroke-width", 3)
        .attr("d", line);

      const totalLength = path.node().getTotalLength();

      path
        .attr("stroke-dasharray", totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeCubic)
        .attr("stroke-dashoffset", 0);

      // Tooltip setup
      const tooltip = createTooltip(theme);

      svg
        .selectAll(`circle-${country}`)
        .data(countryData)
        .join("circle")
        .attr("cx", (d) => x(+d.Year))
        .attr("cy", (d) => y(+d["Flood Days"]))
        .attr("r", colors.pointRadius.normal)
        .attr("fill", color(country))
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", colors.pointRadius.hover);
          showTooltip(tooltip, event, `<strong>${d.Country}</strong><br/>Year: ${d.Year}<br/>${severity} Flood Days: ${d["Flood Days"]}`);
        })
        .on("mouseout", function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", colors.pointRadius.normal);
          hideTooltip(tooltip);
        })
        .on("click", (event, d) => {
          setClickedPoints((prev) => [...prev, d]);
        });
    });
  }, [data, severity, inView, width]);

  const handleDeletePoint = (index) => {
    setClickedPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetPoints = () => {
    setClickedPoints([]);
  };

  return (
    <ThemeAwareChartWrapper
      title="High Tide Flood Days Over Time"
      ref={setRefs}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <ToggleButtonGroup
          value={severity}
          exclusive
          onChange={(e, value) => value && setSeverity(value)}
          size="small"
          sx={{ ml: 2, color: theme.palette.text.primary }}
          aria-label="Severity"
        >
          {["Minor", "Moderate", "Major"].map((level) => (
            <ToggleButton key={level} value={level} sx={{ textTransform: "none" , color: theme.palette.text.primary }} aria-label={level}>
              {level}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <svg ref={svgRef} style={{ width: "100%", height: "400px" }} />
      {clickedPoints.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            maxWidth: "90vw",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <h4 style={{ margin: 0 , color: theme.palette.text.primary }}>Clicked Points</h4>
            <button
              onClick={handleResetPoints}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#d9534f",
                fontWeight: "bold",
                lineHeight: 1,
              }}
              aria-label="Clear all clicked points"
              title="Clear all clicked points"
            >
              &#x21bb;
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {clickedPoints.map((point, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  backgroundColor: theme.palette.background.paper,
                  position: "relative",
                  minWidth: "220px",
                  flex: "1 1 220px",
                }}
              >
                <button
                  onClick={() => handleDeletePoint(index)}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "8px",
                    border: "none",
                    background: "transparent",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    color: "#d9534f",
                    fontWeight: "bold",
                    lineHeight: 1,
                  }}
                  aria-label={`Remove clicked point ${point.Country} ${point.Year}`}
                  title={`Remove clicked point ${point.Country} ${point.Year}`}
                >
                  &times;
                </button>
                <h5 style={{ color: theme.palette.text.primary, margin: "0 0 0.3rem 0" }}>{point.Country} - {point.Year}</h5>
                <Divider style={{ margin: "0.5rem 0" }} />
                <p style={{ margin: "0.2rem 0" }}><strong>Severity:</strong> {point.Severity}</p>
                <p style={{ margin: "0.2rem 0" }}><strong>Flood Days:</strong> {point["Flood Days"]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </ThemeAwareChartWrapper>
  );
};

export default FloodDaysChart;
