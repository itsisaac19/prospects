const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = {
  entry: {
    'tasks': './tasks.js',
    'calendar': './calendar.js',
    'master': './master.js',
  },
  output: {
    path: path.resolve(__dirname, 'src'),
    filename: '[name]-built.js'
  },
  mode: 'development',
  watch: true,
  resolve: {
    fallback: {
      fs: false,
    }
  }
};