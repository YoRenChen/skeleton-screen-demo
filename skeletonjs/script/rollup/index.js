const rollup = require('rollup')
const config = require('./rollup.config')

const build = async function () {
  const t = await rollup.rollup(config.inputConfig)
  await t.write(config.outputConfig)
}

module.exports = build
