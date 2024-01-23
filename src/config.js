import axios from 'axios'

import MemoryStore from './memory'
import { key, invalidate } from './cache'
import exclude, { filter } from "./exclude"

const noop = () => { }
const debug = (...args) => console.log('[axios-cache-adapter]', ...args)

const defaults = {
  // Default settings when solely creating the cache adapter with setupCache.
  cache: {
    maxAge: 0,
    host: null,
    limit: false,
    store: null,
    watch: null,
    key: null,
    invalidate: null,
    document: null,
    invalidationOrder: false,
    exclude: {
      paths: [],
      query: false,
      filter: null,
      methods: ['patch', 'put', 'delete']
    },
    adapter: axios.defaults.adapter,
    clearOnStale: true,
    clearOnError: true,
    readOnError: false,
    readHeaders: false,
    debug: false,
    ignoreCache: false,
    filterFn: undefined
  },

  // Additional defaults when creating the axios instance with the cache adapter.
  axios: {
    cache: {
      maxAge: 15 * 60 * 1000
    }
  }
}

// List of disallowed in the per-request config.
const disallowedPerRequestKeys = ['limit', 'store', 'adapter', 'uuid', 'acceptStale']

const proxyHandler = {
  get(target, prop, receiver) {
    if (typeof target[prop] === "object" && target[prop] !== null) {
      // console.log("dyno ;)", target[prop], "proxyHanlerrrrrrrr me ;)");
      return setupHostProxy(target.host, target[prop]); 
    }
    // console.log('lol', prop)
    try{
      const result = target.host !== null && prop.replace(target.host, '') || prop;
      // console.log(result, 'opppppslol', target[result])
      return target[result]
    }catch{
      return target[prop]
    }
  }
};

const setupHostProxy = (host, data) => {
  return new Proxy({
    ...data,
    host
  }, proxyHandler);
};

/**
 * Make a global config object.
 *
 * @param {Object} [override={}] Optional config override.
 * @return {Object}
 */
const makeConfig = function (override = {}) {
  const config = {
    ...defaults.cache,
    ...override,
    exclude: {
      ...defaults.cache.exclude,
      ...override.exclude
    }
  }

  // Create a cache key method
  config.key = key(config)
  config.invalidate = invalidate(config)
  // If debug mode is on, create a simple logger method
  if (config.debug !== false) {
    config.debug = typeof config.debug === 'function' ? config.debug : debug
  } else {
    config.debug = noop
  }

  if (exclude.filter === null) exclude.filter = filter;

  // Create an in memory store if none was given
  if (!config.store) config.store = new MemoryStore()
  if (!config.watch) config.watch = new MemoryStore()


  config.document = setupHostProxy(config.host, config.document);
  config.debug('Global cache config', config)

  return config
}

/**
 * Merge the per-request config in another config.
 *
 * This method exists because not all keys should be allowed as it
 * may lead to unexpected behaviours. For instance, setting another
 * store or adapter per request is wrong, instead another instance
 * axios, or the adapter, should be used.
 *
 * @param {Object} config Config object.
 * @param {Object} req    The current axios request
 * @return {Object}
 */
const mergeRequestConfig = function (config, req) {
  const requestConfig = req.cache || {}
  if (requestConfig) {
    disallowedPerRequestKeys.forEach(key => requestConfig[key] ? (delete requestConfig[key]) : undefined)
  }

  const mergedConfig = {
    ...config,
    ...requestConfig,
    exclude: {
      ...config.exclude,
      ...requestConfig.exclude
    }
  }

  if (mergedConfig.debug === true) {
    mergedConfig.debug = debug
  }

  // Create a cache key method
  if (requestConfig.key) {
    mergedConfig.key = key(requestConfig)
  }

  // Generate request UUID
  mergedConfig.uuid = mergedConfig.key(req)

  config.debug(`Request config for ${req.url}`, mergedConfig)

  return mergedConfig
}

export { defaults, makeConfig, mergeRequestConfig }
export default { defaults, makeConfig, mergeRequestConfig }
