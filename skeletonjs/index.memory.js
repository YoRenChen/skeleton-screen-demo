// 执行node环境和内存操作
const hasha = require('hasha')
const { promisify } = require('util')
const path = require('path')
const MemoryFileSystem = require('memory-fs')
const merge = require('lodash/merge')
const EventEmitter = require('events')
const { defaultOptions, staticPath } = require('./config/config')
const Skeleton = require('./skeleton')
const myFs = new MemoryFileSystem()
const { writeShell, getLocalIpAddress, addDprAndFontSize, createLog } = require('./util')

class SkeletonMemoryHandle extends EventEmitter {
  constructor(options = {}) {
    super()
    Object.keys(options).forEach(k => Object.assign(this, { [k]: options[k] }))
    this.options = merge({ staticPath }, defaultOptions, options)
    this.host = getLocalIpAddress()
    this.skeleton = new Skeleton(this.options)
    this.routesData = null
    this.origin = `http://${this.host}:${this.options.port}`
    this.log = createLog(options)
    this.fulfilled = false
    this.fulfillFn = options.fulfillFn
  }

  async init() {
    this.log.info('-----  生成开始  -----')
    await this.getSkeletonScreens(this.origin)
    if (this.routesData) await this.writeShellFile()
    await this.skeleton.destroy()
    this.log.info('-----  生成结束  ------')
    this.fulfillHandle()
  }

  fulfillHandle() {
    this.fulfilled = true
    this.fulfillFn(this.fulfilled)
    // process.exit()
  }

  async getSkeletonScreens(origin) {
    try {
      const skeletonScreens = await this.skeleton.renderRoutes(origin)
      // CACHE html
      this.routesData = {}
      for (const { route, html } of skeletonScreens) {
        const fileName = await this.writeMagicHtml(html)
        const skeletonPageUrl = `http://${this.host}:${this.port}/${fileName}`
        this.routesData[route] = {
          url: origin + route,
          skeletonPageUrl,
          html
        }
      }
    } catch (err) {
      console.log('generate skeleton screen failed.', err)
    }
  }

  /**
   * 将 sleleton 模块生成的 html 写入到内存中。
   */
  async writeMagicHtml(html) {
    const decHtml = addDprAndFontSize(html)
    try {
      const { staticPath } = this.options
      const pathName = path.join(__dirname, staticPath)

      let fileName = await hasha(decHtml, { algorithm: 'md5' })
      fileName += '.html'
      myFs.mkdirpSync(pathName)

      await promisify(myFs.writeFile.bind(myFs))(path.join(pathName, fileName), decHtml, 'utf8')
      return fileName
    } catch (err) {
      console.log('error: writeMagicHtml', err)
    }
  }

  async writeShellFile() {
    const { routesData, options, log } = this
    try {
      await writeShell(routesData, options, log)
    } catch (error) {
      console.log('error: writeShellFile', error)
    }
  }
}

module.exports = SkeletonMemoryHandle
