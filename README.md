# Leaflet MiniRouter

Minimalistic route editor for [Leaflet](https://leafletjs.com/). Heavily inspired by [Leaflet Routing Machine](https://github.com/perliedman/leaflet-routing-machine), this library only provides
visual route editor layer over the map. No itinerary, no geocoding.

If you need a full-fledged route planner user interface use Leaflet Routing Machine. This one is for minimalists.

## Usage

See [examples/index.js](examples/index.js).

## Contributing

Requirements: recent Node.js.

Set up th first time:

    npm install
    cp examples/config.example.js examples/config.js

Edit `examples/config.js` and add yor for API keys (you will need to sign up at the respective services and create them).

Run tests:

    npm test

Try out locally:

    npm run build

Open `examples/index.html` in a web browser.
