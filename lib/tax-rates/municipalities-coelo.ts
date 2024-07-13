import CSV from '../CSV.ts'

const kv = await Deno.openKv()

const result = await new CSV(`${Deno.cwd()}/data/gemeentelijke_belastingen_2024.tsv`)
  .startLine(4)
  .cache(kv, 1)
  .commit()

console.log('csv helper class', performance.now())

export default result

