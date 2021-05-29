import { addStyle } from './styleCache'
import { CLASS_NAME_PREFEX } from '../config'

const addShineStyle = () => {
  const className = `${CLASS_NAME_PREFEX}-loading`
  const rules = {
    [`.${className}`]: `{
      position: absolute;
      width: 100%;
      height: 100%;
      content: '';
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg,transparent 35%,rgb(129 129 129 / 20%) 50%,transparent 65%);
      background-size: 400% 100%;
      animation: flush 0.8s linear infinite;
      border-radius: inherit;
    }`
  }
  Object.keys(rules).forEach(key => addStyle(key, rules[key]))
  const style = document.createElement('style')
  const styleContent = `
    @keyframes flush {
      0% {
        background-position:100% 50%;
      }
      to {
        background-position:0 50%;
      }
    }`
  style.innerHTML = styleContent
  document.head.appendChild(style)
}

export default addShineStyle
