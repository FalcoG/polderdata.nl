import CBS from '../CBS.ts'

//https://beta-odata4.cbs.nl/CBS/83642NED
//https://beta-odata4.cbs.nl/CBS/83642NED/RegioSCodes
//https://beta-odata4.cbs.nl/CBS/83642NED/Observations?$top=100&filter=Measure%20eq%20%27M001178_2%27%20and%20(GemeentelijkeHeffingenVanaf2017%20eq%20%27A047006%27%20or%20GemeentelijkeHeffingenVanaf2017%20eq%20%27A047007%27)%20and%20ValueAttribute%20ne%20%27Impossible%27

//https://beta-odata4.cbs.nl/CBS/83642NED/Observations?$top=100&filter=Measure eq 'M001178_2' and (GemeentelijkeHeffingenVanaf2017 eq 'A047006' or GemeentelijkeHeffingenVanaf2017 eq 'A047007') and ValueAttribute ne 'Impossible'
//https://beta-odata4.cbs.nl/CBS/83642NED/GemeentelijkeHeffingenVanaf2017Codes
//https://opendata.cbs.nl/statline/#/CBS/nl/dataset/83642NED/table?ts=1720285525370
//https://opendata.cbs.nl/ODataApi/odata/83642NED/TableInfos
//https://docs.oasis-open.org/odata/odata/v4.0/errata03/os/complete/part2-url-conventions/odata-v4.0-errata03-os-part2-url-conventions-complete.html#_Toc453752358
//https://github.com/statistiekcbs/CBS-Open-Data-v4/blob/master/Python/time_series_graph.py

const kv = await Deno.openKv()

export const provinces = await new CBS('83642NED')
  .path('RegioSGroups')
  .select('ParentId', 'Id', 'Title')
  .filter(`ParentId eq 'GMPV'`)
  .cache(kv)
  .commit()

export const municipalities = await new CBS('83642NED')
  .path('RegioSCodes')
  .select('Identifier', 'Title', 'Description', 'DimensionGroupId')
  .cache(kv)
  .commit()

export const taxDescriptions = await new CBS('83642NED')
  .path('GemeentelijkeHeffingenVanaf2017Codes')
  .select('Identifier', 'Title', 'Description')
  .cache(kv)
  .commit()

export const taxRates = await new CBS('83642NED')
  .path('Observations')
  .select('Id', 'Measure', 'Value', 'GemeentelijkeHeffingenVanaf2017', 'RegioS', 'Perioden')
  .filter(`
  Measure eq 'M001178_2'
  and (
    GemeentelijkeHeffingenVanaf2017 eq 'A047000' or
    GemeentelijkeHeffingenVanaf2017 eq 'A047006' or
    GemeentelijkeHeffingenVanaf2017 eq 'A047007'
  )
  `)
  .cache(kv, 'Id')
  .commit()

console.log('municipalities', municipalities)

console.log(provinces)
console.log('taxes', taxDescriptions)
