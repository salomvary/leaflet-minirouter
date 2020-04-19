import L from "leaflet";
import Layer, { LayerOptions } from "./layer";
import {
  Mapbox,
  MapboxOptions,
  OSRMV1,
  OSRMV1Options,
  GraphHopper,
  GraphHopperOptions,
} from "./router";

export { default as Layer } from "./layer";
export * from "./layer";
export * from "./router";

(<any>L).miniRouter = {
  layer(options?: LayerOptions) {
    return new Layer(options);
  },
  osrmv1(options: OSRMV1Options) {
    return new OSRMV1(options);
  },
  mapbox(accessToken: string, options: MapboxOptions) {
    return new Mapbox(accessToken, options);
  },
  graphHopper(apiKey: string, options: GraphHopperOptions) {
    return new GraphHopper(apiKey, options);
  },
};

(<any>L).MiniRouter = {
  Layer: Layer,
  Mapbox: Mapbox,
  OSRMV1: OSRMV1,
};
