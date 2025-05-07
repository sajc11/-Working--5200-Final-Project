import pandas as pd
import json

# Load raw files
climate_df = pd.read_json("./src/data/climate_socioecon_indicators.json")
flood_df = pd.read_json("./src/data/processed_flood_days.json")
sea_df = pd.read_json("./src/data/processed_sealevel.json")
risk_df = pd.read_json("./src/data/processed_risk_index.json")

# Pivot flood data: one row per (Country, Year), one column per severity
flood_pivot = flood_df.pivot_table(index=["Country", "Year"],
                                   columns="Severity",
                                   values="Flood Days").reset_index()

# Rename sea level column for clarity
sea_df = sea_df.rename(columns={"Sea Level (mm)": "Sea Level (mm)", "Metric": "Sea Level Metric"})

# Normalize column names from risk file
risk_df = risk_df.rename(columns={
    "Composite Risk Index": "Risk Index",
    "Sea Level": "Sea Level Risk",
    "Population Exposure": "Population Exposure Risk",
    "GDP Exposure": "GDP Exposure Risk"
})

# Merge step by step
merged = climate_df.merge(flood_pivot, on=["Country", "Year"], how="left")
merged = merged.merge(sea_df.drop(columns="Sea Level Metric"), on=["Country", "Year"], how="left")
merged = merged.merge(risk_df, on="Country", how="left")

# Fill NaNs where needed
merged.fillna({
    "Minor": 0,
    "Moderate": 0,
    "Major": 0,
}, inplace=True)

# Create nested output: country → year → metrics
nested = {}
for _, row in merged.iterrows():
    country = row["Country"]
    year = int(row["Year"])
    row_data = row.drop(["Country", "Year"]).to_dict()
    row_data = {k: (v if pd.notna(v) else None) for k, v in row_data.items()}
    nested.setdefault(country, {})[year] = row_data

# Save to file
with open("merged_climate_metrics.json", "w") as f:
    json.dump(nested, f, indent=2)