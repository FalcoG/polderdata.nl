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
  #startLine = 0
  #kv?: Deno.Kv
  #cacheColumn?: number

  constructor (fileName: string) {
    this.#fileName = fileName
  }

  startLine (index: number) {
    this.#startLine = index

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

    const file = await Deno.open(this.#fileName)

    for await (const row of readCSV(file, {
      ...options,
      fromLine: this.#startLine,
    })) {
      const cellArray = []
      for await (const cell of row) {
        cellArray.push(cell)
      }

      const entryKey = cellArray[this.#cacheColumn]
      await this.#kv.set([this.#fileName, 'entries', entryKey], cellArray)
    }

    return true
  }

  async commit (): Promise<TTable> {
    if (!this.#kv) throw new Error('Deno Kv is required due to lazy programming')

    const list = this.#kv.list<TRow>({ prefix: [this.#fileName, 'entries'] })

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
