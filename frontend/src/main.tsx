import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ApolloProvider } from "@apollo/client/react"
import { apolloClient } from "./lib/apollo"
import * as membershipsApi from "./lib/memberships"
import App from "./App.tsx"
import "./index.css"

// Devtools: after login, call window.punchbookMemberships.searchMemberships("hoa")
if (import.meta.env.DEV) {
  window.punchbookMemberships = membershipsApi
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </StrictMode>,
)

