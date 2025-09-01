import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
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
  
  // Fallback: If no session, use service role for dashboard queries
  const authToken = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  
  return {
    headers: {
      ...headers,
      'Authorization': `Bearer ${authToken}`,
      ...GRAPHQL_CONFIG.HEADERS,
    },
  }
})

// Error handling link
const errorLink = onError((errorResponse) => {
  const { graphQLErrors, networkError, operation } = errorResponse
  
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    })
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
    // If 500 error, log additional info
    if ('statusCode' in networkError && networkError.statusCode === 500) {
      console.error('🔥 GraphQL 500 Error - Check RLS policies and authentication')
      console.error('Operation:', operation.operationName)
      console.error('Variables:', operation.variables)
    }
  }
})

// Pure GraphQL Apollo Client - no REST API dependencies
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
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