export type TODataValueType = string | number | null

export type TODataEntry = {
  [key: string]: TODataValueType
}

export interface TODataResponseBody {
  ['@odata.context']: string
  value: Array<TODataEntry>
}
