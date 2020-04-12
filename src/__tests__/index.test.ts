import { fireEvent, getByAltText, waitFor } from "@testing-library/dom";
import * as L from "leaflet";
import Layer, { LayerOptions } from "../layer";
import polyline from "@mapbox/polyline";

let map: L.Map, layer: Layer, container: HTMLElement;

beforeEach(() => {
  // Leaflet calls scrollTo internally, not implemented in jsdom
  window.scrollTo = jest.fn();
  // Mock router API
  window.fetch = jest.fn();
});

afterEach(() => {
  if (layer) {
    layer.remove();
  }
  if (map) {
    map.remove();
  }
  if (container) {
    container.innerHTML = "";
    container.remove();
  }
});

test("show an existing route", async () => {
  (<jest.Mock>window.fetch).mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        routes: [
          {
            geometry: polyline.encode([
              [101, 201],
              [301, 401],
            ]),
          },
        ],
      }),
  });

  // Create container
  const { container, layer } = renderLayer({
    waypoints: [
      [100, 200],
      [300, 400],
    ],
  });

  // Assert markers added
  expect(getByAltText(container, "Route start")).toBeTruthy();
  expect(getByAltText(container, "Route end")).toBeTruthy();

  // Wait until the route path is rendered into an svg layer
  await waitFor(() => {
    expect(container.querySelector("svg")).toBeTruthy();
  });

  // Assert path rendered
  // XXX the <path m> in the snapshot seems wrong, maybe
  // the overall map dimensions are not detected properly
  expect(container.querySelector("svg")).toMatchSnapshot();

  // Verify getters
  expect(layer.getWaypoints()).toEqual([
    { lat: 100, lng: 200 },
    { lat: 300, lng: 400 },
  ]);
  expect(layer.getCoordinates()).toEqual([
    {
      lat: 101,
      lng: 201,
    },
    {
      lat: 301,
      lng: 401,
    },
  ]);
});

test("creating a new route by clicking", async () => {
  (<jest.Mock>window.fetch).mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        routes: [
          {
            geometry: polyline.encode([
              [101, 201],
              [301, 401],
            ]),
          },
        ],
      }),
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
  await waitFor(() => {
    expect(container.querySelector("svg")).toBeTruthy();
  });

  // Assert path rendered
  expect(container.querySelector("svg")).toMatchSnapshot();

  // Verify getters
  expect(layer.getWaypoints()).toEqual([
    { lat: 900, lng: 100 },
    { lat: 800, lng: 200 },
  ]);
  expect(layer.getCoordinates()).toMatchSnapshot();
});

test.skip("change route by dragging waypoints", async () => {
  (<jest.Mock>window.fetch)
    // Initial route
    .mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          routes: [
            {
              geometry: polyline.encode([
                [101, 201],
                [301, 401],
              ]),
            },
          ],
        }),
    })
    // Update route after dragging a waypoint
    .mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          routes: [
            {
              geometry: polyline.encode([
                [101, 201],
                [301, 401],
              ]),
            },
          ],
        }),
    });

  // Create container
  const { container, layer } = renderLayer({
    waypoints: [
      [100, 200],
      [300, 400],
    ],
  });

  // Wait until the route path is rendered into an svg layer
  await waitFor(() => {
    expect(container.querySelector("svg")).toBeTruthy();
  });

  // Move the end waypoint by dragging

  const waypointMarker = getByAltText(container, "Route end");

  // Leaflet uses requestAnimationFrame when dealing with drag&drop,
  // using timeouts and waitFor() for simulating asynchronicity
  setTimeout(() => {
    fireEvent.mouseDown(waypointMarker, {
      target: waypointMarker,
      button: 1,
      // lat
      clientY: 900,
      // lon
      clientX: 400,
    });
  }, 0);
  setTimeout(() => {
    fireEvent.mouseMove(waypointMarker, {
      target: waypointMarker,
      button: 1,
      // lat
      clientY: 800,
      // lon
      clientX: 600,
    });
  }, 100);
  setTimeout(() => {
    fireEvent.mouseUp(waypointMarker, {
      button: 1,
      target: waypointMarker,
      // lat
      clientY: 800,
      // lon
      clientX: 600,
    });
  }, 200);

  await waitFor(() => {
    expect(layer.getWaypoints()).toEqual([
      { lat: 100, lng: 200 },
      // This waypoint was moved 100 N, 200 E
      // from {lat: 300, lon: 400}
      { lat: 400, lng: 600 },
    ]);
  });

  expect(layer.getCoordinates()).toMatchSnapshot();
});

test("add waypoint by clicking on the path", async () => {
  (<jest.Mock>window.fetch)
    // Initial route
    .mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          routes: [
            {
              geometry: polyline.encode([
                [101, 201],
                [201, 301],
                [301, 401],
              ]),
            },
          ],
        }),
    })
    // Update route after adding a waypoint by clicking
    .mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          routes: [
            {
              geometry: polyline.encode([
                [101, 201],
                [201, 301],
                [301, 401],
              ]),
            },
          ],
        }),
    });

  // Create container
  const { container, layer } = renderLayer({
    waypoints: [
      [100, 200],
      [300, 400],
    ],
  });

  await waitFor(() => container.querySelector("svg").nodeName);
  const pathSvg = container.querySelector("svg");
  const lineElement = pathSvg.querySelector("path");

  fireEvent.click(lineElement, {
    button: 1,
    target: lineElement,
    // lat: 200
    clientY: 800,
    // lon: 300
    clientX: 300,
  });

  await waitFor(() => {
    expect(layer.getWaypoints()).toEqual([
      { lat: 100, lng: 200 },
      // This is the newly added waypoint
      { lat: 200, lng: 300 },
      { lat: 300, lng: 400 },
    ]);
  });
});

function renderLayer(options?: LayerOptions) {
  container = document.createElement("div");

  Object.defineProperty(container, "clientWidth", {
    get: function () {
      return 1000;
    },
  });

  Object.defineProperty(container, "clientHeight", {
    get: function () {
      return 1000;
    },
  });

  // Leaflet assumes container to be in the document
  document.body.appendChild(container);

  // Create map with router
  map = L.map(container, {
    crs: L.CRS.Simple,
  }).setView([500, 500], 0);
  layer = new Layer(options);
  layer.addTo(map);

  return { map, container, layer };
}
