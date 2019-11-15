import * as L from "leaflet";
import Layer from "../layer";
import {
  fireEvent,
  getByAltText,
  waitForElement,
  wait
} from "@testing-library/dom";
import * as mapboxResponse from "./mapbox-response.json";

test("creating a new route", async () => {
  // SVGSVGElement.prototype.createSVGRect = () => <DOMRect>null;
  function svgCreate(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }
  var svg = !!(document.createElementNS && svgCreate("svg").createSVGRect);
  // const svgEl = svgCreate("svg");

  const lsvg = L.Browser.svg;
  window.fetch = jest.fn();
  (<jest.Mock>window.fetch).mockResolvedValueOnce({
    json: () => Promise.resolve(mapboxResponse)
  });
  const container = document.createElement("div");
  container.style.width = "1000px";
  container.style.height = "1000px";
  const map = L.map(container).setView([50, 0], 13);
  const layer = new Layer();
  layer.addTo(map);
  fireEvent.click(container, { clientX: 100, clientY: 100 });
  fireEvent.click(container, { clientX: 200, clientY: 200 });

  expect(getByAltText(container, "Route start")).toBeTruthy();
  expect(getByAltText(container, "Route end")).toBeTruthy();

  // Wait until the route path is rendered into an svg layer
  await wait(() => {
    expect(container.querySelector("svg")).toBeTruthy();
  });

  // XXX the <path m> in the snapshot seems wrong, maybe
  // the overall map dimensions are not detected properly
  expect(container.querySelector("svg")).toMatchSnapshot();
});
