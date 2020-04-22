import * as L from "leaflet";
import { Router, Route, Mapbox, OSRMV1 } from "./router";
import { findNearestWpBefore } from "./util";

export interface LayerOptions extends L.LayerOptions {
  waypoints?: L.LatLngExpression[];
  router?: Router;
  /** Factory function to create custom markers */
  createMarker?: (
    latlng: L.LatLngExpression,
    options: L.MarkerOptions,
    index: number
  ) => L.Marker;
}

export interface RouteSelectedEvent extends L.LayerEvent {
  route: Route;
}

export default class Layer extends L.Layer {
  options: LayerOptions = {
    createMarker: L.marker,
  };

  private waypoints?: L.LatLng[];
  private map?: L.Map;
  private markers: L.Marker[];
  private _route?: Route;
  private line: L.Polyline;

  router: Router;

  constructor(options: LayerOptions = {}) {
    super(options);
    L.Util.setOptions(this, options);

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
      [this._route] =
        this.waypoints.length > 1
          ? await this.router.route(this.waypoints)
          : [];
      if (this._route) {
        if (!this.line) {
          this.line = L.polyline(this._route.coordinates, {
            bubblingMouseEvents: false,
          });
          this.line.addTo(this.map);
          this.line.on("click", this.handlePathClick, this);
        } else {
          this.line.setLatLngs(this._route.coordinates);
        }
        this.fire("routeselected", { route: this._route });
      } else {
        if (this.line) {
          this.map.removeLayer(this.line);
          this.line.off("click", this.handlePathClick, this);
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

  setWaypoints(waypoints: L.LatLngExpression[]): void {
    this.waypoints = waypoints.map(L.latLng);
    this.fire("waypointschanged", { waypoints: this.waypoints });
    this.updateMarkers();
    this.route();
  }

  getCoordinates(): L.LatLng[] {
    return this._route.coordinates || [];
  }

  private onMapClick(e: L.LocationEvent) {
    this.waypoints.push(e.latlng);
    this.fire("waypointschanged", this.waypoints);
    this.updateMarkers();
    this.route();
  }

  private onMarkerDrag(i: number, e: L.LeafletMouseEvent) {
    this.waypoints[i] = e.latlng;
    this.fire("waypointschanged", { waypoints: this.waypoints });
  }

  private async onMarkerDragEnd() {
    this.route();
  }

  private handlePathClick(e: L.LeafletMouseEvent) {
    // Prevent adding a new *destination* waypoint
    const afterIndex = findNearestWpBefore(
      this.waypoints,
      this._route.coordinates,
      e.latlng
    );
    this.waypoints.splice(afterIndex + 1, 0, e.latlng);
    this.fire("waypointschanged", { waypoints: this.waypoints });
    this.updateMarkers();
    this.route();
  }

  private createMarker(
    i: number,
    latLng: L.LatLngExpression,
    alt: string
  ): L.Marker {
    return this.options
      .createMarker(
        latLng,
        {
          draggable: true,
          alt,
        },
        i
      )
      .on("drag", (e: L.LeafletMouseEvent) => this.onMarkerDrag(i, e), this)
      .on("dragend", () => this.onMarkerDragEnd(), this)
      .on("click", function (e: L.LeafletMouseEvent) {
        // Prevent adding a route point when a marker is clicked
        // (Should not be necessary, but it is: https://leafletjs.com/reference-1.6.0.html#marker-bubblingmouseevents)
        e.originalEvent.stopPropagation();
      });
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
    this.markers.forEach((marker) => this.map.removeLayer(marker));
  }
}

function getMarkerAlt(i: number, length: number) {
  return i == 0
    ? "Route start"
    : i == length - 1
    ? "Route end"
    : "Route waypoint";
}
