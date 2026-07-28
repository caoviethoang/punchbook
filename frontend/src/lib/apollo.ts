import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
} from "@apollo/client/core"
import { setContext } from "@apollo/client/link/context"
import { getStoredToken } from "./auth"

const authLink = setContext((_, { headers }) => {
  const token = getStoredToken()
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
})

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_API_URL || "http://localhost:3000/graphql",
})

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
})
