import rasterio

# Open GeoTIFF
with rasterio.open("anom.2025.295.tif") as src:
    # Read data (band 1)
    data = src.read(1)
    
    # GeoTransform info
    transform = src.transform
    crs = src.crs
    print("CRS:", crs)
    print("Transform:", transform)
    
    # Get geographic coordinates for a pixel
    row, col = 100, 200  # example pixel
    x, y = transform * (col, row)  # maps pixel (col,row) to geo coordinates
    value = data[row, col]
    
    print(f"Pixel value: {value} at coordinates: ({x}, {y})")
