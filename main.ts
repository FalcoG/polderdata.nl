import { municipalities, taxDescriptions, taxRates } from './lib/tax-rates/municipalities-cbs.ts'
import municipalityTaxes from './lib/tax-rates/municipalities-coelo.ts'

const MUNICIPALITY_SEARCH_ROUTE = new URLPattern({ pathname: '/api/municipality/search/:name' })
const MUNICIPALITY_TAXES_CBS_ROUTE = new URLPattern({ pathname: '/api/municipality/taxes-cbs/:id' })
const MUNICIPALITY_TAXES_ROUTE = new URLPattern({ pathname: '/api/municipality/taxes/:id' })

Deno.serve((req) => {
  const match = MUNICIPALITY_SEARCH_ROUTE.exec(req.url)

  if (match) {
    const name = match.pathname.groups.name

    const result = municipalities.value.filter((municipality) => {
      if (typeof municipality?.Title !== 'string') return false
      if (name) {
        return municipality?.Title?.toLowerCase().includes(name.toLowerCase())
      }
      return false
    })

    return new Response(JSON.stringify(result), {
      headers: {
        'content-type': 'application/json',
      },
    })
  }

  const matchTaxesRoute = MUNICIPALITY_TAXES_ROUTE.exec(req.url)

  if (matchTaxesRoute) {
    const municipalityId = matchTaxesRoute.pathname.groups.id

    const tax = municipalityTaxes.find((municipalityTax) => {
      const ID = municipalityTax[1]

      return ID === municipalityId
    })

    if (tax) {
      return new Response(JSON.stringify({
        province_code: tax[0],
        municipality_code: tax[1],
        municipality_name: tax[2],
        property_tax_rate: tax[3],
        waste_tax_single_household: tax[13],
        waste_tax_multi_household: tax[15],
        sewer_tax_single_household: tax[18],
        sewer_tax_multi_household: tax[20],
      }), {
        headers: {
          'content-type': 'application/json',
        }
      })
    } else {
      // todo: json response
      new Response('Municipality not found', { status: 404 })
    }
  }

  const matchCBSTaxesRoute = MUNICIPALITY_TAXES_CBS_ROUTE.exec(req.url)

  if (matchCBSTaxesRoute) {
    const municipalityId = matchCBSTaxesRoute.pathname.groups.id

    const foundTaxRates = taxRates.value.filter((taxRate) => {
      return taxRate.RegioS === municipalityId
    })

    return new Response(JSON.stringify({ foundTaxRates, taxDescriptions }), {
      headers: {
        'content-type': 'application/json',
      }
    })
  }

  return new Response('Page not found', { status: 404 })
})

