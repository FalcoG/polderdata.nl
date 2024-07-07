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
      // todo: readable json response? or keep raw cell layout?
      return new Response(JSON.stringify(tax), {
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

