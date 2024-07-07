import { municipalities } from './lib/tax-rates/municipalities.ts'

const MUNICIPALITY_SEARCH_ROUTE = new URLPattern({ pathname: '/api/municipality/search/:name' })

Deno.serve((req) => {
  const match = MUNICIPALITY_SEARCH_ROUTE.exec(req.url)

  if (match) {
    const name = match.pathname.groups.name

    const result = municipalities.value.filter((municipality) => {
      if (typeof municipality?.Title !== 'string') return false
      if (name) {
        return municipality?.Title?.includes(name)
      }
      return false
    })

    return new Response(JSON.stringify(result), {
      headers: {
        'content-type': 'application/json',
      },
    })
  }

  return new Response(JSON.stringify(municipalities), {
    headers: {
      'content-type': 'application/json',
    },
  })
})

