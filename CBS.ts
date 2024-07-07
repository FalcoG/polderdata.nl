import { TResponseOData } from './OData.ts'

class CBS {
  #base = 'https://beta-odata4.cbs.nl/';
  #filter?: string
  #subPath: Array<string> = ['CBS']
  #selection?: string
  #queryLimit?: number
  #kv?: Deno.Kv
  #persistCache: boolean = false
  #persistCacheItemKey?: string

  constructor(datasetID: string) {
    this.#subPath.push(datasetID)
  }

  path (relativePath: string) {
    this.#subPath.push(relativePath);

    return this;
  }

  filter (query: string) {
    if (this.#filter)
      throw new Error('Only one query is allowed, consider combining the conditions.')

    this.#filter = query

    return this;
  }

  limit (number: number) {
    this.#queryLimit = number;
    return this;
  }

  select (...args: Array<string>) {
    this.#selection = args.join(',')

    return this;
  }

  get url() {
    const requestURL = URL.parse(this.#subPath.join('/'), new URL(this.#base))

    if (!requestURL)
      throw new Error('Unable to parse URL')

    if (this.#filter) requestURL.searchParams.set('filter', this.#filter)
    if (this.#selection) requestURL.searchParams.set('select', this.#selection)
    if (this.#queryLimit) requestURL.searchParams.set('$top', this.#queryLimit.toString(10))

    return requestURL;
  }

  async httpRequest() {
    const response = await fetch(this.url)

    if (!response.ok) {
      throw new Error(`An error has occured: ${response.status}`);
    }

    return await response.json() as TResponseOData
  }

  get kvStorageKey () {
    return ["cbs_odata", this.url.toString()]
  }

  cache (kv: Deno.Kv, cacheItemKey?: string) {
    if (!kv) throw new Error('Deno Kv is required!')

    this.#persistCache = true
    this.#persistCacheItemKey = cacheItemKey
    this.#kv = kv

    return this
  }

  async commit() {
    if (this.#persistCache && this.#kv) {
      const entry = await this.#kv.get(this.kvStorageKey);

      if (entry.value !== null) {
        return entry.value;
      } else {
        const records = this.#kv.list({ prefix: this.kvStorageKey });
        const municipalities = [];
        for await (const res of records) {
          municipalities.push(res.value);
        }

        if (municipalities.length > 0) return municipalities;
      }
    }

    const object = await this.httpRequest()

    /**
     *   resultObject.value.forEach(async (item: {[key: string]: string}) => {
     *     const key = ["municipalities", item.Identifier]
     *
     *     await kv.set(key, item)
     *   })
     */
    if (this.#persistCache && this.#kv) {
      if (this.#persistCacheItemKey) {
        for await (const item of object.value) {
          const localKey = item[this.#persistCacheItemKey]

          if (localKey === null) return console.warn('Local key not found; unable to cache entry')

          const key = [...this.kvStorageKey, localKey]
          await this.#kv.set(key, item)
        }
      } else {
        await this.#kv.set(this.kvStorageKey, object)
      }
    }

    return object
  }
}

export default CBS;
