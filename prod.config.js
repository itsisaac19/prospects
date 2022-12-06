const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;

const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');

const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    'master' : './master.js',
    'tasks' : './tasks.js',
    'calendar' : './master.js',
    'indexCSS' : './src/index.css',
  }, 
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: 'chunk.js',
    publicPath: '/'
  },
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
      terserOptions: {
        compress: {
          drop_console: true,
        }
      }
    })],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new HtmlWebpackPlugin({
      template: './template.html',
      inject: 'body',
      filename: 'index.html',
    }),
    new HTMLInlineCSSWebpackPlugin(),
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/master/, /tasks/, /calendar/, /index/]),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader"
        ]
      }
    ]
  }
};
