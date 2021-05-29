'use strict'

const { promisify } = require('util')
const os = require('os')
const path = require('path')
const fse = require('fs-extra')
const { minify } = require('html-minifier')
const { html2json, json2html } = require('html2json')
const htmlBeautify = require('js-beautify').html_beautify
const { htmlBeautifyConfig } = require('../config/config')
const weblog = require('webpack-log')
const rollup = require('../script/rollup/index')

function createLog(options) {
  let logLevel = options.logLevel || 'info'
  if (options.quiet === true) {
    logLevel = 'silent'
  }
  if (options.noInfo === true) {
    logLevel = 'warn'
  }

  return weblog({
    level: logLevel,
    name: 'pswp',
    timestamp: options.logTime
  })
}

const getCleanedShellHtml = (html) => {
  const STYLE_REG = /<style>[\s\S]+?<\/style>/
  const BODY_REG = /<body>([\s\S]+?)<\/body>/
  const css = STYLE_REG.exec(html)[0]
  const cleanHtml = BODY_REG.exec(html)[1]
  return `${css}\n${cleanHtml}`
}

function htmlMinify(html, options) {
  return options === false ? htmlBeautify(html, htmlBeautifyConfig) : minify(html, options)
}

async function writeShell(routesData, options, log) {
  const { pathname, minify: minOptions } = options
  return Promise.all(Object.keys(routesData).map(async (route) => {
    const html = routesData[route].html
    const minifiedHtml = htmlMinify(getCleanedShellHtml(html), minOptions)
    const trimedRoute = route.replace(/\//g, '')
    const filePath = path.join(pathname, trimedRoute ? `${trimedRoute}.html` : 'index.html')
    await fse.ensureDir(pathname)
    await promisify(fse.writeFile)(filePath, minifiedHtml, 'utf-8')
    return Promise.resolve()
  }))
}

function sleep(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

async function genScriptContent() {
  await rollup()
  const sourcePath = path.resolve(__dirname, '../script/index.js')
  const result = await promisify(fse.readFile)(sourcePath, 'utf-8')
  return result
}
// add script tag into html string, just as document.body.appendChild(script)
function addScriptTag(source, src, port) {
  const token = source.split('</body>')
  if (token.length < 2) return source
  const scriptTag = `
    <script>
      window._pageSkeletonSocketPort = ${port}
    </script>
    <script type="text/javascript" src="${src}" defer></script>
    `
  return `${token[0]}${scriptTag}</body>${token[1]}`
}

/**
 * original author: pepterbe(https://github.com/peterbe/minimalcss)
 * Take call "important comments" and extract them all to the
 * beginning of the CSS string.
 * This makes it possible to merge when minifying across blocks of CSS.
 * For example, if you have (ignore the escaping for the sake of demonstration):
 *
 *   /*! important 1 *\/
 *   p { color: red; }
 *   /*! important 2 *\/
 *   p { background-color: red; }
 *
 * You can then instead get:
 *
 *   /*! important 1 *\/
 *   /*! important 2 *\/
 *   p { color: red; background-color: red; }
 *
 * @param {string} css
 * @return {string}
 */
const collectImportantComments = (css) => {
  const once = new Set()
  const cleaned = css.replace(/(\/\*![\s\S]*?\*\/)\n*/gm, (match, p1) => {
    once.add(p1)
    return ''
  })
  const combined = Array.from(once)
  combined.push(cleaned)
  return combined.join('\n')
}

const outputSkeletonScreen = async (originHtml, options, log) => {
  const { pathname, staticDir, routes } = options
  return Promise.all(routes.map(async (route) => {
    const trimedRoute = route.replace(/\//g, '')
    const filePath = path.join(pathname, trimedRoute ? `${trimedRoute}.html` : 'index.html')
    if (await promisify(fse.accessSync)(filePath)) { }
    const html = await promisify(fse.readFile)(filePath, 'utf-8')
    const finalHtml = originHtml.replace('<!-- shell -->', html)
    const outputDir = path.join(staticDir, route)
    const outputFile = path.join(outputDir, 'index.html')
    await fse.ensureDir(outputDir)
    await promisify(fse.writeFile)(outputFile, finalHtml, 'utf-8')
    return Promise.resolve()
  }))
}

const addDprAndFontSize = (html) => {
  const json = html2json(html)
  const rootElement = json.child.filter(c => c.tag === 'html')[0]
  const oriAttr = rootElement.attr
  const style = oriAttr.style || []
  const index = style.indexOf('font-size:')
  if (index > -1) {
    style[index + 1] = '124.2px;'
  } else {
    style.push('font-size:')
    style.push('124.2px;')
  }
  const rootAttr = Object.assign(oriAttr, {
    'data-dpr': '3',
    style
  })
  rootElement.attr = rootAttr
  return json2html(json)
}

const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces()
  for (const devName in interfaces) { // eslint-disable-line guard-for-in
    const iface = interfaces[devName]
    for (const alias of iface) {
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address
      }
    }
  }
}

const snakeToCamel = name => name.replace(/-([a-z])/g, (_, p1) => p1.toUpperCase())

module.exports = {
  createLog,
  sleep,
  snakeToCamel,
  addScriptTag,
  writeShell,
  htmlMinify,
  outputSkeletonScreen,
  genScriptContent,
  addDprAndFontSize,
  getLocalIpAddress,
  collectImportantComments
}
