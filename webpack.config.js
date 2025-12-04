require("dotenv").config();
const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const isProduction = process.env.NODE_ENV === "production";
const Dotenv = require("dotenv-webpack");

module.exports = {
  entry: "./src/index.ts",
  devServer: {
    host: "localhost", // Explicitly set the host
    port: process.env.NODE_PORT || 5000, // Ensure a default value
    compress: true,
    allowedHosts: "all", // Allow all hosts
    headers: {
      "Access-Control-Allow-Origin": "*", // Enable CORS for local testing
    },
    client: {
      webSocketURL: "ws://localhost:5000/ws", // Ensure correct WebSocket URL
    },
  },
  mode: isProduction ? "production" : "development",
  output: {
    library: "GreeterWidget",
    libraryTarget: "umd",
    libraryExport: "default",
    path: path.resolve(__dirname, "themes/w"),
    filename: `widget${isProduction ? ".min" : ""}.js`,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: "ts-loader" }],
      },
      {
        test: /\.css$/,
        use: ["css-loader", "postcss-loader"],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: "file-loader",
        options: {
          name: "themes/img/[name].[ext]",
        },
      },
    ],
  },
  plugins: [
    new Dotenv(),
    isProduction
      ? null
      : new HTMLWebpackPlugin({
          template: path.resolve(__dirname, "index.html"),
        }),
    isProduction ? null : new webpack.HotModuleReplacementPlugin(),
  ].filter(Boolean),
};
