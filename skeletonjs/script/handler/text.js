import { getComputedStyle, px2relativeUtil, getTextWidth, addClassName } from '../util'
import { addStyle } from './styleCache'
import addShine from './loading'
import { CLASS_NAME_PREFEX } from '../config'

function addTextMask(paragraph, {
  textAlign,
  lineHeight,
  paddingBottom,
  paddingLeft,
  paddingRight
}, maskWidthPercent = 0.5) {
  let left
  let right
  switch (textAlign) {
    case 'center':
      left = document.createElement('span')
      right = document.createElement('span')
        ;[left, right].forEach(mask => {
          Object.assign(mask.style, {
            display: 'inline-block',
            width: `${maskWidthPercent / 2 * 100}%`,
            height: lineHeight,
            background: '#fff',
            position: 'absolute',
            bottom: paddingBottom
          })
        })
      left.style.left = paddingLeft
      right.style.right = paddingRight
      paragraph.appendChild(left)
      paragraph.appendChild(right)
      break
    case 'right':
      left = document.createElement('span')
      Object.assign(left.style, {
        display: 'inline-block',
        width: `${maskWidthPercent * 100}%`,
        height: lineHeight,
        background: '#fff',
        position: 'absolute',
        bottom: paddingBottom,
        left: paddingLeft
      })
      paragraph.appendChild(left)
      break
    case 'left':
    default:
      right = document.createElement('span')
      Object.assign(right.style, {
        display: 'inline-block',
        width: `${maskWidthPercent * 100}%`,
        height: lineHeight,
        background: '#fff',
        position: 'absolute',
        bottom: paddingBottom,
        right: paddingRight
      })
      paragraph.appendChild(right)
      break
  }
}

function textHandler(ele, { color }, cssUnit, decimal) {
  const { width } = ele.getBoundingClientRect()
  const comStyle = getComputedStyle(ele)
  const text = ele.textContent
  const {
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    position: pos,
    fontSize,
    wordSpacing,
    wordBreak,
    display,
    justifyContent
  } = comStyle
  let { lineHeight, textAlign } = comStyle

  if (!/\d/.test(lineHeight)) {
    const fontSizeNum = parseFloat(fontSize, 10) || 14
    lineHeight = `${fontSizeNum * 1.4}px`
  }
  const position = ['fixed', 'absolute', 'flex'].find(p => p === pos) ? pos : 'relative'
  const height = ele.offsetHeight
  // Math.floor
  const lineCount = (height - parseFloat(paddingTop, 10) - parseFloat(paddingBottom, 10)) / parseFloat(lineHeight, 10) | 0 // eslint-disable-line no-bitwise
  let textHeightRatio = parseFloat(fontSize, 10) / parseFloat(lineHeight, 10)
  if (Number.isNaN(textHeightRatio)) {
    textHeightRatio = 1 / 1.4 // default number
  }
  /* eslint-disable no-mixed-operators */
  const firstColorPoint = ((1 - textHeightRatio) / 2 * 100).toFixed(decimal)
  const secondColorPoint = (((1 - textHeightRatio) / 2 + textHeightRatio) * 100).toFixed(decimal)
  const backgroundSize = `100% ${px2relativeUtil(lineHeight, cssUnit, decimal)}`
  const className = CLASS_NAME_PREFEX + 'text-' + firstColorPoint.toString(32).replace(/\./g, '-')

  const rule = `{
  background-image: linear-gradient(transparent ${firstColorPoint}%, ${color} 0%, ${color} ${secondColorPoint}%, transparent 0%) !important;
  background-size: ${backgroundSize};
  position: ${position} !important;
}`

  const invariableClassName = CLASS_NAME_PREFEX + 'text'

  const invariableRule = `{
  background-origin: content-box !important;
  background-clip: content-box !important;
  background-color: transparent !important;
  color: transparent !important;
  background-repeat: repeat-y !important;
}`

  addStyle(`.${className}`, rule)
  addStyle(`.${invariableClassName}`, invariableRule)
  addClassName(ele, [className, invariableClassName])
  if (lineCount > 1) {
    addTextMask(ele, comStyle)
  } else {
    const textWidth = getTextWidth(text, {
      fontSize,
      lineHeight,
      wordBreak,
      wordSpacing
    })
    const textWidthPercent = textWidth / (width - parseInt(paddingRight, 10) - parseInt(paddingLeft, 10))

    ele.style.backgroundSize = `${(textWidthPercent > 1 ? 1 : textWidthPercent) * 100}% ${px2relativeUtil(lineHeight, cssUnit, decimal)}`

    if (display === 'flex') {
      textAlign = { 'center': 'center', 'flex-end': 'right', 'flex-start': 'left' }[justifyContent]
    }
    switch (textAlign) {
      case 'left': // do nothing
        break
      case 'center':
        ele.style.backgroundPositionX = '50%'
        break
      case 'right':
        ele.style.backgroundPositionX = '100%'
        break
    }

    addShine(ele, {
      width: `${(textWidthPercent > 1 ? 1 : textWidthPercent) * 100}%`,
      top: `${firstColorPoint}%`,
      left: `${{ 'left': 0, 'center': '50%', 'right': `calc(100% - ${width})` }[textAlign]}`,
      transform: `translate(-${{ 'left': 0, 'center': '50%', 'right': `calc(100% - ${width})` }[textAlign]}, 0)`,
      height: `${secondColorPoint - firstColorPoint}%`
    })
  }
}

export default textHandler
