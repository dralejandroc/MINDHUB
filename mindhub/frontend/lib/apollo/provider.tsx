'use client'

import { ApolloProvider } from '@apollo/client'
import { ReactNode } from 'react'
import client from './client'

interface GraphQLProviderProps {
  children: ReactNode
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  )
}