import * as L from "leaflet";
import polyline from "@mapbox/polyline";

export interface Route {
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
    distance: any;
    duration: any;
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
  private requestParameters: { [key: string]: string };

  constructor({
    serviceUrl = "https://router.project-osrm.org/route/v1/",
    profile = "driving",
    requestParameters = {},
  } = {}) {
    this.serviceUrl = serviceUrl;
    this.profile = profile;
    this.requestParameters = requestParameters;
  }

  async route(waypoints: L.LatLng[]): Promise<Route[]> {
    const locations = waypoints
      .map(({ lng, lat }) => lng + "," + lat)
      .join(";");
    const url = new URL(this.profile + "/" + locations, this.serviceUrl);
    url.search = new URLSearchParams(this.requestParameters).toString();

    const response: OSRMV1Response = await fetch(url.toString()).then((_) =>
      _.json()
    );

    return response.routes.map((route) => {
      const coordinates = this.decodePolyline(route.geometry);
      return { coordinates };
    });
  }

  private decodePolyline(geometry: string): L.LatLng[] {
    return (polyline.decode(geometry, polylinePrecision) as [
      number,
      number
    ][]).map(L.latLng);
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
      requestParameters: { access_token: accessToken },
    });
  }
}
