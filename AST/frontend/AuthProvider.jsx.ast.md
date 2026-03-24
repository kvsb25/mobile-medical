# AST: `frontend/src/context/AuthProvider.jsx`

```text
Program
├── ImportDeclaration { createContext, useContext, useState }
├── VariableDeclaration const AuthContext = createContext()
├── ExportNamedDeclaration const AuthProvider = ({ children }) => ArrowFunctionBody
│   ├── VariableDeclaration useState(authToken from localStorage)
│   ├── VariableDeclaration useState(region from localStorage)
│   ├── VariableDeclaration useState(user lazy initializer parsing localStorage user)
│   ├── VariableDeclaration const login = (token, userDetails, region) => BlockStatement
│   │   ├── role = localStorage.getItem("role")
│   │   ├── setAuthToken(token), setUser({...userDetails, role}), setRegion(region)
│   │   └── persist jwtToken/region/user in localStorage
│   ├── VariableDeclaration const logout = () => BlockStatement
│   │   ├── setAuthToken(null), setUser(null), setRegion(null)
│   │   └── remove jwtToken/region/user/role from localStorage
│   ├── VariableDeclaration const headers = ObjectExpression
│   └── ReturnStatement
│       └── JSXElement <AuthContext.Provider value={{ authToken, user, region, login, logout, headers, isAuthenticated }}>
│           └── JSXExpression {children}
└── ExportNamedDeclaration const useAuth = () => useContext(AuthContext)
```
