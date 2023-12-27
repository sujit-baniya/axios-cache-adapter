import { isObject } from './utilities'

function obscureQueryParameterValues(url) {
  // Use a regular expression to match and replace query parameter values with asterisks
  return url?.replace(/(\?|&)([^&=]+)=([^&]+)/g, '$1$2=***');
}

function filter(config = {}, req) {
  const { debug, document } = config
  if(Object.keys(document.included).length === 0) return false;
  const url = document.included[obscureQueryParameterValues(req.url)];
  console.log('[axios][filter]', url, url === undefined)
  return url === undefined
}

function exclude(config = {}, req) {
  const { exclude = {}, debug } = config
  const method = req.method.toLowerCase()

  if (method === 'head' || exclude.methods.includes(method)) {
    debug(`Excluding request by HTTP method ${req.url}`)

    return true
  }

  if ((typeof exclude.filter === 'function') && exclude.filter(config, req)) {
    debug(`Excluding request by Yasser ;) filter ${req.url}`)

    return true
  }

  if ((typeof exclude.filter !== 'function') && filter(config, req)) {
    debug(`Excluding request by default Yasser ;) filter ${req.url}`)

    return true
  }

  // do not cache request with query
  const hasQueryParams = /\?.*$/.test(req.url) ||
    (isObject(req.params) && Object.keys(req.params).length !== 0) ||
    (typeof URLSearchParams !== 'undefined' && req.params instanceof URLSearchParams)

  if (exclude.query && hasQueryParams) {
    debug(`Excluding request by query ${req.url}`)

    return true
  }

  const paths = exclude.paths || []
  const found = paths.some(regexp => req.url.match(regexp))

  if (found) {
    debug(`Excluding request by url match ${req.url}`)

    return true
  }

  return false
}



export default exclude
export { exclude, filter }