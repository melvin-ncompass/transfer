import type L from 'leaflet';

export function getCentroid(geometry: any): [number, number] | null {
    if (!geometry || !geometry.coordinates) return null;

    const getRingCentroid = (coords: any[]): { area: number; center: [number, number] } => {
        let area = 0;
        let cx = 0;
        let cy = 0;

        for (let i = 0; i < coords.length - 1; i++) {
            const [x1, y1] = coords[i];
            const [x2, y2] = coords[i + 1];
            const f = x1 * y2 - x2 * y1;
            area += f;
            cx += (x1 + x2) * f;
            cy += (y1 + y2) * f;
        }

        area = area / 2;
        if (area === 0 && coords.length > 0) {
            return { area: 0, center: [coords[0][1], coords[0][0]] };
        }

        cx = cx / (6 * area);
        cy = cy / (6 * area);

        return { area: Math.abs(area), center: [cy, cx] };
    };

    let bestCentroid: [number, number] | null = null;
    let maxArea = -1;

    const processPolygon = (rings: any[]) => {
        if (rings.length > 0 && Array.isArray(rings[0])) {
            if (typeof rings[0][0] === 'number') {
                const { area, center } = getRingCentroid(rings);
                if (area > maxArea) {
                    maxArea = area;
                    bestCentroid = center;
                }
            } else {
                const { area, center } = getRingCentroid(rings[0]);
                if (area > maxArea) {
                    maxArea = area;
                    bestCentroid = center;
                }
            }
        }
    };

    if (geometry.type === 'Polygon') {
        processPolygon(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygonRings: any[]) => {
            processPolygon(polygonRings);
        });
    }

    return bestCentroid;
}

export function getBoundingBoxWidth(geometry: any, mapInstance: L.Map): number {
    if (!geometry || !geometry.coordinates) return 0;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    const processCoordinates = (coords: any[]) => {
        if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            coords.forEach((ring: any[]) => {
                if (Array.isArray(ring[0]) && typeof ring[0][0] === 'number') {
                    ring.forEach((point: number[]) => {
                        if (point.length >= 2) {
                            minLng = Math.min(minLng, point[0]);
                            maxLng = Math.max(maxLng, point[0]);
                            minLat = Math.min(minLat, point[1]);
                            maxLat = Math.max(maxLat, point[1]);
                        }
                    });
                } else {
                    processCoordinates(ring);
                }
            });
        } else if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
            coords.forEach((point: number[]) => {
                if (point.length >= 2) {
                    minLng = Math.min(minLng, point[0]);
                    maxLng = Math.max(maxLng, point[0]);
                    minLat = Math.min(minLat, point[1]);
                    maxLat = Math.max(maxLat, point[1]);
                }
            });
        }
    };

    if (geometry.type === 'Polygon') {
        processCoordinates(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygon: any[]) => {
            processCoordinates(polygon);
        });
    }

    if (minLng === Infinity || maxLng === -Infinity) return 0;

    const topLeft = mapInstance.latLngToContainerPoint([maxLat, minLng]);
    const topRight = mapInstance.latLngToContainerPoint([maxLat, maxLng]);
    return Math.abs(topRight.x - topLeft.x);
}

