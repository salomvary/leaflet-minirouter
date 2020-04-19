var map = L.map("map").setView([51.505, -0.09], 13);

L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const routers = {
  mapbox: L.miniRouter.mapbox(miniRouterConfig.mapboxKey),
  graphhopper: L.miniRouter.graphHopper(miniRouterConfig.graphHopperKey)
}

const routerLayer = L.miniRouter
  .layer({ router:  routers.mapbox})
  .on('routeselected', (e) => console.log('routeselected event', e.route))
  .on('waypointschanged', (e) => console.log('waypointschanged event', e.waypoints))
  .addTo(map);


// Simple map control to allow switching routing services
const RouterSwitcher = L.Control.extend({
  onAdd(map) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<div style="background: white">
      <label><input type=radio name=router value=mapbox checked>Mapbox</label>
      <label><input type=radio name=router value=graphhopper>GraphHopper</label>
    </div>`;
    wrapper.onchange = (e) => {
      routerLayer.router = routers[e.target.value];
    };
    wrapper.onclick = (e) => e.stopPropagation();
    return wrapper;
  },
});

new RouterSwitcher().addTo(map);


