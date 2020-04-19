import * as L from "leaflet";
import { Mapbox, GraphHopper } from "../router";
import mapboxResponse from "./mapbox-response.json";
import graphHopperResponse from "./graphhopper-response.json";

test("Mapbox", async () => {
  window.fetch = jest.fn().mockResolvedValueOnce({
    json: () => Promise.resolve(mapboxResponse),
  });

  const router = new Mapbox("test-token");
  const [route] = await router.route([
    L.latLng(0.1, 0.2),
    L.latLng(-0.3, -0.4),
  ]);

  expect(window.fetch).toHaveBeenCalledWith(
    "https://api.mapbox.com/directions/v5/mapbox/driving/0.2,0.1;-0.4,-0.3?access_token=test-token"
  );
  expect(route.coordinates).toMatchSnapshot();
});

test("GraphHopper", async () => {
  window.fetch = jest.fn().mockResolvedValueOnce({
    json: () => Promise.resolve(graphHopperResponse),
  });

  const router = new GraphHopper("test-token");
  const [route] = await router.route([
    L.latLng(0.1, 0.2),
    L.latLng(-0.3, -0.4),
  ]);

  expect(window.fetch).toHaveBeenCalledWith(
    "https://graphhopper.com/api/1/route?key=test-token&point=0.1%2C0.2&point=-0.3%2C-0.4"
  );
  expect(route.coordinates).toMatchSnapshot();
});
