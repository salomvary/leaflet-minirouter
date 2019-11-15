import L from "leaflet";
import Layer, { LayerOptions } from "./layer";
import { OSRMV1, Mapbox, OSRMV1Options, MapboxOptions } from "./router";

(<any>L).miniRouter = {
  layer(options?: LayerOptions) {
    return new Layer(options);
  },
  osrmv1(options: OSRMV1Options) {
    return new OSRMV1(options);
  },
  mapbox(accessToken: string, options: MapboxOptions) {
    return new Mapbox(accessToken, options);
  }
};

(<any>L).MiniRouter = {
  Layer: Layer,
  MapBox: Mapbox,
  OSRMV1: OSRMV1
};
