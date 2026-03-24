# AST: `frontend/src/main.jsx`

```text
Program
├── ImportDeclaration default React from "react"
├── ImportDeclaration default ReactDOM from "react-dom/client"
├── ImportDeclaration default App from "./App.jsx"
├── ImportDeclaration side-effect "./index.css"
├── ImportDeclaration named { AuthProvider } from "./context/AuthProvider.jsx"
└── ExpressionStatement
    └── CallExpression
        ├── callee: MemberExpression
        │   ├── object: CallExpression ReactDOM.createRoot(...)
        │   │   └── args[0]: CallExpression document.getElementById("root")
        │   └── property: render
        └── args[0]: JSXElement <React.StrictMode>
            └── JSXElement <AuthProvider>
                └── JSXElement <App />
```
