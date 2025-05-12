import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from "d3";
import {
  useTheme,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Card,
  Chip,
  Divider,
} from '@mui/material';
import { populationChartColors } from "../../theme/themeUtils";
import { createTooltip, showTooltip, hideTooltip } from "../../d3/tooltipUtils";
import { useResizeObserver } from '../../hooks/useResizeObserver';
import PopulationMapMenuBar from '../ui/PopulationMapMenuBar';
import ThemeAwareChartWrapper from '../ui/ThemeAwareChartWrapper';

// Import climate metrics data - using the correct path to public folder
import mergedClimateData from "/data/merged_climate_metrics.json";

const cities = ["Bangladesh", "Maldives", "Philippines"];

const PopulationAtRiskChart = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const { width = 600 } = useResizeObserver({ ref: wrapperRef });
  const theme = useTheme(); 
  const colors = populationChartColors(theme);

  const [selectedCities, setSelectedCities] = useState(["Bangladesh"]);
  const [scenario, setScenario] = useState("baseline");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metricType, setMetricType] = useState("Risk Index");
  const [chartType, setChartType] = useState("Line");
  const [yearRange, setYearRange] = useState([1975, 2023]);
  
  // Debug data availability on mount and state changes
  useEffect(() => {
    // Attempt to fetch the data directly if import doesn't work
    const fetchClimateData = async () => {
      try {
        const response = await fetch('/data/merged_climate_metrics.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched climate data:", data);
        
        // Check structure and available metrics
        const availableCountries = Object.keys(data);
        console.log("Available countries:", availableCountries);
        
        if (availableCountries.length > 0 && data[availableCountries[0]]) {
          const firstCountry = availableCountries[0];
          const yearKeys = Object.keys(data[firstCountry]).filter(k => !isNaN(parseInt(k)));
          console.log(`Sample years for ${firstCountry}:`, yearKeys.slice(0, 5));
          
          if (yearKeys.length > 0) {
            const firstYear = yearKeys[0];
            console.log(`Sample data for ${firstCountry} in ${firstYear}:`, data[firstCountry][firstYear]);
          }
        }
      } catch (err) {
        console.error("Error fetching climate data:", err);
        setError("Error loading climate data. Please check the console for details.");
      }
    };
    
    // If the imported data is empty or undefined, try fetching directly
    if (!mergedClimateData || Object.keys(mergedClimateData).length === 0) {
      console.log("Imported data unavailable, attempting direct fetch");
      fetchClimateData();
    } else {
      console.log("Using imported climate data:", mergedClimateData);
      // Log structure of imported data
      const availableCountries = Object.keys(mergedClimateData);
      console.log("Available countries:", availableCountries);
      
      if (availableCountries.length > 0 && mergedClimateData[availableCountries[0]]) {
        const firstCountry = availableCountries[0];
        const yearKeys = Object.keys(mergedClimateData[firstCountry]).filter(k => !isNaN(parseInt(k)));
        console.log(`Sample years for ${firstCountry}:`, yearKeys.slice(0, 5));
        
        if (yearKeys.length > 0) {
          const firstYear = yearKeys[0];
          console.log(`Sample data for ${firstCountry} in ${firstYear}:`, mergedClimateData[firstCountry][firstYear]);
        }
      }
    }
  }, []);

  // Process climate metrics data
  const processClimateData = useCallback((city, metric, scenario) => {
    try {
      const cityData = mergedClimateData[city];
      if (!cityData) {
        console.warn(`No data found for ${city}`);
        return [];
      }
      
      // Define multipliers for different scenarios
      const scenarioMultipliers = {
        baseline: 1.0,
        scenario1: 1.25, // Moderate impact: 25% more risk
        scenario2: 1.5   // High impact: 50% more risk
      };
      
      const multiplier = scenarioMultipliers[scenario] || 1.0;
      
      // Extract values for selected metric across years
      const years = Object.keys(cityData)
        .filter(year => !isNaN(parseInt(year)) && year >= yearRange[0] && year <= yearRange[1])
        .sort((a, b) => parseInt(a) - parseInt(b));
      
      // Add sample or fallback data for missing values - for demo/UI testing purposes
      // In production, you'd want to handle this differently
      const getSampleValue = (baseValue, year, startYear) => {
        const yearDiff = parseInt(year) - startYear;
        return baseValue * (1 + yearDiff * 0.01) + (Math.random() * 0.1 * baseValue);
      };
      
      // Get base values for demo data (use actual data if available)
      const startYear = Math.min(...years.map(y => parseInt(y)));
      const baseRiskIndex = 0.4621;
      const baseSeaLevelRisk = 0.2;
      const basePopExposure = 0.6931471805599451;
      const baseExtremeHeat = 3.0;
      const basePrecipitation = 2200;
      
      return years.map(year => {
        const yearData = cityData[year] || {};
        
        let value = 0;
        // Handle different metric types
        if (metric === "Risk Index") {
          value = yearData["Risk Index"] !== undefined ? yearData["Risk Index"] : 
                 getSampleValue(baseRiskIndex, year, startYear);
        } else if (metric === "Sea Level Risk") {
          value = yearData["Sea Level Risk"] !== undefined ? yearData["Sea Level Risk"] : 
                 getSampleValue(baseSeaLevelRisk, year, startYear);
        } else if (metric === "Population Exposure Risk") {
          value = yearData["Population Exposure Risk"] !== undefined ? yearData["Population Exposure Risk"] : 
                 getSampleValue(basePopExposure, year, startYear);
        } else if (metric === "Population") {
          value = yearData["Population, total"] !== undefined ? yearData["Population, total"] : 0;
        } else if (metric === "Extreme Heat") {
          value = yearData["Extreme Heat Days"] !== undefined ? yearData["Extreme Heat Days"] : 
                 getSampleValue(baseExtremeHeat, year, startYear);
        } else if (metric === "Flood Days") {
          value = ((yearData["Flood Major Days"] || 0) + 
                  (yearData["Flood Moderate Days"] || 0) + 
                  (yearData["Flood Minor Days"] || 0)) || 
                  getSampleValue(1, year, startYear);
        }
        
        // Apply scenario multiplier to the value
        value = value * multiplier;
        
        // Create enhanced yearData with fallback values
        const enhancedYearData = {
          ...yearData,
          "Risk Index": yearData["Risk Index"] !== undefined ? yearData["Risk Index"] : 
                       getSampleValue(baseRiskIndex, year, startYear),
          "Sea Level Risk": yearData["Sea Level Risk"] !== undefined ? yearData["Sea Level Risk"] : 
                          getSampleValue(baseSeaLevelRisk, year, startYear),
          "Population Exposure Risk": yearData["Population Exposure Risk"] !== undefined ? 
                                    yearData["Population Exposure Risk"] : 
                                    getSampleValue(basePopExposure, year, startYear),
          "Extreme Heat Days": yearData["Extreme Heat Days"] !== undefined ? 
                             yearData["Extreme Heat Days"] : 
                             getSampleValue(baseExtremeHeat, year, startYear),
          "Precipitation (mm)": yearData["Precipitation (mm)"] !== undefined ? 
                              yearData["Precipitation (mm)"] : 
                              getSampleValue(basePrecipitation, year, startYear)
        };
        
        return {
          year: parseInt(year),
          value: value,
          raw: enhancedYearData,
          city: city
        };
      });
    } catch (err) {
      setError(`Error processing climate data: ${err.message}`);
      console.error("Error in processClimateData:", err);
      return [];
    }
  }, [yearRange]);

  // Get data for all selected cities with scenario applied
  const getFilteredData = useCallback(() => {
    return selectedCities.map(city => ({
      city,
      values: processClimateData(city, metricType, scenario)
    }));
  }, [selectedCities, metricType, scenario, processClimateData]);

  // Get the filtered data based on current selections
  const filteredData = getFilteredData();

  // Simulate loading when scenario or selected cities change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [scenario, selectedCities, metricType]);

  // Chart rendering effect
  useEffect(() => {
    if (!svgRef.current || !width || isLoading || width < 100) return;
    
    try {
      // Debug data availability
      console.log("Rendering chart with data:", filteredData);
      
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const height = 450;
      const margin = { top: 40, right: 60, bottom: 70, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Collect all years from the data
      const allYears = new Set();
      filteredData.forEach(cityData => {
        cityData.values.forEach(d => allYears.add(d.year));
      });
      const years = Array.from(allYears).sort((a, b) => a - b);
      
      if (years.length === 0) {
        console.warn("No data available for the selected criteria");
        
        // Display a no-data message in the SVG
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("fill", theme.palette.text.secondary)
          .text("No data available for the selected filter criteria");
          
        return;
      }

      // Create scales
      const xScale = d3.scaleLinear()
        .domain([Math.min(...years), Math.max(...years)])
        .range([0, innerWidth]);

      // Calculate max value with padding
      const allValues = filteredData.flatMap(d => d.values.map(v => v.value));
      const maxValue = d3.max(allValues) || 1;
      const yScale = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .nice()
        .range([innerHeight, 0]);

      const colorScale = d3.scaleOrdinal()
        .domain(cities)
        .range(cities.map(city => colors.cityPalette[city]));

      // Create chart container
      const g = svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("aria-label", `Population risk ${metricType} chart`)
        .style("overflow", "visible")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Add background
      g.append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", theme.palette.mode === 'dark' ? '#0A1929' : '#F5F5F5')
        .attr("opacity", 0.3)
        .attr("rx", 8);

      // Add grid lines
      g.append("g")
        .attr("class", "grid")
        .attr("opacity", 0.1)
        .call(
          d3.axisLeft(yScale)
            .ticks(6)
            .tickSize(-innerWidth)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", theme.palette.text.primary);

      g.append("g")
        .attr("class", "grid")
        .attr("opacity", 0.1)
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(
          d3.axisBottom(xScale)
            .ticks(Math.min(10, years.length))
            .tickSize(-innerHeight)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", theme.palette.text.primary);

      // Add X axis
      const xAxis = g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(Math.min(10, years.length)));

      xAxis.selectAll("text")
        .style("fill", theme.palette.text.primary)
        .style("font-size", "12px")
        .style("font-weight", "500");

      xAxis.selectAll("line, path")
        .style("stroke", theme.palette.text.primary)
        .style("stroke-width", 1.5);

      // Add Y axis
      const yAxis = g.append("g")
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => {
          // Format based on metric type
          if (metricType === "Population") {
            return d3.format(".2s")(d);
          } else if (metricType === "Risk Index" || metricType.includes("Risk")) {
            return d3.format(".2f")(d);
          } else {
            return d3.format(".1f")(d);
          }
        }));

      yAxis.selectAll("text")
        .style("fill", theme.palette.text.primary)
        .style("font-size", "12px")
        .style("font-weight", "500");

      yAxis.selectAll("line, path")
        .style("stroke", theme.palette.text.primary)
        .style("stroke-width", 1.5);

      // Add X axis label
      g.append("text")
        .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + 50})`)
        .style("text-anchor", "middle")
        .style("fill", theme.palette.text.primary)
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text("Year");

      // Add Y axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -innerHeight / 2)
        .style("text-anchor", "middle")
        .style("fill", theme.palette.text.primary)
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text(metricType);

      // Add chart title
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", theme.palette.text.primary)
        .text(`${metricType} by Country (${scenario === 'baseline' ? 'Baseline' : 
          scenario === 'scenario1' ? 'Moderate Impact' : 'High Impact'} Scenario)`);

      // Create tooltip
      const tooltip = createTooltip(theme);

      // Draw based on chart type
      filteredData.forEach(({ city, values }) => {
        if (!values || values.length === 0) return;
        
        // Sort values by year
        values.sort((a, b) => a.year - b.year);
        
        if (chartType === "Line" || chartType === "Area") {
          // Line generator
          const lineGenerator = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX);
            
          // Add area under the line for Area chart
          if (chartType === "Area") {
            const area = d3.area()
              .x(d => xScale(d.year))
              .y0(innerHeight)
              .y1(d => yScale(d.value))
              .curve(d3.curveMonotoneX);
              
            g.append("path")
              .datum(values)
              .attr("fill", colorScale(city))
              .attr("opacity", 0.2)
              .attr("d", area);
          }
          
          // Add line path
          const path = g.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", colorScale(city))
            .attr("stroke-width", 3)
            .attr("d", lineGenerator)
            .attr("opacity", 0)
            .attr("aria-label", `${city} ${metricType} trend line`);
            
          // Animate path
          const totalLength = path.node().getTotalLength();
          path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .attr("opacity", 1)
            .transition()
            .duration(1500)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
        }
        
        // Add dots for all chart types
        const dots = g.selectAll(`.dot-${city.replace(/\s+/g, '')}`)
          .data(values)
          .join("circle")
          .attr("class", `dot-${city.replace(/\s+/g, '')}`)
          .attr("cx", d => xScale(d.year))
          .attr("cy", d => yScale(d.value))
          .attr("r", 0)
          .attr("fill", colorScale(city))
          .style("stroke", theme.palette.background.paper)
          .style("stroke-width", 2)
          .attr("aria-label", d => `${city} in ${d.year}: ${d.value.toLocaleString()} ${metricType}`)
          .on("mouseover", function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 8)
              .style("stroke-width", 3);
              
            // Format tooltip content based on metric type
            let valueDisplay = d.value;
            if (metricType === "Population") {
              valueDisplay = d3.format(",.0f")(d.value);
            } else if (metricType === "Risk Index" || metricType.includes("Risk")) {
              valueDisplay = d3.format(".4f")(d.value);
            } else {
              valueDisplay = d3.format(".2f")(d.value);
            }

            showTooltip(
              tooltip, 
              event, 
              `<div style="line-height: 1.4;">
                <strong style="color: ${colorScale(city)}">${city}</strong><br/>
                Year: ${d.year}<br/>
                ${metricType}: ${valueDisplay}<br/>
                <span style="font-size: 0.85em; opacity: 0.8;">Scenario: ${
                  scenario === 'baseline' ? 'Baseline' : 
                  scenario === 'scenario1' ? 'Moderate Impact' : 
                  'High Impact'
                }</span>
              </div>`
            );
          })
          .on("mousemove", (event) => {
            showTooltip(tooltip, event);
          })
          .on("mouseout", function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 5)
              .style("stroke-width", 2);

            hideTooltip(tooltip);
          });
        
        // Add bars for Bar chart type
        if (chartType === "Bar") {
          const barWidth = Math.min(innerWidth / (years.length * selectedCities.length * 1.5), 15);
          
          g.selectAll(`.bar-${city.replace(/\s+/g, '')}`)
            .data(values)
            .join("rect")
            .attr("class", `bar-${city.replace(/\s+/g, '')}`)
            .attr("x", (d, i) => xScale(d.year) - (barWidth * selectedCities.length / 2) + 
              selectedCities.indexOf(city) * barWidth)
            .attr("y", d => yScale(d.value))
            .attr("width", barWidth)
            .attr("height", d => innerHeight - yScale(d.value))
            .attr("fill", colorScale(city))
            .attr("opacity", 0.8)
            .attr("rx", 2)
            .attr("aria-label", d => `${city} in ${d.year}: ${d.value.toLocaleString()} ${metricType}`)
            .on("mouseover", function(event, d) {
              d3.select(this)
                .transition()
                .duration(200)
                .attr("opacity", 1)
                .attr("stroke", theme.palette.background.paper)
                .attr("stroke-width", 2);
                
              // Format tooltip content based on metric type
              let valueDisplay = d.value;
              if (metricType === "Population") {
                valueDisplay = d3.format(",.0f")(d.value);
              } else if (metricType === "Risk Index" || metricType.includes("Risk")) {
                valueDisplay = d3.format(".4f")(d.value);
              } else {
                valueDisplay = d3.format(".2f")(d.value);
              }
  
              showTooltip(
                tooltip, 
                event, 
                `<div style="line-height: 1.4;">
                  <strong style="color: ${colorScale(city)}">${city}</strong><br/>
                  Year: ${d.year}<br/>
                  ${metricType}: ${valueDisplay}<br/>
                  <span style="font-size: 0.85em; opacity: 0.8;">Scenario: ${
                    scenario === 'baseline' ? 'Baseline' : 
                    scenario === 'scenario1' ? 'Moderate Impact' : 
                    'High Impact'
                  }</span>
                </div>`
              );
            })
            .on("mousemove", (event) => {
              showTooltip(tooltip, event);
            })
            .on("mouseout", function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr("opacity", 0.8)
                .attr("stroke", "none");
  
              hideTooltip(tooltip);
            })
            .transition()
            .duration(800)
            .attr("y", d => yScale(d.value))
            .attr("height", d => innerHeight - yScale(d.value));
        }

        // Animate dots appearance
        dots.transition()
          .delay((d, i) => i * 30)
          .duration(800)
          .attr("r", 5);
      });

      // Add interactive legend
      const legend = g.append("g")
        .attr("transform", `translate(${innerWidth - 150}, 20)`);

      selectedCities.forEach((city, i) => {
        const legendItem = legend.append("g")
          .attr("transform", `translate(0, ${i * 30})`)
          .style("cursor", "pointer");

        // Add legend background
        const rect = legendItem.append("rect")
          .attr("x", -10)
          .attr("y", -15)
          .attr("width", 140)
          .attr("height", 30)
          .attr("fill", "transparent")
          .attr("rx", 4);

        // Add legend line/symbol
        if (chartType === "Line" || chartType === "Area") {
          legendItem.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 25)
            .attr("y2", 0)
            .attr("stroke", colorScale(city))
            .attr("stroke-width", 3);
        } else {
          legendItem.append("rect")
            .attr("x", 0)
            .attr("y", -7)
            .attr("width", 25)
            .attr("height", 14)
            .attr("fill", colorScale(city))
            .attr("rx", 2);
        }

        // Add legend dot
        legendItem.append("circle")
          .attr("cx", 12)
          .attr("cy", 0)
          .attr("r", 5)
          .attr("fill", colorScale(city))
          .style("stroke", theme.palette.background.paper)
          .style("stroke-width", 2);

        // Add legend text
        legendItem.append("text")
          .attr("x", 35)
          .attr("y", 4)
          .style("fill", theme.palette.text.primary)
          .style("font-size", "14px")
          .style("font-weight", "600")
          .text(city);

        // Add hover effects
        legendItem
          .on("mouseover", function() {
            rect.attr("fill", theme.palette.action.hover);
            // Highlight corresponding elements
            if (chartType === "Line" || chartType === "Area") {
              g.select(`path[stroke="${colorScale(city)}"]`)
                .attr("stroke-width", 4);
            } else if (chartType === "Bar") {
              g.selectAll(`.bar-${city.replace(/\s+/g, '')}`)
                .attr("opacity", 1);
            }
            g.selectAll(`.dot-${city.replace(/\s+/g, '')}`)
              .attr("r", 7);
          })
          .on("mouseout", function() {
            rect.attr("fill", "transparent");
            // Reset elements
            if (chartType === "Line" || chartType === "Area") {
              g.select(`path[stroke="${colorScale(city)}"]`)
                .attr("stroke-width", 3);
            } else if (chartType === "Bar") {
              g.selectAll(`.bar-${city.replace(/\s+/g, '')}`)
                .attr("opacity", 0.8);
            }
            g.selectAll(`.dot-${city.replace(/\s+/g, '')}`)
              .attr("r", 5);
          });
      });
    } catch (err) {
      setError("Error rendering chart");
      console.error("Error in chart rendering:", err);
    }
  }, [width, selectedCities, theme, colors, scenario, isLoading, filteredData, metricType, chartType]);

  return (
    <ThemeAwareChartWrapper
      title="Climate Risk Assessment"
      subtitle="Visualizing the impact of climate change on vulnerable populations in Coastal Asia"
    >
        
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1.5,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Scenario indicator */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box 
            sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%',
              bgcolor: scenario === 'baseline' 
                ? theme.palette.success.main 
                : scenario === 'scenario1' 
                  ? theme.palette.warning.main 
                  : theme.palette.error.main,
              boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
            }} 
          />
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          >
            {scenario === 'baseline' 
              ? 'Baseline Scenario' 
              : scenario === 'scenario1' 
                ? 'Moderate Impact' 
                : 'High Impact'}
          </Typography>
        </Box>
        
        {/* Countries indicator */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 0.5,
          }}
        >
          {selectedCities.map(city => (
            <Chip
              key={city}
              label={city}
              size="small"
              sx={{
                bgcolor: colors?.cityPalette?.[city] || theme.palette.primary.main,
                color: theme.palette.getContrastText(colors?.cityPalette?.[city] || theme.palette.primary.main),
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          ))}
        </Box>
        
        {/* Metric Type */}
        <Chip
          label={metricType}
          size="small"
          sx={{
            bgcolor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
          }}
        />
      </Box>
    
      {/* Menu Bar */}
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ 
          color: theme.palette.text.primary, 
          marginBottom: '10px',
          fontWeight: 600,
          borderBottom: `2px solid ${theme.palette.divider}`,
          paddingBottom: '8px'
        }}>
          Data Filters
        </Typography>
        <PopulationMapMenuBar
          selectedCities={selectedCities}
          setSelectedCities={setSelectedCities}
          scenario={scenario}
          setScenario={setScenario}
          colors={colors}
        />
        
        {/* Additional Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          {/* Metric Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Metric:</Typography>
            <Box sx={{ 
              display: 'flex', 
              borderRadius: 1,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
            }}>
              {['Risk Index', 'Population Exposure Risk', 'Sea Level Risk'].map((metric) => (
                <Box 
                  key={metric}
                  onClick={() => setMetricType(metric)}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    bgcolor: metric === metricType 
                      ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.action.selected) 
                      : 'transparent',
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  {metric.replace(' Risk', '')}
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Chart Type Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Chart Type:</Typography>
            <Box sx={{ 
              display: 'flex', 
              borderRadius: 1,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
            }}>
              {['Line', 'Bar', 'Area'].map((type) => (
                <Box 
                  key={type}
                  onClick={() => setChartType(type)}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    bgcolor: type === chartType 
                      ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.action.selected) 
                      : 'transparent',
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  {type}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mx: { xs: 2, sm: 3 }, mb: 2 }}
          variant="filled"
        >
          {error}
        </Alert>
      )}

      {/* Chart Content */}
      <Box
        ref={wrapperRef}
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 1, sm: 1 },
          pb: 4,
          width: '100%',
          position: 'relative',
          minHeight: 450,
        }}
      >
        {/* Loading indicator */}
        {isLoading ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 2,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(0,0,0,0.7)' 
                : 'rgba(255,255,255,0.8)',
              zIndex: 10,
              borderRadius: 2,
              backdropFilter: 'blur(3px)',
            }}
            aria-live="polite"
            aria-busy={isLoading}
          >
            <CircularProgress size={56} color="secondary" />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Updating scenario data...
            </Typography>
          </Box>
        ) : null}

        {/* Chart Container */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.03)' 
              : 'rgba(0,0,0,0.01)',
            border: `1px solid ${theme.palette.divider}`,
            p: 2,
            mb: 3,
            position: 'relative',
          }}
        >
          {/* D3 Chart Rendering Area */}
          <Box sx={{ position: 'relative', height: 400 }}>
            <svg 
              ref={svgRef} 
              width="100%" 
              height="100%" 
              style={{ overflow: 'visible' }}
              aria-hidden={isLoading}
            />
            
            {/* Year Range Slider */}
            <Box sx={{
              position: 'absolute',
              bottom: -20,
              left: 60,
              right: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>{yearRange[0]}</Typography>
              <Box sx={{
                flex: 1,
                mx: 2,
                height: 4,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: 2,
                position: 'relative',
              }}>
                <Box sx={{
                  position: 'absolute',
                  left: 0,
                  right: '25%',
                  top: 0,
                  bottom: 0,
                  bgcolor: theme.palette.primary.main,
                  borderRadius: 2,
                }} />
                <Box sx={{
                  position: 'absolute',
                  right: '25%',
                  top: -6,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.main,
                  border: `3px solid ${theme.palette.background.paper}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                }} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>{yearRange[1]}</Typography>
            </Box>
          </Box>
        </Paper>
        
        {/* Data Insights Panel */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
          }}
        >
          {/* Statistics Cards */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2,
            flex: 1,
          }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(0,0,0,0.01)',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}
              >
                Key Risk Metrics
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedCities.map(city => {
                  // Get latest data for city
                  const cityData = filteredData.find(d => d.city === city);
                  const latestData = cityData?.values?.slice(-1)[0] || { value: 0, raw: {} };
                  
                  return (
                    <Box key={city} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 40, 
                        borderRadius: 4,
                        bgcolor: colors?.cityPalette?.[city],
                      }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {city}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Current {metricType}: {latestData?.value?.toFixed(4) || "N/A"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 0.5
                          }}
                        >
                          {latestData?.raw?.["Population, total"] 
                            ? Math.round((latestData.raw["Population, total"] * (scenario === 'baseline' ? 1 : 
                              scenario === 'scenario1' ? 1.25 : 1.5)) / 1000000).toLocaleString() + "M"
                            : "N/A"}
                          <Chip 
                            size="small" 
                            label={`+${scenario === 'baseline' ? '0' : scenario === 'scenario1' ? '25' : '50'}%`} 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: scenario === 'baseline' ? theme.palette.success.light : 
                                      scenario === 'scenario1' ? theme.palette.warning.light : 
                                      theme.palette.error.light,
                              color: theme.palette.getContrastText(
                                scenario === 'baseline' ? theme.palette.success.light : 
                                scenario === 'scenario1' ? theme.palette.warning.light : 
                                theme.palette.error.light
                              ),
                            }} 
                          />
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Population at risk
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
            
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(0,0,0,0.01)',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Climate Indicators
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                {selectedCities.length > 0 && (() => {
                  // Get data for first selected city
                  const cityData = filteredData.find(d => d.city === selectedCities[0]);
                  const latestData = cityData?.values?.slice(-1)[0]?.raw || {};
                  const prevData = cityData?.values?.slice(-2, -1)[0]?.raw || {};
                  
                  // Determine trends by comparing with previous data point
                  const getMetricTrend = (current, previous, key) => {
                    const currentVal = current[key];
                    const previousVal = previous[key];
                    if (currentVal === undefined || previousVal === undefined) return 'stable';
                    return currentVal > previousVal ? 'up' : (currentVal < previousVal ? 'down' : 'stable');
                  };
                  
                  return [
                    { 
                      name: 'Extreme Heat', 
                      value: latestData["Extreme Heat Days"] !== undefined 
                        ? `${Number(latestData["Extreme Heat Days"]).toFixed(1)} days` 
                        : 'N/A', 
                      trend: getMetricTrend(latestData, prevData, "Extreme Heat Days")
                    },
                    { 
                      name: 'Urban %', 
                      value: latestData["Urban population (% of total population)"] !== undefined
                        ? `${Number(latestData["Urban population (% of total population)"]).toFixed(1)}%` 
                        : 'N/A',
                      trend: getMetricTrend(latestData, prevData, "Urban population (% of total population)")
                    },
                    { 
                      name: 'Precipitation', 
                      value: latestData["Precipitation (mm)"] !== undefined
                        ? `${Number(latestData["Precipitation (mm)"]).toFixed(0)}mm` 
                        : 'N/A',
                      trend: getMetricTrend(latestData, prevData, "Precipitation (mm)")
                    }
                  ].map(metric => (
                    <Box 
                      key={metric.name} 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${theme.palette.divider}`,
                        minWidth: 100,
                        flex: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        {metric.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {metric.value}
                        </Typography>
                        <Box 
                          sx={{ 
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderBottom: metric.trend === 'up' ? `8px solid ${theme.palette.error.main}` : 'none',
                            borderTop: metric.trend === 'down' ? `8px solid ${theme.palette.success.main}` : 'none',
                            ml: 0.5,
                            display: metric.trend === 'stable' ? 'none' : 'block'
                          }} 
                        />
                      </Box>
                    </Box>
                  ));
                })()}
              </Box>
            </Paper>
          </Box>
          
          {/* Info Box */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.01)',
              border: `1px solid ${theme.palette.divider}`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: theme.palette.custom.chartAccent
              }}
            >
              Risk Factors Analysis
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                <strong>Risk Index:</strong> Combined climate vulnerability score derived from multiple factors
              </Typography>
              
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                <strong>Population Exposure:</strong> Estimates population vulnerable to climate risks
              </Typography>
              
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                <strong>Sea Level Risk:</strong> Vulnerability to rising sea levels and coastal flooding
              </Typography>
              
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 1,
                    bgcolor: theme.palette.warning.main,
                    color: theme.palette.getContrastText(theme.palette.warning.main),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    flexShrink: 0,
                  }}>
                    !
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {scenario === 'baseline' 
                      ? 'Rising sea levels and extreme heat days increasing risk exposure' 
                      : scenario === 'scenario1' 
                        ? 'Accelerated climate change will significantly impact coastal regions'
                        : 'Urgent adaptation measures needed to mitigate projected population displacement'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </ThemeAwareChartWrapper>
  );
};

export default PopulationAtRiskChart;