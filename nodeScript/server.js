const fs = require('fs')
const { resolve } = require('path')
const express = require('express')
const app = express()
// const proxy = require('./proxy')
const pathDir = process.env.NODE_ENV === 'development' ? '../distDev' : '../dist'
// 模板地址
const tempHtml = fs.readFileSync(resolve(__dirname, '../dist/index.html'), 'utf-8')
const shellFiles = fs.readdirSync(resolve(__dirname, '../dist/shell')).map(el => el.replace('.html', ''))

// 代理相关
// proxy(app)
// // 请求静态资源相关配置
app.use('/js', express.static(resolve(__dirname, pathDir + '/js')))
app.use('/css', express.static(resolve(__dirname, pathDir + '/css')))
app.use('/font', express.static(resolve(__dirname, pathDir + '/font')))
app.use('/img', express.static(resolve(__dirname, pathDir + '/img')))
app.use('*.ico', express.static(resolve(__dirname, pathDir)))

// // 路由请求
app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 'no-store')
  const reqUrl = req.url === '/' ? 'index' : req.url.replace(/\//g, '')

  const resHtml = shellFiles.includes(reqUrl)
    ? tempHtml.replace('<!-- shell -->', fs.readFileSync(resolve(__dirname, `../dist/shell/${reqUrl}.html`), 'utf-8'))
    : tempHtml
  res.status(200)
  res.send(resHtml)
})
module.exports = app
