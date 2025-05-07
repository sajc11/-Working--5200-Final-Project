import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Box, Typography, useTheme, Slider } from '@mui/material';
import { createTooltip, showTooltip, hideTooltip } from '../../d3/tooltipUtils';
import MapMenuBar from '../ui/MapMenuBar';
import {
    getAvailableYears,
    getCountryMetrics,
    getOverlayColor,
    getProjectionCenterByKey,
} from '../../d3/mapUtils';

// Overlay metric keys and pretty names
const OVERLAY_LAYERS = [
    { key: 'Flood Days', label: 'Flood Days' },
    { key: 'Sea Level', label: 'Sea Level' },
    { key: 'Extreme Heat', label: 'Extreme Heat' },
    { key: 'Migration', label: 'Migration' }
];

const BASE_METRIC = 'Risk Index';

const RegionMap = () => {
    const svgRef = useRef();
    const containerRef = useRef();
    const tooltip = useRef();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [worldData, setWorldData] = useState(null);
    const [climateData, setClimateData] = useState(null);
    const [dims, setDims] = useState({ width: 800, height: 520 });
    const [projectionCenter, setProjectionCenter] = useState(getProjectionCenterByKey('Default'));
    const [zoomTransform, setZoomTransform] = useState(null);
    const [activeOverlays, setActiveOverlays] = useState([]);
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [selectedCountries, setSelectedCountries] = useState([]); // store selected country names
    const [selectedYear, setSelectedYear] = useState(null);
    const [autoplay, setAutoplay] = useState(false); // Autoplay toggle

    const availableYears = getAvailableYears(climateData);

    // Initialize selectedYear to first available year once climateData loads
    useEffect(() => {
        if (availableYears.length > 0 && selectedYear === null) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    // Load topojson and merged climate metrics
    useEffect(() => {
        fetch('/world-110m.json')
            .then(res => res.json())
            .then(setWorldData)
            .catch(console.error);
        fetch('/merged_climate_metrics.json')
            .then(res => res.json())
            .then(setClimateData)
            .catch(console.error);
    }, []);

    // Responsive sizing
    useEffect(() => {
        const onResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            setDims({ width: w, height: w * 0.65 });
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Autoplay functionality
    useEffect(() => {
        if (!autoplay || !availableYears.length) return;

        const interval = setInterval(() => {
            setSelectedYear(prev => {
                const currentIndex = availableYears.indexOf(prev);
                const nextIndex = (currentIndex + 1) % availableYears.length;
                return availableYears[nextIndex];
            });
        }, 1800); // Adjust speed here (ms)

        return () => clearInterval(interval);
    }, [autoplay, availableYears]);

    // Main rendering effect with animation on selectedYear change
    useEffect(() => {
        if (!worldData || !climateData || selectedYear === null) return;
        tooltip.current = createTooltip(theme);

        const { width, height } = dims;
        const margin = { top: 30, right: 20, bottom: 30, left: 20 };
        const projection = d3.geoMercator()
            .center(projectionCenter)
            .scale((width / 640) * 180)
            .translate([width / 2, height / 2]);
        const path = d3.geoPath(projection);

        // Prepare data map: country name -> metrics for selectedYear
        const metricsMap = new Map();
        for (const row of climateData) {
            if (row.Year === selectedYear) {
                metricsMap.set(row.Country, row);
            }
        }

        // Color scale for base choropleth (Risk Index)
        const riskVals = Array.from(metricsMap.values()).map(d => +d[BASE_METRIC]).filter(Number.isFinite);
        const riskMin = d3.min(riskVals);
        const riskMax = d3.max(riskVals);
        const riskColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([riskMin, riskMax]);

        // Overlay scales (for circle radius)
        const overlayScales = {};
        OVERLAY_LAYERS.forEach(({ key }) => {
            const vals = Array.from(metricsMap.values()).map(d => +d[key]).filter(Number.isFinite);
            const min = d3.min(vals);
            const max = d3.max(vals);
            overlayScales[key] = d3.scaleSqrt()
                .domain([min, max])
                .range([0, 40]); // Max circle radius
        });

        // Prepare SVG
        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('cursor', 'grab');
        svg.selectAll('*').remove();

        // Zoom group
        const mapGroup = svg.append('g').attr('class', 'map-group');
        if (zoomTransform) mapGroup.attr('transform', zoomTransform);

        // Draw countries
        const countries = topojson.feature(worldData, worldData.objects.countries).features;

        // Append country paths and animate fill on selectedYear change
        const countryPaths = mapGroup.selectAll('.country-path')
            .data(countries)
            .join('path')
            .attr('class', 'country-path')
            .attr('d', path)
            .attr('stroke', d => {
                if (selectedCountries.includes(d.properties.name)) return theme.palette.primary.main;
                if (hoveredCountry === d.properties.name) return theme.palette.secondary.main;
                return theme.palette.divider;
            })
            .attr('stroke-width', d =>
                selectedCountries.includes(d.properties.name) ? 2 :
                    hoveredCountry === d.properties.name ? 1.5 : 0.7
            )
            .on('mouseover', (event, d) => {
                setHoveredCountry(d.properties.name);
                const country = d.properties.name;
                const m = metricsMap.get(country);
                let html = `<div style="padding:8px;">
          <strong style="font-size:15px;color:${theme.palette.primary.main}">${country}</strong><br/>`;
                if (m) {
                    html += `<div style="margin-top:5px;">
            <span><b>Risk Index:</b> ${m[BASE_METRIC]}</span><br/>`;
                    OVERLAY_LAYERS.forEach(({ key, label }) => {
                        html += `<span><b>${label}:</b> ${m[key]}</span><br/>`;
                    });
                    html += '</div>';
                } else {
                    html += '<em>No data</em>';
                }
                html += `<div style="font-size:12px;color:#888;margin-top:4px;">Click for details</div></div>`;
                showTooltip(tooltip.current, event, html);
            })
            .on('mousemove', (event) => {
                showTooltip(tooltip.current, event);
            })
            .on('mouseout', () => {
                setHoveredCountry(null);
                hideTooltip(tooltip.current);
            })
            .on('click', (event, d) => {
                const countryName = d.properties.name;
                setSelectedCountries(prev => {
                    if (prev.includes(countryName)) {
                        return prev.filter(c => c !== countryName);
                    } else {
                        return [...prev, countryName];
                    }
                });
            });

        // Animate fill color for countries on selectedYear change
        countryPaths.transition()
            .duration(750)
            .attrTween('fill', function (d) {
                const country = d.properties.name;
                const m = metricsMap.get(country);
                const currentFill = d3.select(this).attr('fill') || (isDark ? '#222' : '#f0f0f0');
                const targetValue = m ? +m[BASE_METRIC] : NaN;
                const targetFill = (m && Number.isFinite(targetValue)) ? riskColor(targetValue) : (isDark ? '#222' : '#f0f0f0');
                const interpolator = d3.interpolateRgb(currentFill, targetFill);
                return t => interpolator(t);
            });

        // Overlay circles for each active overlay with animation
        activeOverlays.forEach((overlayKey, i) => {
            const overlayColor = OVERLAY_LAYERS.find(l => l.key === overlayKey).color;
            const circles = mapGroup.selectAll(`.overlay-circle-${i}`)
                .data(countries)
                .join('circle')
                .attr('class', `overlay-circle overlay-circle-${i}`)
                .attr('pointer-events', 'none')
                .attr('cx', d => {
                    const centroid = path.centroid(d);
                    return centroid[0];
                })
                .attr('cy', d => path.centroid(d)[1])
                .attr('fill', overlayColor)
                .attr('fill-opacity', 0.20)
                .attr('stroke', overlayColor)
                .attr('stroke-width', 1)
                .lower();

            // Animate radius on selectedYear change
            circles.transition()
                .duration(750)
                .attrTween('r', function (d) {
                    const m = metricsMap.get(d.properties.name);
                    const currentR = +d3.select(this).attr('r') || 0;
                    const targetVal = m ? +m[overlayKey] : NaN;
                    const targetR = (m && Number.isFinite(targetVal)) ? overlayScales[overlayKey](targetVal) : 0;
                    const interpolator = d3.interpolateNumber(currentR, targetR);
                    return t => interpolator(t);
                });
        });

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                mapGroup.attr('transform', event.transform);
                setZoomTransform(event.transform.toString());
            });
        svg.call(zoom);
        // Double click resets zoom
        svg.on('dblclick', () => {
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
            setZoomTransform(null);
        });

    }, [worldData, climateData, dims, projectionCenter, activeOverlays, hoveredCountry, selectedCountries, theme, zoomTransform, isDark, selectedYear]);

    // Overlay toggle logic
    function toggleOverlay(key) {
        setActiveOverlays(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }

    // Zoom-to-country logic
    function handleZoomTo(label) {
        const center = getProjectionCenterByKey(label);
        if (center) setProjectionCenter(center);
    }

    // Detail cards for selected countries (persisted across year changes)
    function renderDetailCards() {
        if (!selectedCountries.length || !climateData || selectedYear === null) return null;
        return selectedCountries.map(country => {
            const m = getCountryMetrics(climateData, country, selectedYear);
            if (!m) return null;
            return (
                <Box key={country} mt={2} sx={{
                    p: 2,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 1,
                    boxShadow: 1,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    maxWidth: 400
                }}>
                    <Typography variant="h6" fontWeight={700}>{country}</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <b>Risk Index:</b> {m[BASE_METRIC]}
                    </Typography>
                    {OVERLAY_LAYERS.map(({ key, label }) => (
                        <Typography key={key} variant="body1" sx={{ color: getOverlayColor(key), mb: 0.5 }}>
                            <b>{label}:</b> {m[key]}
                        </Typography>
                    ))}
                </Box>
            );
        });
    }

    return (
        <Box ref={containerRef} mt={6} mb={2} sx={{ width: '100%' }}>
            {/* Menu bar at top */}
            <MapMenuBar
                overlays={OVERLAY_LAYERS}
                activeOverlays={activeOverlays}
                onOverlayToggle={toggleOverlay}
                zoomOptions={["Default", "Bangladesh", "Maldives", "Philippines"]}
                onZoomTo={handleZoomTo}
                autoplay={autoplay}
                setAutoplay={setAutoplay}
                availableYears={availableYears}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                theme={theme}
            />

            {/* Map */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
                <svg ref={svgRef} style={{ width: '100%', height: 'auto', minHeight: 400, maxWidth: '100%' }} />
            </Box>

            {/* Timeline slider below map */}
            {availableYears.length > 0 && selectedYear !== null && (
                <Box sx={{ px: 2, mt: 3, mb: 3, maxWidth: 800, mx: 'auto' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        Year: {selectedYear}
                    </Typography>
                    <Slider
                        value={selectedYear}
                        min={availableYears[0]}
                        max={availableYears[availableYears.length - 1]}
                        step={1}
                        marks={availableYears.length <= 10 ? availableYears.map(y => ({ value: y, label: y.toString() })) : false}
                        onChange={(e, val) => setSelectedYear(val)}
                        valueLabelDisplay="auto"
                        sx={{
                            color: theme.palette.primary.main,
                            '& .MuiSlider-thumb': {
                                '&:hover, &.Mui-focusVisible, &.Mui-active': {
                                    boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)',
                                },
                            },
                        }}
                    />
                </Box>
            )}

            {/* Legend */}
            <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Risk Index Color Scale:</Typography>
                <svg width={210} height={28} style={{ display: 'block' }}>
                    <defs>
                        <linearGradient id="risk-gradient" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor={d3.interpolateYlOrRd(0)} />
                            <stop offset="100%" stopColor={d3.interpolateYlOrRd(1)} />
                        </linearGradient>
                    </defs>
                    <rect x={10} y={6} width={180} height={12} fill="url(#risk-gradient)" />
                    <text x={10} y={25} fontSize={12} fill={theme.palette.text.primary}>{'Low'}</text>
                    <text x={180} y={25} fontSize={12} fill={theme.palette.text.primary} textAnchor="end">{'High'}</text>
                </svg>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    {OVERLAY_LAYERS.map(({ key, label }) => {
                        const color = getOverlayColor(key);
                        return (
                            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <svg width={18} height={18}><circle cx={9} cy={9} r={8} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} /></svg>
                                <span style={{ fontSize: '0.95rem', color }}>{label}</span>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Detail cards for selected countries */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {renderDetailCards()}
            </Box>

            {/* Clear filters button if any country is selected */}
            {selectedCountries.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <button
                        onClick={() => setSelectedCountries([])}
                        style={{
                            border: '1px solid #003049',
                            backgroundColor: '#fff0f0',
                            color: '#003049',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Clear Selected
                    </button>
                </Box>
            )}
        </Box>
    );
};

export default RegionMap;
