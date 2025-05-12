import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Area
} from 'recharts';
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
import useIncidentMapData from '../../hooks/useIncidentMapData';
import PopulationMapMenuBar from '../ui/PopulationMapMenuBar';
import ThemeAwareChartWrapper from '../ui/ThemeAwareChartWrapper';


const cities = ["Bangladesh", "Maldives", "Philippines"];

const PopulationAtRiskChart = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const [data, setData] = useState([]);
  const [currentYear, setCurrentYear] = useState(2000);
  const [selectedCountries, setSelectedCountries] = useState(['Bangladesh', 'Philippines']);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [animationSpeed, setAnimationSpeed] = useState(700);
  const [helpHovered, setHelpHovered] = useState(false);
  const theme = useTheme();
  const { width = 600 } = useResizeObserver({ ref: wrapperRef });
  const colors = populationChartColors(theme);

  const [selectedCities, setSelectedCities] = useState(["Bangladesh"]);
  const [scenario, setScenario] = useState("baseline");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metricType, setMetricType] = useState("Sea Level Risk");
  const [chartType, setChartType] = useState("Line");
  const [yearRange, setYearRange] = useState([1975, 2023]);
  
  const { incidents: rawIncidents } = useIncidentMapData();
  const incidents = rawIncidents ?? [];

  // Process climate metrics data
  const processClimateData = useCallback((city, metric, scenario) => {
    try {
      const cityData = Object.fromEntries(incidents
        .filter(d => d.Country === city)
        .map(d => [d.Year.toString(), d]));
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
  }, [yearRange, incidents]);

  // Get data for all selected cities with scenario applied
  const getFilteredData = useCallback(() => {
    return selectedCities.map(city => ({
      city,
      values: processClimateData(city, metricType, scenario)
    }));
  }, [selectedCities, metricType, scenario, processClimateData]);

  // Get the filtered data based on current selections
  const filteredData = getFilteredData();

  // Compute unified list of years across all series
  const unifiedYears = Array.from(new Set(
    filteredData.flatMap(series => series.values.map(d => d.year))
  )).sort((a, b) => a - b);

  // Build unified data array for charting
  const unifiedData = unifiedYears.map(year => {
    const entry = { year };
    filteredData.forEach(series => {
      const match = series.values.find(v => v.year === year);
      if (match) entry[series.city] = match.value;
    });
    return entry;
  });

  // Simulate loading when scenario or selected cities change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [scenario, selectedCities, metricType]);

  // Chart rendering effect removed (D3 and SVG logic)

  if (!incidents.length) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading climate risk data...
        </Typography>
      </Box>
    );
  }

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
      <Box sx={{ px: { xs: 3, sm: 4 }, pt: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ 
          color: theme.palette.text.primary, 
          marginBottom: '10px',
          fontWeight: 700,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, flexWrap: 'wrap', gap: 2 }}>
          {/* Metric Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Metric:</Typography>
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
                    py: 0.7,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: metric === metricType ? 600 : 500,
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
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Chart Type:</Typography>
            <Box sx={{ 
              display: 'flex', 
              borderRadius: 1,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
            }}>
              {['Line', 'Bar'].map((type) => (
                <Box 
                  key={type}
                  onClick={() => setChartType(type)}
                  sx={{
                    px: 1.5,
                    py: 0.7,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: type === chartType ? 600 : 500,
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
          {/* Dynamic chart rendering based on chartType */}
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'Line' || chartType === 'Area' ? (
              <LineChart
                data={unifiedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fill: theme.palette.text.primary }} />
                <YAxis tick={{ fill: theme.palette.text.primary }} />
                <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper }} />
                <Legend />
                {filteredData.map(series => (
                  <React.Fragment key={series.city}>
                    {chartType === 'Area' && (
                      <Area
                        type="monotone"
                        dataKey={series.city}
                        name={series.city}
                        fill={colors.cityPalette[series.city] || theme.palette.primary.main}
                        stroke={colors.cityPalette[series.city] || theme.palette.primary.main}
                        strokeWidth={2}
                      />
                    )}
                    {chartType === 'Line' && (
                      <Line
                        type="monotone"
                        dataKey={series.city}
                        name={series.city}
                        stroke={colors.cityPalette[series.city] || theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </React.Fragment>
                ))}
              </LineChart>
            ) : (
              <BarChart
                data={unifiedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fill: theme.palette.text.primary }} />
                <YAxis tick={{ fill: theme.palette.text.primary }} />
                <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper }} />
                <Legend />
                {filteredData.map(series => (
                  <Bar
                    key={series.city}
                    dataKey={series.city}
                    name={series.city}
                    fill={colors.cityPalette[series.city] || theme.palette.primary.main}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
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
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 600 }}>
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
