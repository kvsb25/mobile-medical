# AST: `frontend/src/context/PrivateRoute.jsx`

```text
Program
├── ImportDeclaration RoutesPathName
├── ImportDeclaration Navigate
├── ImportDeclaration useAuth
└── ExportDefaultDeclaration FunctionDeclaration PrivateRoute({ children, allowedRoles = [] })
    ├── VariableDeclaration authToken from useAuth()
    ├── VariableDeclaration role from localStorage
    ├── IfStatement !authToken
    │   └── Return <Navigate to={LOGIN_PAGE} replace />
    ├── IfStatement allowedRoles.length > 0 && !allowedRoles.includes(role)
    │   └── Return <Navigate to={DASHBOARD_PAGE} replace />
    └── Return children
```
