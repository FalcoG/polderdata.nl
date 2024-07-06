class CBS {
  #base = 'https://beta-odata4.cbs.nl/';
  #filter?: string
  #subPath: Array<string> = ['CBS']
  #selection?: string
  #queryLimit?: number

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

  commit() {
    return fetch(this.url)
  }
}

export default CBS;
