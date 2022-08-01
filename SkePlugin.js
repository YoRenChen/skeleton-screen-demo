const { resolve } = require('path')
const express = require('express')
const T = require('./skeletonjs/index.memory')
const tempHtml = resolve(__dirname, './dist/shell')
const p = resolve(__dirname, './index.html')

class Observe {
  constructor() {
    this.p = []
  }
  add(e) {
    this.p.push(e)
  }
  notify() {
    for (const iterator of this.p) {
      console.log(iterator)
      iterator()
    }
  }
}

class SkePlugin {
  constructor(options) {
    this.observe = new Observe()
    this.options = options
  }
  apply(compiler) {
    const app = this.createServer()
    compiler.hooks.done.tapAsync('Z', (compilation, cb) => {
      app.listen(8000, e => {
        new T(
          Object.assign(this.options, {
            pathname: tempHtml,
            fulfillFn: this.skeFulfill()
          })
        ).init()
      })
      this.observe.add(cb)
    })
  }
  createServer() {
    const app = express()
    app.use(express.static('dist'))
    app.get('*', (req, res) => {
      res.setHeader('Content-Type', 'text/html')
      res.setHeader('Cache-Control', 'no-store')
      res.status(200)
      res.send(p)
    })
    return app
  }
  skeFulfill() {
    return status => {
      status && this.observe.notify()
    }
  }
}

module.exports = SkePlugin
