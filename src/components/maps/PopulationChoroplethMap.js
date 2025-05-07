import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import { getSouthAsiaProjection, getCountryCenter } from '../../utils/mapUtils';
import { Tooltip } from '../../utils/tooltipUtils';
import * as d3 from 'd3';

const cityData = [
  { name: 'Dhaka', country: 'Bangladesh', population: 8906000, coords: [90.4125, 23.8103] },
  { name: 'Chittagong', country: 'Bangladesh', population: 2690000, coords: [91.7832, 22.3569] },
  { name: 'Malé', country: 'Maldives', population: 133412, coords: [73.5089, 4.1755] },
  { name: 'Addu City', country: 'Maldives', population: 37000, coords: [73.1014, -0.6297] },
  { name: 'Manila', country: 'Philippines', population: 1780148, coords: [120.9842, 14.5995] },
  { name: 'Quezon City', country: 'Philippines', population: 2936111, coords: [121.0509, 14.6760] },
];

const maxPopulation = Math.max(...cityData.map(d => d.population));
const minRadius = 5;
const maxRadius = 25;

function scaleRadius(population) {
  return minRadius + ((population / maxPopulation) * (maxRadius - minRadius));
}

// Color scale based on population using d3.interpolatePlasma
const colorScale = d3.scaleSequential()
  .domain([0, maxPopulation])
  .interpolator(d3.interpolatePlasma);

export default function PopulationChoroplethMap() {
  const [selectedCountries, setSelectedCountries] = useState(['Bangladesh', 'Maldives', 'Philippines']);
  const [projectionCenterKey, setProjectionCenterKey] = useState('default');
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const gRef = useRef(null);

  // Update dimensions on window resize
  useEffect(() => {
    function handleResize() {
      const width = svgRef.current ? svgRef.current.clientWidth : 900;
      const height = svgRef.current ? svgRef.current.clientHeight : 600;
      setDimensions({ width, height });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoize projection based on center and dimensions
  const projection = useMemo(() => {
    let center = null;
    if (projectionCenterKey !== 'default') {
      center = getCountryCenter(projectionCenterKey);
    }
    return getSouthAsiaProjection(center, dimensions);
  }, [projectionCenterKey, dimensions]);

  const filteredCities = cityData.filter(city => selectedCountries.includes(city.country));

  // Prepare data with projection coordinates and radius
  const cityPoints = filteredCities.map(city => {
    const [x, y] = projection(city.coords);
    const radius = scaleRadius(city.population);
    return { ...city, x, y, radius };
  });

  // Setup zoom behavior constrained to projection bounding box
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Get projection bounds to constrain zoom
    // Approximate bounds by projecting corners of the projection extent
    // getSouthAsiaProjection returns a d3 projection with .fitSize or similar,
    // but as we don't have extent here, we approximate with svg dimensions
    const [[x0, y0], [x1, y1]] = [[0, 0], [dimensions.width, dimensions.height]];

    // Define zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[x0, y0], [x1, y1]])
      .extent([[x0, y0], [x1, y1]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Reset zoom to identity on projection or dimension change
    svg.call(zoom.transform, d3.zoomIdentity);

  }, [dimensions, projectionCenterKey]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const circles = g.selectAll('circle.city-circle').data(cityPoints, d => d.name);

    // EXIT old elements not present in new data.
    circles.exit()
      .transition()
      .duration(750)
      .attr('r', 0)
      .remove();

    // UPDATE existing elements
    circles.transition()
      .duration(750)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius)
      .attr('fill', d => colorScale(d.population));

    // ENTER new elements
    circles.enter()
      .append('circle')
      .attr('class', 'city-circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 0)
      .attr('fill', d => colorScale(d.population))
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const tooltip = d3.select('#tooltip');
        tooltip.style('opacity', 1)
          .html(`<strong>${d.name}</strong><br/>Country: ${d.country}<br/>Population: ${d.population.toLocaleString()}`);
      })
      .on('mousemove', (event) => {
        const tooltip = d3.select('#tooltip');
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on('mouseleave', () => {
        d3.select('#tooltip').style('opacity', 0);
      })
      .transition()
      .duration(750)
      .attr('r', d => d.radius);

  }, [cityPoints]);

  const handleToggleCountries = (event, newCountries) => {
    if (newCountries.length) {
      setSelectedCountries(newCountries);
    }
  };

  const handleProjectionToggle = (event, newKey) => {
    if (newKey !== null) {
      setProjectionCenterKey(newKey);
    }
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div style={{ maxWidth: 900, margin: 'auto' }}>
      <h2>Population Choropleth Map of South Asian Cities</h2>
      <p>Circle size represents city population; color indicates population magnitude.</p>

      <ToggleButtonGroup
        value={selectedCountries}
        onChange={handleToggleCountries}
        aria-label="select countries"
        sx={{ marginBottom: 2 }}
      >
        {['Bangladesh', 'Maldives', 'Philippines'].map(country => (
          <ToggleButton key={country} value={country} aria-label={country}>
            {country}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <ToggleButtonGroup
        value={projectionCenterKey}
        exclusive
        onChange={handleProjectionToggle}
        aria-label="projection center"
        sx={{ marginBottom: 2, marginLeft: 2 }}
      >
        <ToggleButton value="default" aria-label="Default Projection">D</ToggleButton>
        <ToggleButton value="Bangladesh" aria-label="Bangladesh Center">B</ToggleButton>
        <ToggleButton value="Maldives" aria-label="Maldives Center">M</ToggleButton>
        <ToggleButton value="Philippines" aria-label="Philippines Center">P</ToggleButton>
      </ToggleButtonGroup>

      <Button variant="outlined" onClick={handleResetZoom} sx={{ mb: 2 }}>
        Reset Zoom
      </Button>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        width="100%"
        height="auto"
        style={{ border: '1px solid #ddd' }}
      >
        <g ref={gRef}>
          {/* Circles rendered and animated by D3 */}
        </g>
      </svg>

      <div style={{ marginTop: 20 }}>
        <h4>Legend</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div>Circle Size (Population):</div>
            <svg width={150} height={50}>
              {[1000000, 3000000, 6000000, 9000000].map((pop, i) => {
                const r = scaleRadius(pop);
                return (
                  <circle
                    key={pop}
                    cx={30 + i * 35}
                    cy={25}
                    r={r}
                    fill="#999"
                    stroke="#333"
                    strokeWidth={1}
                  />
                );
              })}
              {[1000000, 3000000, 6000000, 9000000].map((pop, i) => (
                <text
                  key={pop + '-label'}
                  x={30 + i * 35}
                  y={45}
                  fontSize={10}
                  textAnchor="middle"
                  fill="#333"
                >
                  {pop.toLocaleString()}
                </text>
              ))}
            </svg>
          </div>
          <div>
            <div>Population Color Scale:</div>
            <svg width={150} height={20} style={{ marginTop: 5 }}>
              <defs>
                <linearGradient id="pop-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                    <stop
                      key={i}
                      offset={`${t * 100}%`}
                      stopColor={d3.interpolatePlasma(t)}
                    />
                  ))}
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={150} height={20} fill="url(#pop-gradient)" />
              <text x={0} y={35} fontSize={10} fill="#333">Low</text>
              <text x={130} y={35} fontSize={10} fill="#333" textAnchor="end">High</text>
            </svg>
          </div>
        </div>
      </div>

      <div id="tooltip" style={{
        position: 'absolute',
        pointerEvents: 'none',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        opacity: 0,
        transition: 'opacity 0.3s',
        zIndex: 10,
      }} />
    </div>
  );
}
