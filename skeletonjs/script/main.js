import {
  $$, $, getComputedStyle, checkHasPseudoEle, inViewPort, checkHasBorder,
  isBase64Img, transparent, checkHasTextDecoration, removeElement, setOpacity,
  isBackgroundColorDefault
} from './util'
import {
  DISPLAY_NONE, Node, EXT_REG, TRANSPARENT, GRADIENT_REG,
  PRE_REMOVE_TAGS, MOCK_TEXT_ID, AFTER_REMOVE_TAGS, CONSOLE_SELECTOR
} from './config'
import * as handler from './handler/index.js'
import addShineStyle from './handler/animation.js'
import styleCache from './handler/styleCache'
function traverse(options) {
  const { remove, excludes, text, image, button, svg, grayBlock, pseudo, cssUnit, decimal, bgblock } = options
  const excludesEle = excludes.length ? Array.from($$(excludes.join(','))) : []
  const grayEle = grayBlock.length ? Array.from($$(grayBlock.join(','))) : []
  const rootElement = document.documentElement

  const texts = []
  const buttons = []
  const hasImageBackEles = []
  const toRemove = []
  const imgs = []
  const svgs = []
  const pseudos = []
  const gradientBackEles = []
  const grayBlocks = []
  const bgBlocks = []
  const inputs = []

  if (Array.isArray(remove)) {
    remove.push(CONSOLE_SELECTOR, ...PRE_REMOVE_TAGS)
    toRemove.push(...$$(remove.join(',')))
  }

  ; (function preTraverse(ele) {
    const styles = getComputedStyle(ele)
    const hasPseudoEle = checkHasPseudoEle(ele)
    if (!inViewPort(ele) || DISPLAY_NONE.test(ele.getAttribute('style'))) {
      return toRemove.push(ele)
    }

    if (ele.tagName === 'IFRAME') {
      // 移除iframe
      return removeElement(ele)
    }

    if (~grayEle.indexOf(ele)) { // eslint-disable-line no-bitwise
      return grayBlocks.push(ele)
    }
    if (~excludesEle.indexOf(ele)) return false // eslint-disable-line no-bitwise

    if (hasPseudoEle) {
      pseudos.push(hasPseudoEle)
    }

    if (checkHasBorder(styles)) {
      ele.style.border = 'none'
    }

    if (ele.children.length > 0 && /UL|OL/.test(ele.tagName)) {
      handler.list(ele)
    }
    if (ele.children && ele.children.length > 0) {
      const unser = ['HEAD', 'SCRIPT']
      if (unser.indexOf(ele.tagName) > -1) return
      Array.from(ele.children).forEach(child => preTraverse(child))
    }

    // 将所有拥有 textChildNode 子元素的元素的文字颜色设置成背景色，这样就不会在显示文字了。
    if (ele.childNodes && Array.from(ele.childNodes).some(n => n.nodeType === Node.TEXT_NODE)) {
      transparent(ele)
    }
    if (checkHasTextDecoration(styles)) {
      ele.style.textDecorationColor = TRANSPARENT
    }
    // 隐藏所有 svg 元素
    if (ele.tagName === 'svg') {
      return svgs.push(ele)
    }
    if (EXT_REG.test(styles.background) || EXT_REG.test(styles.backgroundImage)) {
      return hasImageBackEles.push(ele)
    }
    if (GRADIENT_REG.test(styles.background) || GRADIENT_REG.test(styles.backgroundImage)) {
      return gradientBackEles.push(ele)
    }

    if (ele.tagName === 'IMG' || isBase64Img(ele)) {
      return imgs.push(ele)
    }
    if (ele.tagName === 'INPUT') {
      return inputs.push(ele)
    }
    if (
      ele.nodeType === Node.ELEMENT_NODE &&
      (ele.tagName === 'BUTTON' || (ele.tagName === 'A' && ele.getAttribute('role') === 'button'))
    ) {
      return buttons.push(ele)
    }
    if (ele.childNodes &&
      ele.childNodes.length === 1) {
    }
    if (
      ele.childNodes &&
      ele.childNodes.length > 0 &&
      ele.childNodes[0].nodeType === Node.TEXT_NODE &&
      /\S/.test(ele.childNodes[0].textContent)
    ) {
      return texts.push(ele)
    }
    // 之后处理添加有背景颜色的处理
    if (isBackgroundColorDefault(styles.backgroundColor)) {
      return bgBlocks.push(ele)
    }
  }(rootElement))

  svgs.forEach(e => handler.svg(e, svg, cssUnit, decimal))
  texts.forEach(e => handler.text(e, text, cssUnit, decimal))
  buttons.forEach(e => handler.button(e, button))
  hasImageBackEles.forEach(e => handler.background(e, image))
  imgs.forEach(e => handler.image(e, image))
  pseudos.forEach(e => handler.pseudos(e, pseudo))
  gradientBackEles.forEach(e => handler.background(e, image))
  inputs.forEach(e => handler.input(e, image))
  bgBlocks.forEach(e => handler.background(e, bgblock))
  grayBlocks.forEach(e => handler.grayBlock(e, button))
  // remove mock text wrapper
  const offScreenParagraph = $(`#${MOCK_TEXT_ID}`)
  if (offScreenParagraph && offScreenParagraph.parentNode) {
    toRemove.push(offScreenParagraph.parentNode)
  }
  toRemove.forEach(e => removeElement(e))
}

// 构建骨架
function genSkeleton(options) {
  const {
    hide
  } = options
  /**
   * before walk
   */
  // 将 `hide` 队列中的元素通过调节透明度为 0 来进行隐藏
  if (hide.length) {
    const hideEle = $$(hide.join(','))
    Array.from(hideEle).forEach(ele => setOpacity(ele))
  }
  /**
   * walk in process
   */

  traverse(options)
  /**
   * add `<style>`
   */
  addShineStyle()

  let rules = ''

  for (const [selector, rule] of styleCache) {
    rules += `${selector} ${rule}\n`
  }

  const styleEle = document.createElement('style')

  if (!window.createPopup) { // For Safari
    styleEle.appendChild(document.createTextNode(''))
  }
  styleEle.innerHTML = rules
  if (document.head) {
    document.head.appendChild(styleEle)
  } else {
    document.body.appendChild(styleEle)
  }
  /**
   * add animation of skeleton page when loading
   */
}

// 获取构建后的内容
function getHtmlAndStyle() {
  const root = document.documentElement
  const rawHtml = root.outerHTML
  const styles = Array.from($$('style')).map(style => style.innerHTML || style.innerText)
  Array.from($$(AFTER_REMOVE_TAGS.join(','))).forEach(ele => removeElement(ele))
  // fix html parser can not handle `<div ubt-click=3659 ubt-data="{&quot;restaurant_id&quot;:1236835}" >`
  // need replace `&quot;` into `'`
  const cleanedHtml = document.body.innerHTML.replace(/&quot;/g, "'")
  return {
    rawHtml,
    styles,
    cleanedHtml
  }
}

export {
  genSkeleton,
  getHtmlAndStyle
}
