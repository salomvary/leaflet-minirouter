import L from "leaflet";
import Layer, { LayerOptions } from "./layer";
import {
  Mapbox,
  MapboxOptions,
  OSRMV1,
  OSRMV1Options,
  Route,
  Router,
} from "./router";

declare module "leaflet" {
  namespace miniRouter {
    function layer(options?: LayerOptions): Layer;
    function osrmv1(options: OSRMV1Options): OSRMV1;
    function mapbox(accessToken: string, options: MapboxOptions): Mapbox;
  }

  // TODO: figure out how not to duplicate classes here

  namespace MiniRouter {
    class Layer extends L.Layer {
      constructor(options?: LayerOptions);
      onAdd(map: L.Map): this;
      onRemove(map: L.Map): this;
      route(): Promise<void>;
      getWaypoints(): L.LatLng[];
      getCoordinates(): L.LatLng[];
    }

    class OSRMV1 implements Router {
      constructor({
        serviceUrl,
        profile,
        requestParameters,
      }?: {
        serviceUrl?: string;
        profile?: string;
        requestParameters?: {};
      });
      route(waypoints: L.LatLng[]): Promise<Route[]>;
    }

    class Mapbox extends OSRMV1 {
      constructor(accessToken: string, { serviceUrl, profile }?: MapboxOptions);
    }
  }
}

L.miniRouter = {
  layer(options?: LayerOptions) {
    return new Layer(options);
  },
  osrmv1(options: OSRMV1Options) {
    return new OSRMV1(options);
  },
  mapbox(accessToken: string, options: MapboxOptions) {
    return new Mapbox(accessToken, options);
  },
};

L.MiniRouter = {
  Layer: Layer,
  Mapbox: Mapbox,
  OSRMV1: OSRMV1,
};
