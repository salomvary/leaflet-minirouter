const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    libraryTarget: "umd",
    filename: "leaflet-minirouter.js",
    path: path.resolve(__dirname, "dist"),
  },
  externals: {
    leaflet: "L",
    "@mapbox/polyline": "polyline",
  },
};
