// rollup.config.js
// export default {
//   input: 'skeletonjs/script/main.js',
//   output: {
//     file: 'skeletonjs/script/index.js',
//     format: 'iife',
//     name: 'Skeleton'
//   }
// }
const path = require('path')
function resolve(dir) {
  console.log(path.join(__dirname, '..', dir))

  return path.join(__dirname, '..', dir)
}

module.exports = {
  inputConfig: {
    input: resolve('/main.js')
  },
  outputConfig: {
    output: {
      file: resolve('/index.js'),
      format: 'iife',
      name: 'Skeleton'
    }
  }
}
