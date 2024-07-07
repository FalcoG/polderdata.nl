export interface TResponseOData {
  ['@odata.context']: string
  value: Array<{
    [key: string]: string | number | null
  }>
}
