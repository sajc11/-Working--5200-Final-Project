const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    clean: true,
    publicPath: '/', // subdomain root
  },
  mode: 'production',
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    port: 8080,
    open: true,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|json|geojson|topojson)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public/data', to: 'data' },
        { from: 'public/world-110m.json', to: 'world-110m.json' },
        { from: 'public/galleryData.json', to: 'galleryData.json' },
        { from: 'public/images/EDA_imgs', to: 'images/EDA_imgs' },
        { from: 'public/images/general', to: 'images/general' },
        { from: 'public/scholarship-eda.html', to: 'scholarship-eda.html' }, // ✅ add this
      ],
    }),
  ],
};