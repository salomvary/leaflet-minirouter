import * as L from "leaflet";
import Layer from "../layer";
import { fireEvent, getByAltText, wait } from "@testing-library/dom";
import * as mapboxResponse from "./mapbox-response.json";

test("creating a new route", async () => {
  // Mock router API
  window.fetch = jest.fn();
  (<jest.Mock>window.fetch).mockResolvedValueOnce({
    json: () => Promise.resolve(mapboxResponse)
  });

  // Create container
  const container = document.createElement("div");
  container.style.width = "1000px";
  container.style.height = "1000px";

  // Create map with router
  const map = L.map(container).setView([50, 0], 13);
  const layer = new Layer();
  layer.addTo(map);

  // Add a start and end waypoint
  fireEvent.click(container, { clientX: 100, clientY: 100 });
  fireEvent.click(container, { clientX: 200, clientY: 200 });

  // Assert markers added
  expect(getByAltText(container, "Route start")).toBeTruthy();
  expect(getByAltText(container, "Route end")).toBeTruthy();

  // Wait until the route path is rendered into an svg layer
  await wait(() => {
    expect(container.querySelector("svg")).toBeTruthy();
  });

  // Assert path rendered
  // XXX the <path m> in the snapshot seems wrong, maybe
  // the overall map dimensions are not detected properly
  expect(container.querySelector("svg")).toMatchSnapshot();
});
