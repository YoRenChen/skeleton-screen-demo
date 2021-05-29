import { CLASS_NAME_PREFEX } from '../config'
import { addStyle } from './styleCache'

function pseudosHandler({ ele }) {
  const className = `${CLASS_NAME_PREFEX}-opacity-down`
  const rules = {
    [`.${className}::before, .${className}::after`]: `{
        opacity: 0 !important;
      }`
  }

  Object.keys(rules).forEach(key => {
    addStyle(key, rules[key])
  })
  ele.classList.add(className)
}

export default pseudosHandler
