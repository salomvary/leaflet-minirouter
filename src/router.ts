import * as L from "leaflet";
import polyline from "@mapbox/polyline";

export interface RouteSummary {
  totalTime?: number;
  totalDistance?: number;
  totalAscend?: number;
  totalDescend?: number;
}

export interface Route {
  summary?: RouteSummary;
  coordinates: L.LatLng[];
}

export interface Router {
  route(waypoints: L.LatLngExpression[]): Promise<Route[]>;
}

export interface OSRMV1Options {
  serviceUrl?: string;
}

interface OSRMV1Response {
  routes: {
    distance?: number;
    duration?: number;
    geometry: string;
    legs: {
      steps: {
        geometry: string;
      }[];
    }[];
  }[];
}

const polylinePrecision = 5;

export class OSRMV1 implements Router {
  private serviceUrl: string;
  private profile: string;
  private urlParameters: { [key: string]: string };

  constructor({
    serviceUrl = "https://router.project-osrm.org/route/v1/",
    profile = "driving",
    urlParameters = {},
  } = {}) {
    this.serviceUrl = serviceUrl;
    this.profile = profile;
    this.urlParameters = urlParameters;
  }

  async route(waypoints: L.LatLng[]): Promise<Route[]> {
    const locations = waypoints
      .map(({ lng, lat }) => lng + "," + lat)
      .join(";");
    const url = new URL(this.profile + "/" + locations, this.serviceUrl);
    url.search = new URLSearchParams(this.urlParameters).toString();

    const response: OSRMV1Response = await fetch(url.toString()).then((_) =>
      _.json()
    );

    return response.routes.map((route) => {
      const coordinates = decodePolyline(route.geometry);
      const summary = {
        totalDistance: route.distance,
        totalTime: route.duration,
      };
      return { coordinates, summary };
    });
  }
}

export interface GraphHopperOptions {
  serviceUrl?: string;
  urlParameters?: { [key: string]: string };
}

interface GraphHopperResponse {
  paths: Array<{
    points: string;
    time?: number;
    distance?: number;
    ascend?: number;
    descend?: number;
  }>;
}

/**
 * Router using GraphHopper API:
 * https://docs.graphhopper.com/#operation/getRoute
 */
export class GraphHopper implements Router {
  private apiKey: string;
  private serviceUrl: string;
  urlParameters: { [key: string]: string };

  constructor(
    apiKey: string,
    {
      serviceUrl = "https://graphhopper.com/api/1/route",
      urlParameters = {},
    }: GraphHopperOptions = {}
  ) {
    this.apiKey = apiKey;
    this.serviceUrl = serviceUrl;
    this.urlParameters = urlParameters;
  }

  async route(waypoints: L.LatLng[]): Promise<Route[]> {
    const params = new URLSearchParams({
      ...this.urlParameters,
      key: this.apiKey,
    });
    waypoints.forEach(({ lng, lat }) =>
      params.append("point", lat + "," + lng)
    );
    const url = new URL(this.serviceUrl);
    url.search = params.toString();

    const response: GraphHopperResponse = await fetch(
      url.toString()
    ).then((_) => _.json());

    return response.paths.map((path) => {
      const coordinates = decodePolyline(path.points);
      const summary = {
        totalDistance: path.distance,
        totalTime: path.time / 1000,
        totalAscend: path.ascend,
        totalDescend: path.descend,
      };
      return { coordinates, summary };
    });
  }
}

export interface MapboxOptions extends OSRMV1Options {
  profile?: string;
}

export class Mapbox extends OSRMV1 {
  constructor(
    accessToken: string,
    {
      serviceUrl = "https://api.mapbox.com/directions/v5/",
      profile = "mapbox/driving",
    }: MapboxOptions = {}
  ) {
    super({
      serviceUrl,
      profile,
      urlParameters: { access_token: accessToken },
    });
  }
}

function decodePolyline(geometry: string): L.LatLng[] {
  return (polyline.decode(geometry, polylinePrecision) as [
    number,
    number
  ][]).map(L.latLng);
}
