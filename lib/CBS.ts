import { TODataEntry, TODataValueType, TODataResponseBody } from './OData.ts'

class CBS {
  #base = 'https://beta-odata4.cbs.nl/'
  #filter?: string
  #subPath: Array<string> = ['CBS']
  #selection?: string
  #queryLimit?: number
  #kv?: Deno.Kv
  #persistCache: boolean = false
  #persistCacheItemKey?: string

  constructor (datasetID: string) {
    this.#subPath.push(datasetID)
  }

  path (relativePath: string) {
    this.#subPath.push(relativePath)

    return this
  }

  filter (query: string) {
    if (this.#filter)
      throw new Error('Only one query is allowed, consider combining the conditions.')

    this.#filter = query

    return this
  }

  limit (number: number) {
    this.#queryLimit = number
    return this
  }

  select (...args: Array<string>) {
    this.#selection = args.join(',')

    return this
  }

  get url () {
    const requestURL = URL.parse(this.#subPath.join('/'), new URL(this.#base))

    if (!requestURL)
      throw new Error('Unable to parse URL')

    if (this.#filter) requestURL.searchParams.set('filter', this.#filter)
    if (this.#selection) requestURL.searchParams.set('select', this.#selection)
    if (this.#queryLimit) requestURL.searchParams.set('$top', this.#queryLimit.toString(10))

    return requestURL
  }

  async httpRequest () {
    const response = await fetch(this.url)

    if (!response.ok) {
      throw new Error(`An error has occured: ${response.status}`)
    }

    return await response.json() as TODataResponseBody
  }

  get kvStorageKey () {
    return ['cbs_odata', this.url.toString()]
  }

  cache (kv: Deno.Kv, cacheItemKey?: string) {
    if (!kv) throw new Error('Deno Kv is required!')

    this.#persistCache = true
    this.#persistCacheItemKey = cacheItemKey
    this.#kv = kv

    return this
  }

  async commit (): Promise<TODataResponseBody> {
    if (this.#persistCache && this.#kv) {
      const entry = await this.#kv.get(this.kvStorageKey)

      if (entry.value !== null) {
        return entry.value as TODataResponseBody
      } else {
        const records = this.#kv.list<TODataEntry>({ prefix: [...this.kvStorageKey, 'values'] })
        const recordsArray: Array<TODataEntry> = []

        // restore values part
        for await (const res of records) {
          recordsArray.push(res.value)
        }

        // restore metadata part
        const recordMetaData = await this.#kv.get<
          Omit<TODataResponseBody, 'value'>
        >([...this.kvStorageKey, 'meta'])

        // combine values and metadata to form an OData response
        if (recordsArray.length > 0 && recordMetaData.value !== null) return {
          ...recordMetaData.value,
          value: recordsArray
        }
      }
    }

    const object = await this.httpRequest()

    if (this.#persistCache && this.#kv) {
      if (this.#persistCacheItemKey) {
        const { value, ...remainder } = object

        // split the object up due to size constraints
        for await (const item of value) {
          const localKey = item[this.#persistCacheItemKey]

          if (localKey === null) throw new Error('Local key not found; unable to cache entry') // todo: probably delete partial cache

          const key = [...this.kvStorageKey, 'values', localKey]
          await this.#kv.set(key, item)
        }

        await this.#kv.set([...this.kvStorageKey, 'meta'], remainder)

      } else {
        // set complete object, beware of size constraints.
        await this.#kv.set(this.kvStorageKey, object)
      }
    }

    return object
  }
}

export default CBS
