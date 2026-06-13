import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.vectorgrid";

function App() {
  useEffect(() => {
    const map = L.map("map");

    //  Add OpenStreetMap base layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    //  Add MVT tiles from NestJS
    const vectorGrid = L.vectorGrid.protobuf(
      "http://localhost:3000/tiles/{z}/{x}/{y}.mvt",
      {
        vectorTileLayerStyles: {
          default: function(properties, zoom) {
            return {
              radius: 2,
              fillColor: "#dc2626",
              color: "#dc2626",
              weight: 0,
              opacity: 1,
              fillOpacity: 1,
            };
          },
        },
        interactive: true,
        crossOrigin: true,
        maxZoom: 18,
        minZoom: 0,
      }
    ).addTo(map);

    //  Dynamically fetch bounds and fit the map
    fetch("http://localhost:3000/bounds")
      .then((r) => r.json())
      .then((data) => {
        if (data.bbox) {
          const coords = data.bbox.match(
            /BOX\(([-\d.]+) ([-\d.]+),([-\d.]+) ([-\d.]+)\)/
          );
          if (coords) {
            const west = parseFloat(coords[1]);
            const south = parseFloat(coords[2]);
            const east = parseFloat(coords[3]);
            const north = parseFloat(coords[4]);
            const bounds = L.latLngBounds([
              [south, west],
              [north, east],
            ]);
            setTimeout(() => map.fitBounds(bounds), 500);
          } 
        }
      })
      .catch(() => {
        // fallback if API fails
        map.setView([40.7128, -74.006], 12);
      });

    return () => map.remove();
  }, []);

  return <div id="map" style={{ width: "100vw", height: "100vh" }}></div>;
}

export default App;
