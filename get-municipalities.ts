import CBS from './CBS.ts'

//https://beta-odata4.cbs.nl/CBS/83642NED
//https://beta-odata4.cbs.nl/CBS/83642NED/RegioSCodes
//https://beta-odata4.cbs.nl/CBS/83642NED/Observations?$top=100&filter=Measure%20eq%20%27M001178_2%27%20and%20(GemeentelijkeHeffingenVanaf2017%20eq%20%27A047006%27%20or%20GemeentelijkeHeffingenVanaf2017%20eq%20%27A047007%27)%20and%20ValueAttribute%20ne%20%27Impossible%27

//https://beta-odata4.cbs.nl/CBS/83642NED/Observations?$top=100&filter=Measure eq 'M001178_2' and (GemeentelijkeHeffingenVanaf2017 eq 'A047006' or GemeentelijkeHeffingenVanaf2017 eq 'A047007') and ValueAttribute ne 'Impossible'
//https://beta-odata4.cbs.nl/CBS/83642NED/GemeentelijkeHeffingenVanaf2017Codes
//https://opendata.cbs.nl/statline/#/CBS/nl/dataset/83642NED/table?ts=1720285525370
//https://opendata.cbs.nl/ODataApi/odata/83642NED/TableInfos
//https://docs.oasis-open.org/odata/odata/v4.0/errata03/os/complete/part2-url-conventions/odata-v4.0-errata03-os-part2-url-conventions-complete.html#_Toc453752358
//https://github.com/statistiekcbs/CBS-Open-Data-v4/blob/master/Python/time_series_graph.py


// const result = await new CBS('83642NED')
//   .path('Observations')
//   .filter(`Measure eq 'M001178_2'`)
//   .limit(100)
//   .commit()

// inner join?!
// https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_SystemQueryOptionexpand
// const kv = await Deno.openKv();
//
// const records = kv.list({ prefix: ["municipalities"] });
// const municipalities = [];
// for await (const res of records) {
//   municipalities.push(res.value);
// }

// if (municipalities.length) {
//   console.log('result', municipalities);
//   console.log(performance.now())
//   Deno.exit()
// }

const kv = await Deno.openKv();

const provinces = await new CBS('83642NED')
  .path('RegioSGroups')
  .select('ParentId', 'Id', 'Title')
  .filter(`ParentId eq 'GMPV'`)
  .cache(kv)
  .commit()

const municipalities = await new CBS('83642NED')
  .path('RegioSCodes')
  .select('Identifier', 'Title', 'Description', 'DimensionGroupId')
  .cache(kv)
  .commit()

const resultObject = await municipalities
console.log('municipalities', resultObject)

console.log(provinces)
