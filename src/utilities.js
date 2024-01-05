// https://github.com/lodash/lodash/blob/master/isObject.js
export function isObject (value) {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

// https://github.com/lodash/lodash/blob/master/.internal/getTag.js
export function getTag (value) {
  if (value === null) {
    return value === undefined ? '[object Undefined]' : '[object Null]'
  }
  return Object.prototype.toString.call(value)
}

// https://github.com/lodash/lodash/blob/master/isFunction.js
export function isFunction (value) {
  if (!isObject(value)) {
    return false
  }

  const tag = getTag(value)
  return (
    tag === '[object Function]' ||
    tag === '[object AsyncFunction]' ||
    tag === '[object GeneratorFunction]' ||
    tag === '[object Proxy]'
  )
}

// https://github.com/lodash/lodash/blob/master/isString.js
export function isString (value) {
  const type = typeof value
  return (
    type === 'string' ||
    (type === 'object' &&
      value != null &&
      !Array.isArray(value) &&
      getTag(value) === '[object String]')
  )
}

export function mapObject (value, fn) {
  if (!isObject(value)) {
    return []
  }
  return Object.keys(value).map(key => fn(value[key], key))
}


export function escapeRegExpMatch (s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export function isExactMatch (str, match) {
  return new RegExp(`\\b${escapeRegExpMatch(match)}\\b`).test(str)
}

export function obscureQueryParameterValues(url) {
  // Use a regular expression to match and replace query parameter values with asterisks
  const md5Index = url.indexOf('[M25++]');
  if (md5Index !== -1) {
    return url.slice(0, md5Index).replace(/(\?|&)([^&=]+)=([^&]+)/g, "$1$2=***");
  }
  return url?.replace(/(\?|&)([^&=]+)=([^&]+)/g, "$1$2=***");
}