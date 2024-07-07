class CBS {
  #base = 'https://beta-odata4.cbs.nl/';
  #filter?: string
  #subPath: Array<string> = ['CBS']
  #selection?: string
  #queryLimit?: number
  #kv?: Deno.Kv
  #persistCache: boolean = false

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

    if (this.#selection) requestURL.searchParams.set('select', this.#selection)
    if (this.#filter) requestURL.searchParams.set('filters', this.#filter)
    if (this.#queryLimit) requestURL.searchParams.set('$top', this.#queryLimit.toString(10))

    return requestURL;
  }

  async httpRequest() {
    const response = await fetch(this.url)

    if (!response.ok) {
      throw new Error(`An error has occured: ${response.status}`);
    }

    return await response.json()
  }

  get kvStorageKey () {
    return ["cbs_odata", this.url.toString()]
  }

  cache (kv: Deno.Kv) {
    if (!kv) throw new Error('Deno Kv is required!')

    this.#persistCache = true
    this.#kv = kv

    return this
  }

  async commit() {
    if (this.#persistCache && this.#kv) {
      const entry = await this.#kv.get(this.kvStorageKey);

      if (entry.value !== null) {
        return entry.value;
      }
    }

    const object = await this.httpRequest()

    if (this.#persistCache && this.#kv) await this.#kv.set(this.kvStorageKey, object)

    return object
  }
}

export default CBS;
