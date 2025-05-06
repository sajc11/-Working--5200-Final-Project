import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useInView } from "react-intersection-observer";
import { useTheme } from "@mui/material/styles";
import { seaLevelChartColors } from "../../theme/themeUtils";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import "./ChartStyles.css";

const SeaLevelChart = () => {
    const svgRef = useRef();
    const wrapperRef = useRef();
    const { width = 600 } = useResizeObserver(wrapperRef);
    const [data, setData] = useState([]);
    const [country, setCountry] = useState("Bangladesh");
    const [metric, setMetric] = useState("Reconstruction Obs");
    const { ref: inViewRef, inView } = useInView({ triggerOnce: true });
    const [clickedPoints, setClickedPoints] = useState([]);
    const theme = useTheme();
    const colors = seaLevelChartColors(theme);

    const setRefs = (node) => {
        wrapperRef.current = node;
        inViewRef(node);
    };

    useEffect(() => {
        d3.json("/data/processed_sealevel.json").then((fullData) => {
            const filtered = fullData
                .filter((d) => d.Country === country && d.Metric === metric)
                .map((d) => ({
                    year: +d.Year,
                    value: +d["Sea Level (mm)"],
                }));
            setData(filtered);
            setClickedPoints([]);
        });
    }, [country, metric]);

    useEffect(() => {
        if (!inView || !data || data.length < 2) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const height = 400;
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };

        svg.attr("viewBox", [0, 0, width, height]);

        const x = d3
            .scaleLinear()
            .domain(d3.extent(data, (d) => d.year))
            .range([margin.left, width - margin.right]);

        const y = d3
            .scaleLinear()
            .domain(d3.extent(data, (d) => d.value))
            .nice()
            .range([height - margin.bottom, margin.top]);

        const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(y).ticks(5);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(xAxis)
            .selectAll("text")
            .style("fill", colors.axisText)
            .style("font-weight", "600");

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis)
            .selectAll("text")
            .style("fill", colors.axisText)
            .style("font-weight", "600");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height - 5)
            .text("Year")
            .style("fill", colors.axisText)
            .style("font-weight", "700")
            .style("font-size", "1rem");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(15,${height / 2}) rotate(-90)`)
            .text("Sea Level (mm)")
            .style("fill", colors.axisText)
            .style("font-weight", "700")
            .style("font-size", "1rem");

        const line = d3
            .line()
            .x((d) => x(d.year))
            .y((d) => y(d.value))
            .curve(d3.curveMonotoneX);

        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", colors.line)
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

        let tooltip = d3.select(wrapperRef.current).select(".tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select(wrapperRef.current)
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background-color", colors.tooltipBg)
                .style("color", colors.tooltipText)
                .style("padding", "6px 10px")
                .style("border-radius", "4px")
                .style("font-size", "0.85rem")
                .style("transition", "opacity 0.3s ease");
        }

        svg.selectAll("circle")
            .data(data)
            .join(
                enter => enter.append("circle")
                    .attr("cx", (d) => x(d.year))
                    .attr("cy", (d) => y(d.value))
                    .attr("r", 4)
                    .attr("fill", colors.point)
                    .style("transition", "r 0.2s ease")
                    .on("mouseover", function(event, d) {
                        d3.select(this).transition().duration(200).attr("r", 8);
                        tooltip.transition().duration(200).style("opacity", 1);
                        const rect = wrapperRef.current.getBoundingClientRect();
                        tooltip
                            .html(`<strong>${country}</strong><br/>Year: ${d.year}<br/>Sea Level: ${d.value.toFixed(1)} mm`)
                            .style("left", `${event.clientX - rect.left + 10}px`)
                            .style("top", `${event.clientY - rect.top - 40}px`);
                    })
                    .on("mousemove", function(event) {
                        const rect = wrapperRef.current.getBoundingClientRect();
                        tooltip
                            .style("left", `${event.clientX - rect.left + 10}px`)
                            .style("top", `${event.clientY - rect.top - 40}px`);
                    })
                    .on("mouseout", function() {
                        d3.select(this).transition().duration(200).attr("r", 4);
                        tooltip.transition().duration(300).style("opacity", 0);
                    })
                    .on("click", (event, d) => {
                        setClickedPoints(prev => {
                            const exists = prev.some(p => p.year === d.year && p.value === d.value);
                            return exists
                                ? prev.filter(p => !(p.year === d.year && p.value === d.value))
                                : [...prev, d];
                        });
                    }),
                update => update.transition().duration(800)
                    .attr("cx", (d) => x(d.year))
                    .attr("cy", (d) => y(d.value)),
                exit => exit.remove()
            );
    }, [data, inView, metric, country, width, colors]);

    return (
        <div className="chart-container chart-card" ref={setRefs} style={{ position: "relative" }}>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "1rem"
            }}>
              <h3 style={{ fontFamily: "var(--font-header)", margin: 0 }}>
                Sea Level Rise Over Time
              </h3>
              <div className="controls" style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      Country:
                      <select value={country} onChange={(e) => setCountry(e.target.value)}>
                          <option>Bangladesh</option>
                          <option>Maldives</option>
                          <option>Philippines</option>
                      </select>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      Metric:
                      <select value={metric} onChange={(e) => setMetric(e.target.value)}>
                          <option>Reconstruction Obs</option>
                          <option>Satellite Altimetry</option>
                      </select>
                  </label>
              </div>
            </div>
            <svg ref={svgRef} style={{ width: "100%", height: "400px" }} />
            {/* Clicked points display remains unchanged */}
        </div>
    );
};

export default SeaLevelChart;