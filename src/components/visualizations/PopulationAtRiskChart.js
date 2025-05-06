import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from "d3";

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
  Typography
} from '@mui/material';
import { populationChartColors } from "../../theme/themeUtils";
import { createTooltip, showTooltip, hideTooltip } from "../../utils/tooltipUtils";

import data from "../../data/processed_full_country.json";


const cities = ["Bangladesh", "Maldives", "Philippines"];

const PopulationAtRiskChart = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const { width = 600 } = useResizeObserver({ ref: wrapperRef });
  const { theme } = useTheme();
  const colors = populationChartColors(theme);

  const [stepIndex, setStepIndex] = useState(1);
  const [scenario, setScenario] = useState("baseline");

  const selectedCities = cities.slice(0, stepIndex);

  const filteredData = selectedCities.map((city) => ({
    city,
    values: data.filter((d) => d.Country === city && d.Year >= 2000),
  }));

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const height = 400;
    const margin = { top: 20, right: 60, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const allYears = data.map((d) => d.Year);
    const years = Array.from(new Set(allYears)).filter((y) => y >= 2000);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(years))
      .range([0, innerWidth]);

    const maxY = d3.max(filteredData.flatMap((d) => d.values.map((v) => v.Population)));
    const yScale = d3.scaleLinear()
      .domain([0, maxY])
      .nice()
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(cities)
      .range(cities.map(city => colors.cityPalette[city]));

    const lineGenerator = d3.line()
      .x((d) => xScale(d.Year))
      .y((d) => yScale(d.Population))
      .curve(d3.curveMonotoneX);

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("overflow", "visible")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
      .selectAll("text")
      .style("fill", colors.axisText);

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(d3.format(".2s")))
      .selectAll("text")
      .style("fill", colors.axisText);

    const tooltip = createTooltip(theme);

    filteredData.forEach(({ city, values }) => {
      const path = g.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", colorScale(city))
        .attr("stroke-width", 2.5)
        .attr("d", lineGenerator)
        .attr("stroke-dasharray", function () { return this.getTotalLength(); })
        .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
        .attr("opacity", 1);

      path.transition()
        .duration(1500)
        .attr("stroke-dashoffset", 0);

      g.selectAll(`.dot-${city}`)
        .data(values)
        .join("circle")
        .attr("class", `dot-${city}`)
        .attr("cx", (d) => xScale(d.Year))
        .attr("cy", (d) => yScale(d.Population))
        .attr("r", 0)
        .attr("fill", colorScale(city))
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", 6);

          showTooltip(tooltip, event, `<strong>${city}</strong><br/>Year: ${d.Year}<br/>Pop: ${d3.format(".2s")(d.Population)}`);
        })
        .on("mousemove", (event) => {
          showTooltip(tooltip, event);
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", 3);

          hideTooltip(tooltip);
        })
        .transition()
        .delay((d, i) => i * 50)
        .duration(800)
        .attr("r", 3);
    });
  }, [width, selectedCities, theme]);

  return (
    <Box ref={wrapperRef} className="chart-container chart-card">
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="scenario-select-label">Scenario</InputLabel>
          <Select
            labelId="scenario-select-label"
            id="scenario-select"
            value={scenario}
            label="Scenario"
            onChange={(e) => setScenario(e.target.value)}
            sx={{
              backgroundColor: colors.controlBg,
              color: colors.controlText,
              border: `1px solid ${colors.controlBorder}`,
              borderRadius: "4px"
            }}
          >
            <MenuItem value="baseline">Baseline</MenuItem>
            <MenuItem value="scenario1">Scenario 1</MenuItem>
            <MenuItem value="scenario2">Scenario 2</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body1" sx={{ mr: 1 }}>Toggle Cities:</Typography>
        {cities.map((city, index) => (
          <ToggleButton
            key={city}
            value={city}
            selected={index < stepIndex}
            onChange={() => {
              if (index + 1 === stepIndex) {
                setStepIndex(stepIndex - 1);
              } else if (index + 1 === stepIndex - 1) {
                setStepIndex(stepIndex + 1);
              }
            }}
            size="small"
            sx={{ textTransform: 'none' }}
          >
            {city}
          </ToggleButton>
        ))}
      </Box>
      <svg ref={svgRef} width="100%" height="400" />
    </Box>
  );
};

export default PopulationAtRiskChart;