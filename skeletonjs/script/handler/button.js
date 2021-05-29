/**
 * [buttonHandler 改变 button 元素样式：包括去除 border和 box-shadow, 背景色和文字颜色统一]
 */
import elementReplace2Span from './elementReplace2Span'

function buttonHandler(ele, { color, excludes }) {
  elementReplace2Span(ele, color, excludes)
}

export default buttonHandler
