/**
 * Find the index of the previous waypoint to a coordinate along a route
 *
 * @param waypoints the waypoints of the route
 * @param coordinates the coordinates of the route path
 * @param latLng a point near or on the route
 * @returns the index of the waypoint before the point
 */
export function findNearestWpBefore(
  waypoints: L.LatLng[],
  coordinates: L.LatLng[],
  latLng: L.LatLng
): number {
  return _findNearestWpBefore(
    waypoints,
    coordinates,
    findClosestRoutePoint(coordinates, latLng)
  );
}

// Adopted from Leaflet Routing Machine
// https://github.com/perliedman/leaflet-routing-machine/blob/db6fd98d8daa7aef42e7ba3e4a6ad24b7b2795e4/src/line.js#L104
function _findNearestWpBefore(
  waypoints: L.LatLng[],
  coordinates: L.LatLng[],
  i: number
): number {
  const wpIndices = findWaypointIndices(waypoints, coordinates);
  let j = wpIndices.length - 1;
  while (j >= 0 && wpIndices[j] > i) {
    j--;
  }

  return j;
}

function findWaypointIndices(
  waypoints: L.LatLng[],
  coordinates: L.LatLng[]
): number[] {
  const indices = [];
  let i;
  for (i = 0; i < waypoints.length; i++) {
    indices.push(findClosestRoutePoint(coordinates, waypoints[i]));
  }

  return indices;
}

function findClosestRoutePoint(
  coordinates: L.LatLng[],
  latLng: L.LatLng
): number {
  let minDist = Number.MAX_VALUE,
    minIndex,
    i,
    d;

  for (i = coordinates.length - 1; i >= 0; i--) {
    d = latLng.distanceTo(coordinates[i]);
    if (d < minDist) {
      minIndex = i;
      minDist = d;
    }
  }

  return minIndex;
}
