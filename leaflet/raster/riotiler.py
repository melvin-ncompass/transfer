from rio_tiler.io import COGReader

# Read and generate a single tile
with COGReader("anom.2025.295.tif") as cog:
    # Get tile at zoom=6, x=32, y=20
    tile = cog.tile(32, 20, 6)
    
    # Save as PNG
    with open("tile_6_32_20.png", "wb") as f:
        f.write(tile.render(img_format="PNG"))