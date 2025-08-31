import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  // Supabase GraphQL endpoint  
  schema: [
    {
      'https://jvbcpldzoyicefdtnwkd.supabase.co/graphql/v1': {
        headers: {
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDE0NzAsImV4cCI6MjA3MDk3NzQ3MH0.st42ODkomKcaTcT88Xqc3LT_Zo9oVWhkCVwCP07n4NY',
          'Content-Type': 'application/json',
        },
      },
    },
  ],
  documents: ['lib/apollo/queries/**/*.ts', 'lib/apollo/mutations/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    './lib/apollo/types/generated.ts': {
      plugins: [
        'typescript',
        'typescript-operations', 
        'typescript-react-apollo'
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        scalars: {
          UUID: 'string',
          Date: 'string',
          DateTime: 'string',
          JSON: 'any',
          BigInt: 'number',
        },
      },
    },
    './lib/apollo/types/schema.json': {
      plugins: ['introspection'],
    },
  },
}

export default config