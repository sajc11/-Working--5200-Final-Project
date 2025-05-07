import * as d3 from 'd3';

// 1. Geo Path Generator with Responsive Mercator Projection
export const getGeoPath = (width, height, scale = 120) => {
  const projection = d3.geoMercator()
    .scale(scale)
    .translate([width / 2, height / 1.5]);
  return d3.geoPath().projection(projection);
};

// 2. Risk Index Choropleth Color Scale
export const getRiskColorScale = (isDark = false) => {
  return d3.scaleQuantize()
    .domain([0, 1])
    .range(isDark
      ? ['#263238', '#37474F', '#455A64', '#546E7A', '#607D8B']
      : ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#2196F3']);
};

// 3. Flood Severity Color Mapping
export const getFloodSeverityColor = (severity) => {
  const colors = {
    Minor: '#A3BCC9FF',
    Moderate: '#4C7D97FF',
    Major: '#014F79FF'
  };
  return colors[severity] || '#BDBDBD';
};

// 4. Country-Level Tooltip HTML Builder
export const formatCountryTooltip = (countryName, metrics = {}) => {
  return `
    <strong style="font-size: 14px;">${countryName}</strong><br/>
    <div style="font-size: 13px;">
      <strong>Risk Index:</strong> ${metrics["Risk Index"] ?? "N/A"}<br/>
      <strong>Flood Days:</strong> ${(metrics["Minor"] ?? 0) + (metrics["Moderate"] ?? 0) + (metrics["Major"] ?? 0)}<br/>
      <strong>Extreme Heat Days:</strong> ${metrics["Extreme Heat Days"] ?? "N/A"}<br/>
      <strong>Sea Level (mm):</strong> ${metrics["Sea Level (mm)_y"] ?? metrics["Sea Level (mm)_x"] ?? "N/A"}<br/>
      <strong>Net Migration:</strong> ${metrics["Net migration"] ?? "N/A"}<br/>
    </div>
  `;
};

// 5. Build Continuous Legend for Quantitative Scales
export const buildContinuousLegend = (svg, colorScale, position = { x: 0, y: 0 }, width = 200, height = 8, title = "") => {
  const legendData = d3.range(colorScale.domain()[0], colorScale.domain()[1], (colorScale.domain()[1] - colorScale.domain()[0]) / width);
  const legendGroup = svg.append("g").attr("transform", `translate(${position.x},${position.y})`);

  legendGroup.selectAll("rect")
    .data(legendData)
    .join("rect")
    .attr("x", (d, i) => i)
    .attr("width", 1)
    .attr("height", height)
    .attr("fill", d => colorScale(d));

  if (title) {
    legendGroup.append("text")
      .attr("x", 0)
      .attr("y", -6)
      .text(title)
      .style("fill", "#666")
      .style("font-size", "12px");
  }
};


// 6. Projection centered over Bangladesh, Maldives, and the Philippines
export const getSouthAsiaProjection = (width, height) => {
  return d3.geoMercator()
    .center([95, 10]) // longitude, latitude: centered over South/Southeast Asia
    .scale((width / 640) * 180) // tuned zoom level
    .translate([width / 2, height / 2]);
};


// 7. Country-specific projection centers (for quick view jumps)
export const getCountryCenter = (country) => {
  const centers = {
    Bangladesh: [90.3563, 23.6850],
    Maldives: [73.2207, 3.2028],
    Philippines: [121.7740, 12.8797]
  };
  return centers[country] || [95, 10]; // fallback to general South Asia center
};

// 8. Get Avaoilable Years
export const getAvailableYears = (climateData) => {
  if (!climateData || Object.keys(climateData).length === 0) return [];
  const anyCountry = Object.values(climateData)[0];
  return Object.keys(anyCountry).map(y => +y).sort((a, b) => a - b);
};

// 9. Get Metrics by Country and Year
export const getCountryMetrics = (climateData, country, year) => {
  return climateData?.[country]?.[year] || {};
};

// 10. Abbreviated Projection Labels
export const getProjectionLabel = (abbreviation) => {
  return {
    D: 'default',
    B: 'bangladesh',
    M: 'maldives',
    P: 'philippines',
  }[abbreviation.toUpperCase()] || 'default';
};

// 11. Get Tooltip for Menu Options
export const getMenuOptionTooltip = (optionKey) => {
  const tooltips = {
    floodDays: 'Toggle circle overlays showing flood days per country.',
    seaLevel: 'Display sea level anomalies by country.',
    extremeHeat: 'Visualize days of extreme heat in each country.',
    migration: 'Show net migration values as scaled markers.',
    year: 'Use dropdown or slider to view data from a specific year.',
    projection: 'Jump to a map view centered on one of the countries.',
    reset: 'Clear all selected filters and reset the map view.',
  };
  return tooltips[optionKey] || '';
};

// 12. Get Overlay Color by Key
export const getOverlayColor = (key) => {
  const colors = {
    floodDays: '#1565c0',
    seaLevel: '#fcbf49',
    extremeHeat: '#d84315',
    migration: '#80b918',
  };
  return colors[key] || '#888888';
};

// 13. Get Projection Center by Key
export const getProjectionCenterByKey = (key) => {
  const map = {
    default: [95, 10],
    bangladesh: [90.3563, 23.6850],
    maldives: [73.2207, 3.2028],
    philippines: [121.7740, 12.8797]
  };
  return map[key] || [95, 10];
};