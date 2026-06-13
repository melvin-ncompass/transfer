import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private dataSource: DataSource) {}

  // Generate vector tiles from PostGIS
  async getTiles(params: { z: number; x: number; y: number }): Promise<Buffer> {
    const { z, x, y } = params;

    const sql = `
      WITH mvtgeom AS (
        SELECT ST_AsMVTGeom(
          ST_Transform(geom, 3857),
          ST_TileEnvelope(${z}, ${x}, ${y}),
          extent => 4096,
          buffer => 64
        ) AS geom
        FROM nyc_subway_stations 
        WHERE ST_Transform(geom, 3857) && ST_TileEnvelope(${z}, ${x}, ${y})
      )
      SELECT ST_AsMVT(mvtgeom.*, 'nyc_layer') AS tile FROM mvtgeom;
    `;

    const result = await this.dataSource.query(sql);
    return result[0]?.tile || Buffer.alloc(0);
  }

  //  Get bounding box of all geometries (to auto-zoom in React)
  async getBounds(): Promise<string | null> {
  const result = await this.dataSource.query(`
    SELECT ST_Extent(ST_Transform(geom, 4326)) AS bbox
    FROM nyc_subway_stations;
  `);
  return result[0]?.bbox || null;
}

}
