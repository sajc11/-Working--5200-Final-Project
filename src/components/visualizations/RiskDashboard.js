import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, Button, IconButton, ClickAwayListener } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { createTooltip, showTooltip, hideTooltip } from "../../d3/tooltipUtils";
import ThemeAwareChartWrapper from '../ui/ThemeAwareChartWrapper';

const RiskDashboard = () => {
  const theme = useTheme();
  const svgRef = useRef();
  const [selectedYear, setSelectedYear] = useState(2020);
  const [selectedMetrics, setSelectedMetrics] = useState(['Flood Days']);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const tooltipTimeoutRef = useRef(null);
  
  // Sample data
  const sampleData = [
    { name: 'Bangladesh', floodDays: 45, seaLevel: 3.2, extremeHeat: 28, migration: 150000 },
    { name: 'Philippines', floodDays: 38, seaLevel: 2.8, extremeHeat: 32, migration: 120000 },
    { name: 'Maldives', floodDays: 52, seaLevel: 4.1, extremeHeat: 25, migration: 50000 },
  ];

  const metrics = [
    { id: 'Flood Days', label: 'Flood Days' },
    { id: 'Sea Level', label: 'Sea Level' },
    { id: 'Extreme Heat', label: 'Extreme Heat' },
    { id: 'Migration', label: 'Migration' }
  ];

  const colors = {
    'Flood Days': '#60a5fa',
    'Sea Level': '#34d399',
    'Extreme Heat': '#fb923c',
    'Migration': '#c084fc'
  };

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metric)) {
        return prev.filter(m => m !== metric);
      } else {
        return [...prev, metric];
      }
    });
  };

  const handleYearSelection = (year) => {
    setSelectedYear(year);
    setYearMenuOpen(false);
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(sampleData.map(d => d.name))
      .range([0, innerWidth])
      .padding(0.3);

    const yScales = {};

    selectedMetrics.forEach(metric => {
      const maxValue = d3.max(sampleData, d => {
        if (metric === 'Flood Days') return d.floodDays;
        if (metric === 'Sea Level') return d.seaLevel;
        if (metric === 'Extreme Heat') return d.extremeHeat;
        if (metric === 'Migration') return d.migration / 1000;
        return 0;
      });

      yScales[metric] = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([innerHeight, 0]);
    });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', theme.palette.text.primary)
      .style('font-size', '12px');

    if (selectedMetrics.length > 0) {
      g.append('g')
        .call(d3.axisLeft(yScales[selectedMetrics[0]]).ticks(6))
        .selectAll('text')
        .style('fill', theme.palette.text.primary)
        .style('font-size', '12px');
    }

    // Add grid lines
    if (selectedMetrics.length > 0) {
      g.append('g')
        .attr('class', 'grid')
        .style('opacity', 0.1)
        .call(
          d3.axisLeft(yScales[selectedMetrics[0]])
            .ticks(6)
            .tickSize(-innerWidth)
            .tickFormat('')
        )
        .selectAll('line')
        .style('stroke', theme.palette.text.primary);
    }

    // Add bars
    const barWidth = xScale.bandwidth() / selectedMetrics.length;
    
    selectedMetrics.forEach((metric, i) => {
      const bars = g.selectAll(`.bar-${metric.replace(/\s+/g, '-')}`)
        .data(sampleData)
        .join('rect')
        .attr('class', `bar-${metric.replace(/\s+/g, '-')}`)
        .attr('x', d => xScale(d.name) + i * barWidth)
        .attr('y', innerHeight)
        .attr('width', barWidth * 0.9)
        .attr('height', 0)
        .attr('fill', colors[metric])
        .attr('opacity', 0.8);

      bars.transition()
        .duration(800)
        .delay((d, j) => j * 100)
        .attr('y', d => {
          let value;
          if (metric === 'Flood Days') value = d.floodDays;
          else if (metric === 'Sea Level') value = d.seaLevel;
          else if (metric === 'Extreme Heat') value = d.extremeHeat;
          else if (metric === 'Migration') value = d.migration / 1000;
          return yScales[metric](value);
        })
        .attr('height', d => {
          let value;
          if (metric === 'Flood Days') value = d.floodDays;
          else if (metric === 'Sea Level') value = d.seaLevel;
          else if (metric === 'Extreme Heat') value = d.extremeHeat;
          else if (metric === 'Migration') value = d.migration / 1000;
          return innerHeight - yScales[metric](value);
        });

      // Add tooltips
      const tooltip = createTooltip(theme);

      bars.on('mouseenter', function(event, d) {
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }

        tooltipTimeoutRef.current = setTimeout(() => {
          d3.select(this).attr('opacity', 1);

          let value;
          let unit = '';
          if (metric === 'Flood Days') {
            value = d.floodDays;
            unit = ' days';
          } else if (metric === 'Sea Level') {
            value = d.seaLevel;
            unit = 'mm';
          } else if (metric === 'Extreme Heat') {
            value = d.extremeHeat;
            unit = '°C';
          } else if (metric === 'Migration') {
            value = d.migration.toLocaleString();
            unit = ' people';
          }

          showTooltip(
            tooltip,
            event,
            `<div style="line-height: 1.4;">
              <strong style="color: ${colors[metric]}">${d.name}</strong><br/>
              ${metric}: ${value}${unit}
            </div>`
          );
        }, 1000);
      })
      .on('mousemove', function(event) {
        if (tooltip.style('opacity') !== '0') {
          showTooltip(tooltip, event);
        }
      })
      .on('mouseleave', function() {
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = null;
        }
        
        d3.select(this).attr('opacity', 0.8);
        hideTooltip(tooltip);
      });
    });

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 180}, 20)`);

    selectedMetrics.forEach((metric, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colors[metric]);

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(metric)
        .style('fill', theme.palette.text.primary)
        .style('font-size', '12px');
    });

    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };

  }, [selectedMetrics, selectedYear, theme]);

  return (
    <div>
      {/* Dark menu bar - exactly as shown in your image */}
      <div style={{
        backgroundColor: '#0a1117',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        minHeight: '72px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        overflowX: 'auto',
        marginBottom: '24px'
      }}>
        <button 
          style={{
            color: 'white',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CloseIcon style={{ fontSize: '20px' }} />
        </button>

        {/* Metric Toggle Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {metrics.map(metric => (
            <button
              key={metric.id}
              onClick={() => toggleMetric(metric.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '100px',
                border: selectedMetrics.includes(metric.id) ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: selectedMetrics.includes(metric.id) ? colors[metric.id] : 'transparent',
                color: selectedMetrics.includes(metric.id) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>

        {/* Year Selector */}
        <ClickAwayListener onClickAway={() => setYearMenuOpen(false)}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setYearMenuOpen(!yearMenuOpen)}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '100px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: '#1f2937',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              {selectedYear}
              {yearMenuOpen ? 
                <ArrowDropUpIcon style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.7)' }} /> :
                <ArrowDropDownIcon style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.7)' }} />
              }
            </button>
            
            {yearMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: '#1f2937',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                zIndex: 1000,
                minWidth: '100px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                {[2018, 2019, 2020, 2021, 2022].map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearSelection(year)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      ':hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ClickAwayListener>
      </div>

      {/* Chart Content - with ThemeAwareChartWrapper */}
      <ThemeAwareChartWrapper title="Climate Risk Analysis Dashboard">
        <svg 
          ref={svgRef} 
          style={{ 
            width: '100%', 
            height: '400px',
            overflow: 'visible'
          }} 
        />

        {/* Color Scale Legend */}
        <div style={{ marginTop: '24px' }}>
          <p style={{ 
            fontSize: '14px', 
            marginBottom: '8px', 
            color: theme.palette.text.primary 
          }}>
            Risk Index Color Scale:
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(to right, #93c5fd, #ef4444)',
            height: '20px',
            width: '300px',
            borderRadius: '4px',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              fontSize: '12px',
              color: theme.palette.text.primary
            }}>
              Low
            </span>
            <span style={{
              position: 'absolute',
              right: 0,
              fontSize: '12px',
              color: theme.palette.text.primary
            }}>
              High
            </span>
          </div>
        </div>

        {/* Metric Indicators */}
        <div style={{ 
          marginTop: '16px', 
          display: 'flex', 
          gap: '16px', 
          flexWrap: 'wrap' 
        }}>
          {selectedMetrics.map(metric => (
            <div key={metric} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              opacity: 0.7
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: colors[metric]
              }} />
              <span style={{ 
                fontSize: '14px', 
                color: theme.palette.text.secondary 
              }}>
                {metric}
              </span>
            </div>
          ))}
        </div>
      </ThemeAwareChartWrapper>
    </div>
  );
};

export default RiskDashboard;