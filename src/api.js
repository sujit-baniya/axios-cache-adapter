import axios from 'axios'

import request from './request'
import { serializeQuery } from './cache'
import { defaults, makeConfig, mergeRequestConfig } from './config'
import { isFunction } from './utilities'

/**
 * Configure cache adapter
 *
 * @param   {object} [config={}] Cache adapter options
 * @returns {object} Object containing cache `adapter` and `store`
 */
function setupCache(config = {}) {
  // Extend default configuration
  config = makeConfig(config)

  // Axios adapter. Receives the axios request configuration as only parameter
  async function adapter(req) {
    // Merge the per-request config with the instance config.
    const reqConfig = mergeRequestConfig(config, req)

    // Execute request against local cache
    let res = await request(reqConfig, req)
    const next = res.next

    // Response is not function, something was in cache, return it
    if (!isFunction(next)) return next

    // Nothing in cache so we execute the default adapter or any given adapter
    // Will throw if the request has a status different than 2xx
    let networkError

    try {
      res = await reqConfig.adapter(req)

      //Try to start checking observation here ;)
      const {
        document,
        debug,
        dictionary,
        observable,
        invalidationOrder
      } = reqConfig;
      const needObservation = document?.cacheDictionary[req.url];
      debug('observation filter from library', req.url)
      if (isFunction(observable)) {
        observable(config, req, res);
      }
      if (needObservation !== undefined) {
        const { request, response } = dictionary;
        const invalidationRules = request;
        const invalidationRulesResponse = response;

        let found = invalidationOrder;
        if (invalidationRules) {
          let responseResult = JSON.stringify(req);
          for (let i = 0; i < invalidationRules.length; i++) {
            found = responseResult.includes(invalidationRules[i]);
            debug('observation filter from library foundd', found, invalidationRules[i], req.url);
            if (found) break;
          }

          if(!found){
            responseResult = JSON.stringify(res);
            for (let i = 0; i < invalidationRulesResponse.length; i++) {
              found = responseResult.includes(invalidationRulesResponse[i]);
              debug('observation filter from library foundd response', found, invalidationRulesResponse[i], req.url);
              if (found) break;
            }
          }
        }
        if (!found) {
          needObservation.forEach(async element => {
            debug('observation filter from library found element', element, found);
            await reqConfig?.watch?.setItem(element, true);
          });
        }
      }
      debug('observation filter from library done here', needObservation, res?.status)
      //End of observation :)
      config.debug("ress---", res)

    } catch (err) {
      networkError = err
    }

    if (networkError) {
      // Check if we should attempt reading stale cache data
      const readOnError = isFunction(reqConfig.readOnError)
        ? reqConfig.readOnError(networkError, req)
        : reqConfig.readOnError

      if (readOnError) {
        try {
          // Force cache tu return stale data
          reqConfig.acceptStale = true

          // Try to read from cache again
          res = await request(reqConfig, req)

          // Signal that data is from stale cache
          res.next.request.stale = true

          // No need to check if `next` is a function just return cache data
          return res.next
        } catch (cacheReadError) {
          // Failed to read stale cache, do nothing here, just let the network error be thrown
        }
      }

      // Re-throw error so that it can be caught in userland if we didn't find any stale cache to read
      throw networkError
    }

    // Process response to store in cache
    return next(res)
  }

  // Return adapter and store instance
  return {
    adapter,
    config,
    store: config.store
  }
}

// ---------------------
// Easy API Setup
// ---------------------

/**
 * Setup an axios instance with the cache adapter pre-configured
 *
 * @param {object} [options={}] Axios and cache adapter options
 * @returns {object} Instance of Axios
 */
function setup(config = {}) {
  const instanceConfig = {
    ...defaults.axios,
    ...config,
    cache: {
      ...defaults.axios.cache,
      ...config.cache
    }
  }

  const cache = setupCache(instanceConfig.cache)
  const { cache: _, ...axiosConfig } = instanceConfig

  const api = axios.create(
    { ...axiosConfig, adapter: cache.adapter }
  )

  api.cache = cache.store

  return api
}

export { setup, setupCache, serializeQuery }
export default { setup, setupCache, serializeQuery }
