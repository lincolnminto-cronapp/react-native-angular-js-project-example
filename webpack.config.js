const webpack = require('webpack');
const autoprefixer = require('autoprefixer');

module.exports = {
  entry: ['./polyfills', 'react-hot-loader/patch', './index.web.js'],
  devServer: {
    hot: true,
    watchContentBase: true,
  },
  devtool: 'eval-source-map',
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          configFile: false,
          babelrc: false,
          presets: [
            '@babel/preset-env',
            'react',
            'module:metro-react-native-babel-preset',
          ],
          plugins: ['react-hot-loader/babel'],
        },
      },
      {
        test: /\.(jpe?g|gif|png|svg|eot|ttf|woff|html)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: '@teamthread/strict-css-modules-loader',
          },
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[local]',
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: '@teamthread/strict-css-modules-loader',
          },
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[local]',
            },
          },
          {
            loader: 'postcss-loader',
            options: {plugins: [autoprefixer()]},
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.web.js', '.js', '.web.jsx', '.jsx', 'json', 'html'],
    mainFields: ['browser', 'main'],
  },
};
