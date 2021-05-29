const path = require('path')
const T = require('./skeletonjs/index.memory')

new T({
  pathname: path.resolve(__dirname, './public/shell'),
  routes: ['/', '/about/index']
}).init()
