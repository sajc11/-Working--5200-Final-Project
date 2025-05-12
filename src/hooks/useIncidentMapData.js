import { useEffect, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

export default function useIncidentMapData() {
  const [baseGeo, setBaseGeo] = useState(null);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    // ✅ Load world map from CDN (same as other components)
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world) => {
      const countries = topojson.feature(world, world.objects.countries);
      setBaseGeo(countries);
    });

    // ✅ Load merged dataset
    d3.json("/data/merged_climate_metrics.json").then((data) => {
      const parsed = [];
      Object.entries(data).forEach(([country, years]) => {
        Object.entries(years).forEach(([year, metrics]) => {
          parsed.push({
            Country: country,
            Year: +year,
            Minor: metrics["Minor"] ?? 0,
            Moderate: metrics["Moderate"] ?? 0,
            Major: metrics["Major"] ?? 0,
            "Sea Level (mm)": metrics["Sea Level (mm)_y"] ?? metrics["Sea Level (mm)_x"] ?? null,
            "Extreme Heat Days": metrics["Extreme Heat Days"] ?? null,
            "Net migration": metrics["Net migration"] ?? null,
            Population: metrics["Population, total"] ?? null,
            "Risk Index": metrics["Risk Index"] ?? null,
            "Population Exposure Risk": metrics["Population Exposure Risk"] ?? null,
            "GDP Exposure Risk": metrics["GDP Exposure Risk"] ?? null,
          });
        });
      });
      setIncidents(parsed);
    });
  }, []);

  return { baseGeo, incidents };
}