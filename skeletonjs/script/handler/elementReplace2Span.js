import addShine from './loading'

// 元素替换
const elementReplace2Span = (ele, color, exceptions = []) => {
  const {
    width,
    height,
    padding,
    position,
    margin,
    display,
    borderRadius
  } = getComputedStyle(ele)
  const parentNode = ele.parentNode
  const attrs = {
    width,
    height,
    padding,
    position: position === 'static' ? 'relative' : position,
    display: display === 'inline' ? 'inline-block' : display,
    borderRadius: borderRadius,
    backgroundColor: color,
    border: 'none',
    margin
  }
  const newEle = document.createElement('span')

  if (ele.classList.length > 0) {
    ele.classList.forEach(el => newEle.classList.add(el))
  }
  Object.keys(attrs).forEach(el => (exceptions.indexOf(el) === -1) && (newEle.style[el] = attrs[el]))
  parentNode.replaceChild(newEle, ele)
  addShine(newEle)
}

export default elementReplace2Span
