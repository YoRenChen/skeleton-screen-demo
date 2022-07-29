'use strict'

const puppeteer = require('puppeteer')
// 通过配置来设置我们想要生成骨架页面的移动端设备，可选的设备可以通过 Puppeteer 项目中DeviceDescriptors，默认的是PC
const devices = puppeteer.devices
const { parse, toPlainObject, fromPlainObject, generate } = require('css-tree')
const { sleep, genScriptContent, htmlMinify, collectImportantComments, createLog } = require('./util')

class Skeleton {
  constructor(options = {}) {
    this.options = options
    this.browser = null
    this.scriptContent = ''
    this.pages = new Set()
    this.initialize()
    this.log = createLog(options)
  }

  // Launch headless Chrome by puppeteer and load script
  // 创建页面
  async initialize() {
    const { headless } = this.options

    try {
      // 加载脚本，把script的Skeleton放入全局变量
      // load script content from `script` folder
      this.scriptContent = await genScriptContent()
      // Launch the browser
      this.browser = await puppeteer.launch({ headless })
    } catch (err) {
      this.log.info(err)
    }
  }

  async newPage() {
    const { device, debug } = this.options
    const page = await this.browser.newPage()
    this.pages.add(page)
    await page.emulate(devices[device])
    if (debug) {
      page.on('console', (...args) => {
        this.log.info(...args)
      })
    }
    return page
  }

  async closePage(page) {
    await page.close()
    return this.pages.delete(page)
  }

  // Generate the skeleton screen for the specific `page`
  // 创建骨架
  async makeSkeleton(page) {
    const { defer } = this.options

    // addScriptTag: 注入指定的script
    try {
      await page.addScriptTag({ content: this.scriptContent })
      await sleep(defer)
      // evaluate: 在evaluate里可执行上下文脚本
      await page.evaluate(options => {
        Skeleton.genSkeleton(options)
      }, this.options)
    } catch (error) {
      this.log.info(error)
    }
  }

  // 根据骨架获取html和css
  async genHtml(url, route) {
    const stylesheetAstObjects = {}
    const stylesheetContents = {}
    const page = await this.newPage()
    const { cookies } = this.options
    // 启动拦截，无缓存模式

    await page.setRequestInterception(true)
    page.on('request', request => {
      if (stylesheetAstObjects[request.url]) {
        // don't need to download the same assets
        request.abort()
      } else {
        request.continue()
      }
    })
    // To build a map of all downloaded CSS (css use link tag)
    page.on('response', response => {
      const requestUrl = response.url()
      const ct = response.headers()['content-type'] || ''
      // 新版本没有 response.ok
      // if (response.ok && !response.ok()) {
      //   throw new Error(`${response.status} on ${requestUrl}`)
      // }
      if (ct.indexOf('text/css') > -1 || /\.css$/i.test(requestUrl)) {
        response.text().then(text => {
          const ast = parse(text, {
            parseValue: false,
            parseRulePrelude: false
          })
          stylesheetAstObjects[requestUrl] = toPlainObject(ast)
          stylesheetContents[requestUrl] = text
        })
      }
    })
    page.on('pageerror', error => {
      this.log.info('pageerror', error)
      throw error
    })

    if (cookies.length) {
      await page.setCookie(...cookies.filter(cookie => typeof cookie === 'object'))
    }
    const response = await page.goto(url, { waitUntil: 'networkidle2' })

    if (response && !response.ok()) {
      throw new Error(`${response.status} on ${url}`)
    }

    // 创建骨架
    await this.makeSkeleton(page)
    const { styles, cleanedHtml } = await page.evaluate(() => Skeleton.getHtmlAndStyle())
    const stylesheetAstArray = styles.map(style => {
      const ast = parse(style, {
        parseValue: false,
        parseRulePrelude: false
      })
      return toPlainObject(ast)
    })

    const cleanedCSS = await page.evaluate(
      async (stylesheetAstObjects, stylesheetAstArray) => {
        // eslint-disable-line no-shadow
        const DEAD_OBVIOUS = new Set(['*', 'body', 'html'])
        const cleanedStyles = []

        const checker = selector => {
          if (DEAD_OBVIOUS.has(selector)) {
            return true
          }
          if (/:-(ms|moz)-/.test(selector)) {
            return true
          }
          if (/:{1,2}(before|after)/.test(selector)) {
            return true
          }
          try {
            const keep = !!document.querySelector(selector)
            return keep
          } catch (err) {
            const exception = err.toString()
            console.log(`Unable to querySelector('${selector}') [${exception}]`, 'error') // eslint-disable-line no-console
            return false
          }
        }

        const cleaner = (ast, callback) => {
          const decisionsCache = {}

          const clean = (children, cb) =>
            children.filter(child => {
              if (child.type === 'Rule') {
                const values = child.prelude.value.split(',').map(x => x.trim())
                const keepValues = values.filter(selectorString => {
                  if (decisionsCache[selectorString]) {
                    return decisionsCache[selectorString]
                  }
                  const keep = cb(selectorString)
                  decisionsCache[selectorString] = keep
                  return keep
                })
                if (keepValues.length) {
                  // re-write the selector value
                  child.prelude.value = keepValues.join(', ')
                  return true
                }
                return false
              } else if (child.type === 'Atrule' && child.name === 'media') {
                // recurse
                child.block.children = clean(child.block.children, cb)
                return child.block.children.length > 0
              }
              // The default is to keep it.
              return true
            })

          ast.children = clean(ast.children, callback)
          return ast
        }

        const links = Array.from(document.querySelectorAll('link'))

        links
          .filter(
            link =>
              link.href &&
              (link.rel === 'stylesheet' || link.href.toLowerCase().endsWith('.css')) &&
              !link.href.toLowerCase().startsWith('blob:') &&
              link.media !== 'print'
          )
          .forEach(stylesheet => {
            if (!stylesheetAstObjects[stylesheet.href]) {
              throw new Error(`${stylesheet.href} not in stylesheetAstObjects`)
            }
            if (!Object.keys(stylesheetAstObjects[stylesheet.href]).length) {
              // If the 'stylesheetAstObjects[stylesheet.href]' thing is an
              // empty object, simply skip this link.
              return
            }
            const ast = stylesheetAstObjects[stylesheet.href]
            cleanedStyles.push(cleaner(ast, checker))
          })
        stylesheetAstArray.forEach(ast => {
          cleanedStyles.push(cleaner(ast, checker))
        })

        return cleanedStyles
      },
      stylesheetAstObjects,
      stylesheetAstArray
    )

    const allCleanedCSS = cleanedCSS
      .map(ast => {
        const cleanedAst = fromPlainObject(ast)
        return generate(cleanedAst)
      })
      .join('\n')
    const finalCss = collectImportantComments(allCleanedCSS)
    // finalCss = minify(finalCss).css ? `html-minifier` use `clean-css` as css minifier
    // so don't need to use another mimifier.
    let shellHtml = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Page Skeleton</title>
        <style>
          $$css$$
        </style>
      </head>
      <body>
        $$html$$
      </body>
      </html>`
    shellHtml = shellHtml.replace('$$css$$', finalCss).replace('$$html$$', cleanedHtml)
    const result = {
      originalRoute: route,
      route: await page.evaluate('window.location.pathname'),
      html: htmlMinify(shellHtml, true),
      css: finalCss,
      template: cleanedHtml
    }
    // await this.closePage(page)
    return Promise.resolve(result)
  }

  async renderRoutes(origin, routes = this.options.routes) {
    if (!this.browser) await this.initialize()
    return Promise.all(
      routes.map(route => {
        const url = `${origin}${route}`
        return this.genHtml(url, route)
      })
    )
  }

  async destroy() {
    if (this.pages.size) {
      const promises = []
      for (const page of this.pages) {
        promises.push(page.close())
      }
      try {
        await Promise.all(promises)
      } catch (err) {
        console.log(err)
      }
      this.pages = null
    }
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

module.exports = Skeleton
