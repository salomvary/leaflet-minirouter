import * as L from "leaflet";
import { Router, Route, Mapbox, OSRMV1 } from "./router";

export interface LayerOptions extends L.LayerOptions {
  waypoints?: L.LatLngExpression[];
  router?: Router;
}

export default class Layer extends L.Layer {
  private waypoints?: L.LatLng[];
  private map?: L.Map;
  private markers: L.Marker[];
  private router: Router;
  private _route?: Route;
  private line: L.Polyline;

  constructor(options: LayerOptions = {}) {
    super(options);
    this.waypoints = options.waypoints
      ? options.waypoints.slice(0).map(L.latLng)
      : [];
    this.router = options.router || new OSRMV1();
    this.markers = [];
    this.route();
  }

  onAdd(map: L.Map) {
    this.map = map;
    this.map.on("click", this.onMapClick, this);
    this.updateMarkers();
    return this;
  }

  onRemove(map: L.Map) {
    this.removeMarkers();
    this.map.removeLayer(this.line);
    this.map.off("click", this.onMapClick, this);
    this.map = null;
    return this;
  }

  async route() {
    try {
      if (this.waypoints.length > 1) {
        [this._route] = await this.router.route(this.waypoints);
        if (this._route) {
          this.line = L.polyline(this._route.coordinates);
          this.line.addTo(this.map);
        } else {
          this.map.removeLayer(this.line);
          this.line = null;
        }
      }
    } catch (e) {
      console.error("Routing error", e);
    }
  }

  getWaypoints(): L.LatLng[] {
    return this.waypoints;
  }

  getCoordinates(): L.LatLng[] {
    return this._route.coordinates || [];
  }

  private onMapClick(e: L.LocationEvent) {
    this.waypoints.push(e.latlng);
    this.updateMarkers();
    this.route();
  }

  private onMarkerDrag(i: number, e: L.LeafletMouseEvent) {
    this.waypoints[i] = e.latlng;
  }

  private async onMarkerDragEnd() {
    this.route();
  }

  private createMarker(
    i: number,
    latLng: L.LatLngExpression,
    alt: string
  ): L.Marker {
    const marker = L.marker(latLng, { draggable: true, alt });
    marker.on(
      "drag",
      (e: L.LeafletMouseEvent) => this.onMarkerDrag(i, e),
      this
    );
    marker.on("dragend", () => this.onMarkerDragEnd(), this);
    return marker;
  }

  private updateMarkers() {
    if (!this.map) return;
    this.removeMarkers();
    this.markers = this.waypoints.map((waypoint, i) =>
      this.createMarker(
        i,
        waypoint,
        getMarkerAlt(i, this.waypoints.length)
      ).addTo(this.map)
    );
  }

  private removeMarkers() {
    this.markers.forEach(marker => this.map.removeLayer(marker));
  }
}

function getMarkerAlt(i: number, length: number) {
  return i == 0
    ? "Route start"
    : i == length - 1
    ? "Route end"
    : "Route waypoint";
}
