import rasterio

# Open GeoTIFF
with rasterio.open("anom.2025.295.tif") as src:
    # Get dimensions
    width = src.width
    height = src.height
    
    # Get transform
    transform = src.transform
    
    # Calculate bounds
    west = transform[2]  # top-left X
    north = transform[5]  # top-left Y
    east = west + (width * transform[0])  # add width * pixel_width
    south = north + (height * transform[4])  # add height * pixel_height
    
    print(f"Image dimensions: {width} x {height} pixels")
    print(f"Bounds [west, south, east, north]: [{west}, {south}, {east}, {north}]")
    print(f"Center: longitude={(west+east)/2:.2f}, latitude={(south+north)/2:.2f}")
    
    # Calculate zoom
    lat_range = abs(north - south)
    lon_range = abs(east - west)
    max_range = max(lat_range, lon_range)
    
    if max_range > 100:
        zoom = 2.5
    elif max_range > 60:
        zoom = 3
    elif max_range > 40:
        zoom = 3.5
    elif max_range > 20:
        zoom = 4.5
    else:
        zoom = 5.5
    
    print(f"Suggested zoom: {zoom}")