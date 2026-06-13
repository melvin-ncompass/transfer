import xarray as xr
import pandas as pd
import os

# ====== CONFIG ======
# Path to your .nc file
NC_FILE = r"C:\Users\Melvin M Shajan\Downloads\2022-01\data_0.nc"

# Output CSV location (same folder as .nc)
CSV_FILE = os.path.splitext(NC_FILE)[0] + ".csv"


# ====== CONVERT ======
print(f"Opening NetCDF file: {NC_FILE}")

with xr.open_dataset(NC_FILE) as ds:
    df = ds.to_dataframe().reset_index()

print(f"Saving CSV to: {CSV_FILE}")
df.to_csv(CSV_FILE, index=False)

print("🎉 Done! CSV created successfully.")
