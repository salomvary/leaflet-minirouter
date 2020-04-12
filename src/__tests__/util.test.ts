import * as L from "leaflet";
import { findNearestWpBefore } from "../util";

describe.only("findNearestWpBefore", () => {
  const waypoints = (<[number, number][]>[
    [100, 200],
    [110, 210],
    [120, 220],
  ]).map(L.latLng);

  const coordinates = (<[number, number][]>[
    [101, 201],
    [102, 202],
    [111, 211],
    [112, 212],
    [118, 218],
    [119, 219],
  ]).map(L.latLng);

  test("before first", () => {
    expect(
      findNearestWpBefore(waypoints, coordinates, L.latLng(99, 199))
    ).toEqual(0);
  });

  test("first", () => {
    expect(
      findNearestWpBefore(waypoints, coordinates, L.latLng(103, 203))
    ).toEqual(0);
  });

  test("between", () => {
    expect(
      findNearestWpBefore(waypoints, coordinates, L.latLng(113, 213))
    ).toEqual(1);
  });

  test("before last", () => {
    expect(
      findNearestWpBefore(waypoints, coordinates, L.latLng(119, 219))
    ).toEqual(2);
  });

  test("after last", () => {
    expect(
      findNearestWpBefore(waypoints, coordinates, L.latLng(121, 222))
    ).toEqual(2);
  });
});
