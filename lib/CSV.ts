import { readCSV } from 'jsr:@vslinko/csv'

const options = {
  columnSeparator: '\t',
  lineSeparator: '\r\n',
  quote: '$',
}

type TCell = string
type TRow = Array<TCell>
type TTable = Array<TRow>

class CSV {
  readonly #fileName: string
  #cacheKey?: string
  #startLine = 0
  #stopLine?: number
  #kv?: Deno.Kv
  #cacheColumn?: number

  constructor (fileName: string) {
    this.#fileName = fileName
  }

  startLine (index: number) {
    this.#startLine = index

    return this
  }

  stopLine (index: number) {
    this.#stopLine = index

    return this
  }

  cache (kv: Deno.Kv, cacheRow: number) {
    this.#kv = kv
    this.#cacheColumn = cacheRow

    return this
  }

  async #fileToCache () {
    if (!this.#kv) throw new Error('Deno Kv is required due to lazy programming')
    if (!this.#cacheColumn) throw new Error('A specific column')
    if (!this.#cacheKey) throw new Error('A generated cache key could not be found')

    const file = await Deno.open(this.#fileName)

    for await (const row of readCSV(file, {
      ...options,
      fromLine: this.#startLine,
      toLine: this.#stopLine
    })) {
      const cellArray = []
      for await (const cell of row) {
        cellArray.push(cell)
      }

      const entryKey = cellArray[this.#cacheColumn]
      const storageEntryKey = entryKey !== '' ? entryKey : crypto.randomUUID()
      await this.#kv.set([this.#cacheKey, 'entries', storageEntryKey], cellArray)
    }

    return true
  }

  async commit (): Promise<TTable> {
    this.#cacheKey = [this.#fileName, this.#cacheColumn, this.#startLine, this.#stopLine].join('+')
    if (!this.#kv) throw new Error('Deno Kv is required due to lazy programming')

    const list = this.#kv.list<TRow>({ prefix: [this.#cacheKey, 'entries'] })

    const records: TTable = []

    // load values from Kv
    for await (const res of list) {
      records.push(res.value)
    }

    // get from file, then repeat read from cache attempt
    if (records.length === 0) {
      await this.#fileToCache()
      return await this.commit()
    }

    return records
  }
}

export default CSV
