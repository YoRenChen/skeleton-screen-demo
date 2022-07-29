var Skeleton = (function (exports) {
  'use strict';

  /**
  * constants
  */
  const TRANSPARENT = 'transparent';
  const EXT_REG = /\.(jpeg|jpg|png|gif|svg|webp)/;
  const GRADIENT_REG = /gradient/;
  const DISPLAY_NONE = /display:\s*none/;
  const PRE_REMOVE_TAGS = ['script'];
  const AFTER_REMOVE_TAGS = ['title', 'meta', 'style'];
  const CLASS_NAME_PREFEX = 'sk-';
  const CONSOLE_SELECTOR = '.sk-console';
  const MOCK_TEXT_ID = 'sk-text-id';
  const Node = window.Node;

  /**
   * a Map instance to cache the styles which will be inserted into the skeleton page.
   * key is the selector and value is the css rules.
   */

  const styleCache = new Map();

  // some common styles
  const shapeStyle = shape => {
    const selector = `.${CLASS_NAME_PREFEX + shape}`;
    const rule = `{
    border-radius: ${shape === 'rect' ? '0' : '50%'};
  }`;
    if (!styleCache.has(selector)) {
      styleCache.set(selector, rule);
    }
  };

  const addStyle = (selector, rule) => {
    if (!styleCache.has(selector)) {
      styleCache.set(selector, rule);
    }
  };

  const getComputedStyle$1 = window.getComputedStyle;
  const $$ = document.querySelectorAll.bind(document);
  const $ = document.querySelector.bind(document);
  const isBase64Img = (img) => /base64/.test(img.src);

  const inViewPort = (ele) => {
    const rect = ele.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.left < window.innerWidth
  };

  const checkHasPseudoEle = (ele) => {
    const hasBefore = getComputedStyle$1(ele, '::before').getPropertyValue('content') !== '';
    const hasAfter = getComputedStyle$1(ele, '::after').getPropertyValue('content') !== '';
    if (hasBefore || hasAfter) {
      return { hasBefore, hasAfter, ele }
    }
    return false
  };

  const checkHasBorder = (styles) => styles.getPropertyValue('border-style') !== 'none';

  const checkHasTextDecoration = (styles) => !/none/.test(styles.textDecorationLine);

  const getViewPort = () => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    return {
      vh,
      vw,
      vmax: Math.max(vw, vh),
      vmin: Math.min(vw, vh)
    }
  };

  const px2relativeUtil = (px, unit = 'rem', decimal = 4) => {
    const pxValue = typeof px === 'string' ? parseFloat(px, 10) : px;
    if (unit === 'rem') {
      const htmlElementFontSize = getComputedStyle$1(document.documentElement).fontSize;
      return `${(pxValue / parseFloat(htmlElementFontSize, 10)).toFixed(decimal)}${unit}`
    } else {
      const dimensions = getViewPort();
      const base = dimensions[unit];
      return `${(pxValue / base * 100).toFixed(decimal)}${unit}`
    }
  };

  const getTextWidth = (text, style) => {
    let offScreenParagraph = document.querySelector(`#${MOCK_TEXT_ID}`);
    if (!offScreenParagraph) {
      const wrapper = document.createElement('p');
      offScreenParagraph = document.createElement('span');
      Object.assign(wrapper.style, {
        width: '10000px'
      });
      offScreenParagraph.id = MOCK_TEXT_ID;
      wrapper.appendChild(offScreenParagraph);
      document.body.appendChild(wrapper);
    }
    Object.assign(offScreenParagraph.style, style);
    offScreenParagraph.textContent = text;
    return offScreenParagraph.getBoundingClientRect().width
  };

  const addClassName = (ele, classArray) => {
    for (const name of classArray) {
      ele.classList.add(name);
    }
  };

  const setOpacity = (ele) => {
    const className = CLASS_NAME_PREFEX + 'opacity';
    const rule = `{
    opacity: 0 !important;
  }`;
    addStyle(`.${className}`, rule);
    ele.classList.add(className);
  };

  const transparent = (ele) => {
    const className = CLASS_NAME_PREFEX + 'transparent';
    const rule = `{
    color: ${TRANSPARENT} !important;
  }`;
    addStyle(`.${className}`, rule);
    ele.classList.add(className);
  };

  const removeElement = (ele) => {
    const parent = ele.parentNode;
    if (parent) {
      parent.removeChild(ele);
    }
  };

  const isBackgroundColorDefault = (str) => {
    if (str.indexOf('#') > -1) {
      return str === '#ffffff' || str === '#fff'
    }
    const num = str.match(/[^\(\)]+(?=\))/g)[0].split(',');
    if (num.length === 4 && !num[length - 1]) return false
    return num.some(el => Number(el) !== 255)
  };

  function listHandle(ele) {
    const children = ele.children;
    const len = Array.from(children).filter(child => child.tagName === 'LI').length;
    if (len === 0) return false
    const firstChild = children[0];
    // 解决有时ul元素子元素不是 li元素的 bug。
    if (firstChild.tagName !== 'LI') return listHandle(firstChild)
    Array.from(children).forEach((c, i) => {
      if (i > 0) c.parentNode.removeChild(c);
    });
    // 将 li 所有兄弟元素设置成相同的元素，保证生成的页面骨架整齐
    for (let i = 1; i < len; i++) {
      ele.appendChild(firstChild.cloneNode(true));
    }
  }

  /**
   * use the same config options as image block.
   */
  // import { addClassName } from '../util'

  function backgroundHandler(ele, { color, shape }) {
    const imageClass = CLASS_NAME_PREFEX + 'bg';
    // const shapeClass = CLASS_NAME_PREFEX + shape
    const rule = `{
    background: ${color} !important;
  }`;

    addStyle(`.${imageClass}`, rule);

    shapeStyle(shape);

    // addClassName(ele, [imageClass, shapeClass])
    ele.classList.add(imageClass);
  }

  const addShine = (ele, extendsStyle = {}) => {
    const divEle = document.createElement('div');
    divEle.className = `${CLASS_NAME_PREFEX}-loading`;

    Object.keys(extendsStyle).forEach(el => {
      divEle.style[el] = extendsStyle[el];
    });
    ele.appendChild(divEle);
  };

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
    } = getComputedStyle(ele);
    const parentNode = ele.parentNode;
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
    };
    const newEle = document.createElement('span');

    if (ele.classList.length > 0) {
      ele.classList.forEach(el => newEle.classList.add(el));
    }
    Object.keys(attrs).forEach(el => (exceptions.indexOf(el) === -1) && (newEle.style[el] = attrs[el]));
    parentNode.replaceChild(newEle, ele);
    addShine(newEle);
  };

  /**
   * [buttonHandler 改变 button 元素样式：包括去除 border和 box-shadow, 背景色和文字颜色统一]
   */

  function buttonHandler(ele, { color, excludes }) {
    elementReplace2Span(ele, color, excludes);
  }

  function grayHandler(ele, { color }) {
    const classname = CLASS_NAME_PREFEX + 'gray';
    const rule = `{
    color: ${color} !important;
    background: ${color} !important;
  }`;
    addStyle(`.${classname}`, rule);
    ele.classList.add(classname);

    const elements = ele.querySelectorAll('*');
    Array.from(elements).forEach(element => {
      const childNodes = element.childNodes;
      if (Array.from(childNodes).some(n => n.nodeType === Node.TEXT_NODE)) {
        element.classList.add(classname);
      }
    });
  }

  function imgHandler(ele, { color, shape, shapeOpposite }) {
    elementReplace2Span(ele, color);
  }

  function pseudosHandler({ ele }) {
    const className = `${CLASS_NAME_PREFEX}-opacity-down`;
    const rules = {
      [`.${className}::before, .${className}::after`]: `{
        opacity: 0 !important;
      }`
    };

    Object.keys(rules).forEach(key => {
      addStyle(key, rules[key]);
    });
    ele.classList.add(className);
  }

  function svgHandler(ele, { color, shape, shapeOpposite }, cssUnit, decimal) {
    elementReplace2Span(ele, color);
  }

  function addTextMask(
    paragraph,
    { textAlign, lineHeight, paddingBottom, paddingLeft, paddingRight },
    maskWidthPercent = 0.5
  ) {
    let left;
    let right;
    switch (textAlign) {
      case 'center':
        left = document.createElement('span');
        right = document.createElement('span')
        ;[left, right].forEach(mask => {
          Object.assign(mask.style, {
            display: 'inline-block',
            width: `${(maskWidthPercent / 2) * 100}%`,
            height: lineHeight,
            background: '#fff',
            position: 'absolute',
            bottom: paddingBottom
          });
        });
        left.style.left = paddingLeft;
        right.style.right = paddingRight;
        paragraph.appendChild(left);
        paragraph.appendChild(right);
        break
      case 'right':
        left = document.createElement('span');
        Object.assign(left.style, {
          display: 'inline-block',
          width: `${maskWidthPercent * 100}%`,
          height: lineHeight,
          background: '#fff',
          position: 'absolute',
          bottom: paddingBottom,
          left: paddingLeft
        });
        paragraph.appendChild(left);
        break
      case 'left':
      default:
        right = document.createElement('span');
        Object.assign(right.style, {
          display: 'inline-block',
          width: `${maskWidthPercent * 100}%`,
          height: lineHeight,
          background: '#fff',
          position: 'absolute',
          bottom: paddingBottom,
          right: paddingRight
        });
        paragraph.appendChild(right);
        break
    }
  }

  function textHandler(ele, { color }, cssUnit, decimal) {
    const { width } = ele.getBoundingClientRect();
    const comStyle = getComputedStyle$1(ele);
    const text = ele.textContent;
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
    } = comStyle;
    let { lineHeight, textAlign } = comStyle;

    if (!/\d/.test(lineHeight)) {
      const fontSizeNum = parseFloat(fontSize, 10) || 14;
      lineHeight = `${fontSizeNum * 1.4}px`;
    }
    const position = ['fixed', 'absolute', 'flex'].find(p => p === pos) ? pos : 'relative';
    const height = ele.offsetHeight;
    // Math.floor
    const lineCount =
      ((height - parseFloat(paddingTop, 10) - parseFloat(paddingBottom, 10)) / parseFloat(lineHeight, 10)) | 0; // eslint-disable-line no-bitwise
    let textHeightRatio = parseFloat(fontSize, 10) / parseFloat(lineHeight, 10);
    if (Number.isNaN(textHeightRatio)) {
      textHeightRatio = 1 / 1.4; // default number
    }
    /* eslint-disable no-mixed-operators */
    const firstColorPoint = (((1 - textHeightRatio) / 2) * 100).toFixed(decimal);
    const secondColorPoint = (((1 - textHeightRatio) / 2 + textHeightRatio) * 100).toFixed(decimal);
    const backgroundSize = `100% ${px2relativeUtil(lineHeight, cssUnit, decimal)}`;
    const className = CLASS_NAME_PREFEX + 'text-' + firstColorPoint.toString(32).replace(/\./g, '-');

    const rule = `{
  background-image: linear-gradient(transparent ${firstColorPoint}%, ${color} 0%, ${color} ${secondColorPoint}%, transparent 0%) !important;
  background-size: ${backgroundSize};
  position: ${position} !important;
}`;

    const invariableClassName = CLASS_NAME_PREFEX + 'text';

    const invariableRule = `{
  background-origin: content-box !important;
  background-clip: content-box !important;
  background-color: transparent !important;
  color: transparent !important;
  background-repeat: repeat-y !important;
}`;

    addStyle(`.${className}`, rule);
    addStyle(`.${invariableClassName}`, invariableRule);
    addClassName(ele, [className, invariableClassName]);
    if (lineCount > 1) {
      addTextMask(ele, comStyle);
    } else {
      const textWidth = getTextWidth(text, {
        fontSize,
        lineHeight,
        wordBreak,
        wordSpacing
      });
      const textWidthPercent = textWidth / (width - parseInt(paddingRight, 10) - parseInt(paddingLeft, 10));

      ele.style.backgroundSize = `${(textWidthPercent > 1 ? 1 : textWidthPercent) * 100}% ${px2relativeUtil(
      lineHeight,
      cssUnit,
      decimal
    )}`;

      if (display === 'flex') {
        textAlign = { center: 'center', 'flex-end': 'right', 'flex-start': 'left' }[justifyContent];
      }
      switch (textAlign) {
        case 'left': // do nothing
          break
        case 'center':
          ele.style.backgroundPositionX = '50%';
          break
        case 'right':
          ele.style.backgroundPositionX = '100%';
          break
      }

      addShine(ele, {
        width: `${(textWidthPercent > 1 ? 1 : textWidthPercent) * 100}%`,
        top: `${firstColorPoint}%`,
        left: `${{ left: 0, center: '50%', right: `calc(100% - ${width})` }[textAlign]}`,
        transform: `translate(-${{ left: 0, center: '50%', right: `calc(100% - ${width})` }[textAlign]}, 0)`,
        height: `${secondColorPoint - firstColorPoint}%`
      });
    }
  }

  const addShineStyle = () => {
    const className = `${CLASS_NAME_PREFEX}-loading`;
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
    };
    Object.keys(rules).forEach(key => addStyle(key, rules[key]));
    const style = document.createElement('style');
    const styleContent = `
    @keyframes flush {
      0% {
        background-position:100% 50%;
      }
      to {
        background-position:0 50%;
      }
    }`;
    style.innerHTML = styleContent;
    document.head.appendChild(style);
  };

  function inputHandler(ele, { color, shape, shapeOpposite }) {
    elementReplace2Span(ele, color);
  }

  function traverse(options) {
    const { remove, excludes, text, image, button, svg, grayBlock, pseudo, cssUnit, decimal, bgblock } = options;
    const excludesEle = excludes.length ? Array.from($$(excludes.join(','))) : [];
    const grayEle = grayBlock.length ? Array.from($$(grayBlock.join(','))) : [];
    const rootElement = document.documentElement;

    const texts = [];
    const buttons = [];
    const hasImageBackEles = [];
    const toRemove = [];
    const imgs = [];
    const svgs = [];
    const pseudos = [];
    const gradientBackEles = [];
    const grayBlocks = [];
    const bgBlocks = [];
    const inputs = [];

    if (Array.isArray(remove)) {
      remove.push(CONSOLE_SELECTOR, ...PRE_REMOVE_TAGS);
      toRemove.push(...$$(remove.join(',')));
    }
  (function preTraverse(ele) {
      const styles = getComputedStyle$1(ele);
      const hasPseudoEle = checkHasPseudoEle(ele);
      if (!inViewPort(ele) || DISPLAY_NONE.test(ele.getAttribute('style'))) {
        return toRemove.push(ele)
      }

      if (ele.tagName === 'IFRAME') {
        // 移除iframe
        return removeElement(ele)
      }

      if (~grayEle.indexOf(ele)) {
        // eslint-disable-line no-bitwise
        return grayBlocks.push(ele)
      }
      if (~excludesEle.indexOf(ele)) return false // eslint-disable-line no-bitwise

      if (hasPseudoEle) {
        pseudos.push(hasPseudoEle);
      }

      if (checkHasBorder(styles)) {
        ele.style.border = 'none';
      }

      if (ele.children.length > 0 && /UL|OL/.test(ele.tagName)) {
        listHandle(ele);
      }
      if (ele.children && ele.children.length > 0) {
        const unser = ['HEAD', 'SCRIPT'];
        if (unser.indexOf(ele.tagName) > -1) return
        Array.from(ele.children).forEach(child => preTraverse(child));
      }

      // 将所有拥有 textChildNode 子元素的元素的文字颜色设置成背景色，这样就不会在显示文字了。
      if (ele.childNodes && Array.from(ele.childNodes).some(n => n.nodeType === Node.TEXT_NODE)) {
        transparent(ele);
      }
      if (checkHasTextDecoration(styles)) {
        ele.style.textDecorationColor = TRANSPARENT;
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
      if (ele.childNodes && ele.childNodes.length === 1) ;
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
    })(rootElement);

    svgs.forEach(e => svgHandler(e, svg));
    texts.forEach(e => textHandler(e, text, cssUnit, decimal));
    buttons.forEach(e => buttonHandler(e, button));
    hasImageBackEles.forEach(e => backgroundHandler(e, image));
    imgs.forEach(e => imgHandler(e, image));
    pseudos.forEach(e => pseudosHandler(e));
    gradientBackEles.forEach(e => backgroundHandler(e, image));
    inputs.forEach(e => inputHandler(e, image));
    bgBlocks.forEach(e => backgroundHandler(e, bgblock));
    grayBlocks.forEach(e => grayHandler(e, button));
    // remove mock text wrapper
    const offScreenParagraph = $(`#${MOCK_TEXT_ID}`);
    if (offScreenParagraph && offScreenParagraph.parentNode) {
      toRemove.push(offScreenParagraph.parentNode);
    }
    toRemove.forEach(e => removeElement(e));
  }

  // 构建骨架
  function genSkeleton(options) {
    const { hide } = options;
    /**
     * before walk
     */
    // 将 `hide` 队列中的元素通过调节透明度为 0 来进行隐藏
    if (hide.length) {
      const hideEle = $$(hide.join(','));
      Array.from(hideEle).forEach(ele => setOpacity(ele));
    }
    /**
     * walk in process
     */

    traverse(options);
    /**
     * add `<style>`
     */
    addShineStyle();

    let rules = '';
    for (const [selector, rule] of styleCache) {
      rules += `${selector} ${rule}\n`;
    }

    const styleEle = document.createElement('style');

    if (!window.createPopup) {
      // For Safari
      styleEle.appendChild(document.createTextNode(''));
    }
    styleEle.innerHTML = rules;
    if (document.head) {
      document.head.appendChild(styleEle);
    } else {
      document.body.appendChild(styleEle);
    }
    /**
     * add animation of skeleton page when loading
     */
  }

  // 获取构建后的内容
  function getHtmlAndStyle() {
    const root = document.documentElement;
    const rawHtml = root.outerHTML;
    const styles = Array.from($$('style')).map(style => style.innerHTML || style.innerText);
    Array.from($$(AFTER_REMOVE_TAGS.join(','))).forEach(ele => removeElement(ele));
    // fix html parser can not handle `<div ubt-click=3659 ubt-data="{&quot;restaurant_id&quot;:1236835}" >`
    // need replace `&quot;` into `'`
    const cleanedHtml = document.body.innerHTML.replace(/&quot;/g, "'");
    return {
      rawHtml,
      styles,
      cleanedHtml
    }
  }

  exports.genSkeleton = genSkeleton;
  exports.getHtmlAndStyle = getHtmlAndStyle;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
