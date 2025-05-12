// src/hooks/useOverlayData.js
import { useState, useEffect } from "react";
import * as d3 from "d3";


export default function useOverlayData() {
  const [offensives, setOffensives] = useState([]);
  const [settlements, setSettlements] = useState([]);

  useEffect(() => {
    Promise.all([
      d3.json("data/military_offensives.json"),
      d3.json("data/civilian_settlements.json"),   // now real data!
    ]).then(([offensiveData, settlementData]) => {
      setOffensives(offensiveData || []);
      setSettlements(settlementData || []);
    }).catch(err => {
      console.error("Error loading overlay data:", err);
    });
  }, []);

  return { offensives, settlements };
}
