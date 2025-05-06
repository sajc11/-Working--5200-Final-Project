import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useInView } from "react-intersection-observer";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import "./ChartStyles.css";

const LeadLagCorrelationHeatmap = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const [data, setData] = useState([]);
  const [country, setCountry] = useState("Bangladesh");
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true });

  const { width = 600 } = useResizeObserver(wrapperRef);

  const setRefs = (node) => {
    wrapperRef.current = node;
    inViewRef(node);
  };

  useEffect(() => {
    d3.json("/data/processed_lead_lag_correlations.json").then((json) => {
      setData(json);
    });
  }, []);

  useEffect(() => {
    if (!inView || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const height = 450;
    const margin = { top: 40, right: 30, bottom: 60, left: 180 };

    svg.attr("viewBox", [0, 0, width, height]);

    const filtered = data.filter((d) => d.Country === country);

    const predictors = Array.from(new Set(filtered.map((d) => d.Predictor)));
    const targets = Array.from(new Set(filtered.map((d) => d.Target)));
    const lags = Array.from(new Set(filtered.map((d) => d.Lag))).sort((a, b) => a - b);

    const labels = [];
    predictors.forEach((p) => {
      targets.forEach((t) => labels.push(`${p} → ${t}`));
    });

    const x = d3
      .scaleBand()
      .domain(lags)
      .range([margin.left, width - margin.right])
      .padding(0.05);

    const y = d3
      .scaleBand()
      .domain(labels)
      .range([margin.top, height - margin.bottom])
      .padding(0.05);

    const color = d3
      .scaleDiverging(d3.interpolateRdBu)
      .domain([1, 0, -1]);

    const cells = filtered.map((d) => ({
      x: d.Lag,
      y: `${d.Predictor} → ${d.Target}`,
      val: d.Correlation
    }));

    // Tooltip
    let tooltip = d3.select(wrapperRef.current).select(".tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select(wrapperRef.current)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background-color", "rgba(0,0,0,0.7)")
        .style("color", "#fff")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("transition", "opacity 0.3s ease");
    }

    const rects = svg
      .selectAll("rect")
      .data(cells)
      .join("rect")
      .attr("x", (d) => x(d.x))
      .attr("y", (d) => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", (d) => color(d.val))
      .style("opacity", 0)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("stroke", "#333")
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer");

        tooltip
          .transition()
          .duration(200)
          .style("opacity", 1);
        tooltip
          .html(
            `<strong>${country}</strong><br/>
             Lag: ${d.x}<br/>
             ${d.y}<br/>
             Correlation: ${d.val.toFixed(2)}`
          )
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 36}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 36}px`);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("stroke", "none")
          .style("cursor", "default");

        tooltip
          .transition()
          .duration(300)
          .style("opacity", 0);
      });

    // Fade-in animation for rects
    rects
      .transition()
      .delay((d, i) => i * 10)
      .duration(500)
      .style("opacity", 1);

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat((d) => `Lag ${d}`))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#444");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#444");
  }, [data, country, inView, width]);

  return (
    <div className="chart-container chart-card" ref={setRefs}>
      <div className="controls">
        <label>
          Country:
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option>Bangladesh</option>
            <option>Maldives</option>
            <option>Philippines</option>
          </select>
        </label>
      </div>
      <h3>Lead-Lag Correlation Heatmap</h3>
      <svg ref={svgRef} style={{ width: "100%", height: "450px" }} />
    </div>
  );
};

export default LeadLagCorrelationHeatmap;
