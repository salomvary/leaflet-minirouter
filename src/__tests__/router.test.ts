import * as L from "leaflet";
import { Mapbox } from "../router";
import mapboxResponse from "./mapbox-response.json";

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
