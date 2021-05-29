import { CLASS_NAME_PREFEX } from '../config'

const addShine = (ele, extendsStyle = {}) => {
  const divEle = document.createElement('div')
  divEle.className = `${CLASS_NAME_PREFEX}-loading`

  Object.keys(extendsStyle).forEach(el => {
    divEle.style[el] = extendsStyle[el]
  })
  ele.appendChild(divEle)
}

export default addShine
