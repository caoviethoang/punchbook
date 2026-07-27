import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ApolloProvider } from "@apollo/client/react"
import { apolloClient } from "./lib/apollo"
import App from "./App.tsx"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </StrictMode>,
)

