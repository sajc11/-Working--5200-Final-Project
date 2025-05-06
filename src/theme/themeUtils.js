// src/theme/themeUtils.js

// Function to get current theme mode (light or dark)
export const getCurrentTheme = (theme) => {
    if (!theme) return 'light';
    return theme.palette.mode;
  };
  
  // Function to get colors for the Sea Level chart
  export const seaLevelChartColors = (theme) => {
    const isDark = theme.palette.mode === 'dark';
    const custom = theme.palette.custom;
  
    return {
      line: custom.chartAccent,                   // stroke color of the line
      point: custom.chartAccent,                  // color of the points
      tooltipBg: custom.tooltipBg,
      tooltipText: custom.tooltipText,
      axisText: theme.palette.text.primary
    };
  };
  
  // Function to get colors for the PopulationAtRisk chart
  export const populationChartColors = (theme) => {
    return {
      cityPalette: {
        Bangladesh: theme.palette.custom.chartAccent,
        Maldives: theme.palette.custom.danger,
        Philippines: theme.palette.primary?.main || "#0077b6",
      },
      tooltipBg: theme.palette.custom.tooltipBg,
      tooltipText: theme.palette.custom.tooltipText,
      axisText: theme.palette.text.primary,
      controlBorder: theme.palette.custom.chartAccent,
      controlBg: theme.palette.background.paper,
      controlText: theme.palette.text.primary,
    };
  };

  // Function to get colors for the Lead/Lag chart
  export const leadLagChartColors = (theme) => {
    const custom = theme.palette.custom;
    const text = theme.palette.text;
    return {
      tooltipBg: custom.tooltipBg,
      tooltipText: custom.tooltipText,
      axisText: text.primary,
      hoverStroke: text.secondary,
    };
  };

  export const floodDaysChartColors = (theme) => {
    const custom = theme.palette.custom;
    const text = theme.palette.text;
  
    return {
      tooltipBg: custom.tooltipBg,
      tooltipText: custom.tooltipText,
      axisText: text.primary,
      floodLines: {
        Bangladesh: custom.chartAccent || "#0077b6",
        Philippines: custom.danger || "#f77f00"
      },
      pointRadius: {
        normal: 4,
        hover: 8
      }
    };
  };