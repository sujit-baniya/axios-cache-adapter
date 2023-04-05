import { isObject } from './utilities'

function filter(config = {}, req) {
  const { exclude = {}, debug, document } = config

  const needObservation = document.cacheDictionary[req.url];
  debug('exclude filter from library', req.url)
  if (needObservation !== undefined) {
    needObservation.forEach(async element => {
      await config?.watch?.setItem(element, true);
    });
    // const obj = needObservation.reduce((accumulator, value) => {
    //   return { ...accumulator, [value]: true };
    // }, {});
    // debug('invalidated by ', config.watch)
    // Object.assign(document.observation, obj);
    // observation[needObservation] = true
  }
  if(Object.keys(document.included).length === 0) return false;
  // debug(`exclude filter from library ------------, ${req.url}, ${document.included[req.url] !== undefined}, '1111', ${document.observation}, ${needObservation}`)
  return document.included[req.url] === undefined
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