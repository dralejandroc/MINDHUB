import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { createClient } from '@/lib/supabase/client'
import { GRAPHQL_CONFIG, CACHE_CONFIG } from '@/lib/config/graphql-endpoints'

// Pure GraphQL endpoint - no REST API dependencies
const httpLink = createHttpLink({
  uri: GRAPHQL_CONFIG.ENDPOINT,
})

// Auth link que agrega headers de autenticación
const authLink = setContext(async (_, { headers }) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  return {
    headers: {
      ...headers,
      'Authorization': session ? `Bearer ${session.access_token}` : '',
      ...GRAPHQL_CONFIG.HEADERS,
    },
  }
})

// Pure GraphQL Apollo Client - no REST API dependencies
const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(CACHE_CONFIG),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
})

export default client
export { client }