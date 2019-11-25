import * as L from "leaflet";
import Layer, { LayerOptions } from "../layer";
import { fireEvent, getByAltText, wait } from "@testing-library/dom";
import * as mapboxResponse from "./mapbox-response.json";

beforeEach(() => {
  // Leaflet calls scrollTo internally, not implemented in jsdom
  window.scrollTo = jest.fn();
});

test("show an existing route", async () => {
  // Mock router API
  window.fetch = jest.fn();
  (<jest.Mock>window.fetch).mockResolvedValueOnce({
    json: () => Promise.resolve(mapboxResponse)
  });

  // Create container
  const { container, layer } = renderLayer({
    waypoints: [[50, 0], [50.0001, 0.0001]]
  });

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

  // Verify getters
  expect(layer.getWaypoints()).toEqual([
    { lat: 50, lng: 0 },
    { lat: 50.0001, lng: 0.0001 }
  ]);
  expect(layer.getCoordinates()).toMatchSnapshot();
});

test("creating a new route by clicking", async () => {
  // Mock router API
  window.fetch = jest.fn();
  (<jest.Mock>window.fetch).mockResolvedValueOnce({
    json: () => Promise.resolve(mapboxResponse)
  });

  // Create container
  const { container, layer } = renderLayer();

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

  // Verify getters
  expect(layer.getWaypoints()).toMatchInlineSnapshot(`
    Array [
      Object {
        "lat": 49.98898026790062,
        "lng": 0.017166137695312503,
      },
      Object {
        "lat": 49.97794229198731,
        "lng": 0.03433227539062501,
      },
    ]
  `);
  expect(layer.getCoordinates()).toMatchSnapshot();
});

test("change route by dragging waypoints", async () => {
  // Mock router API
  window.fetch = jest.fn();
  (<jest.Mock>window.fetch)
    .mockResolvedValueOnce({
      json: () => Promise.resolve(mapboxResponse)
    })
    .mockResolvedValueOnce({
      json: () => Promise.resolve(mapboxResponse)
    });

  // Create container
  const { container, layer } = renderLayer({
    waypoints: [[50, 0], [50.0001, 0.0001]]
  });

  // Wait until the route path is rendered into an svg layer
  await wait(() => {
    expect(container.querySelector("svg")).toBeTruthy();
  });

  const waypointMarker = getByAltText(container, "Route end");

  // Leaflet uses requestAnimationFrame when dealing with drag&drop,
  // using timeouts and wait() for simulating asynchronicity
  setTimeout(() => {
    fireEvent.mouseDown(waypointMarker, {
      button: 1,
      clientX: 150,
      clientY: 150,
      target: waypointMarker
    });
  }, 20);
  setTimeout(() => {
    fireEvent.mouseMove(waypointMarker, {
      button: 1,
      clientX: 160,
      clientY: 160,
      target: waypointMarker
    });
  }, 40);
  setTimeout(() => {
    fireEvent.mouseUp(waypointMarker, {
      button: 1,
      clientX: 160,
      clientY: 160,
      target: waypointMarker
    });
  }, 60);

  await wait(() => {
    expect(layer.getWaypoints()).toEqual([
      { lat: 50, lng: 0 },
      { lat: 50.0001260528176, lng: 0.000171661376953125 }
    ]);
  });

  expect(layer.getCoordinates()).toMatchSnapshot();
});

function renderLayer(options?: LayerOptions) {
  const container = document.createElement("div");
  container.style.width = "1000px";
  container.style.height = "1000px";

  // Leaflet assumes container to be in the document
  document.body.appendChild(container);

  // Create map with router
  const map = L.map(container).setView([50, 0], 13);
  const layer = new Layer(options);
  layer.addTo(map);

  return { container, layer };
}
