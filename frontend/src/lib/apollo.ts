import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core"

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_API_URL || "http://localhost:3000/graphql",
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})

