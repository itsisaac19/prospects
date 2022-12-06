const path = require('path');

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
  watch: true
};