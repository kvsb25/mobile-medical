# Frontend AST (Core App Logic)

## File: `frontend/src/main.jsx`

```text
Program
├── ImportDeclaration("react")
├── ImportDeclaration("react-dom/client")
├── ImportDeclaration("./App.jsx")
├── ImportDeclaration("./index.css")
├── ImportDeclaration("./context/AuthProvider.jsx")
└── ExpressionStatement
    └── CallExpression ReactDOM.createRoot(...).render(...)
        └── JSXElement <React.StrictMode>
            └── JSXElement <AuthProvider>
                └── JSXElement <App />
```

## File: `frontend/src/App.jsx`

```text
Program
├── ImportDeclaration("react-router-dom")
├── ImportDeclaration("./pages/*")
├── ImportDeclaration("./constants")
├── ImportDeclaration("./context/PrivateRoute")
├── VariableDeclaration const router = createBrowserRouter([...])
│   └── ArrayExpression (RouteObject[])
│       ├── RouteObject(path="/", element=<LandingPage />)
│       ├── RouteObject(path=SIGNUP_PAGE, element=<Register />)
│       ├── RouteObject(path=LOGIN_PAGE, element=<Login />)
│       ├── RouteObject(path=LoginOTPVerification_Page, element=<LoginOTPVerification />)
│       ├── RouteObject(path=DASHBOARD_PAGE, element=<PrivateRoute><Dashboard /></PrivateRoute>)
│       ├── RouteObject(path=REGISTER_DOC, element=<PrivateRoute><RegisterDoctor /></PrivateRoute>)
│       ├── RouteObject(path=REGISTER_HOSPITAL, element=<PrivateRoute><RegisterHospital /></PrivateRoute>)
│       ├── RouteObject(path=REGISTER_STAFF, element=<PrivateRoute><RegisterStaff /></PrivateRoute>)
│       ├── RouteObject(path=ADD_BED, element=<PrivateRoute><AddBeds /></PrivateRoute>)
│       ├── RouteObject(path=UPDATE_BED, element=<PrivateRoute><UpdateBeds /></PrivateRoute>)
│       ├── RouteObject(path=PATIENT_REGISTER, element=<PrivateRoute><PatientRegistration /></PrivateRoute>)
│       ├── RouteObject(path=PATIENT_HOSPITALISE, element=<PrivateRoute><PatientHospitalise /></PrivateRoute>)
│       ├── RouteObject(path=CREATE_APPOINTMENT, element=<PrivateRoute><CreateAppointment /></PrivateRoute>)
│       ├── RouteObject(path=GET_DOCTORS, element=<PrivateRoute><Doctors /></PrivateRoute>)
│       ├── RouteObject(path=GET_PATIENTS, element=<PrivateRoute><Patients /></PrivateRoute>)
│       ├── RouteObject(path=REMOVE_APPOINTMENT, element=<PrivateRoute><RemoveAppointment /></PrivateRoute>)
│       ├── RouteObject(path=MARK_APPOINTMENT, element=<PrivateRoute><MarkAppointment /></PrivateRoute>)
│       ├── RouteObject(path=AMBULANCE_NEARBY_PAGE,
│       │   element=<PrivateRoute allowedRoles={["Patient"]}><NearbyAmbulances /></PrivateRoute>)
│       └── RouteObject(path=AMBULANCE_DRIVER_DASHBOARD,
│           element=<PrivateRoute allowedRoles={["AmbulanceDriver"]}><AmbulanceDriverDashboard /></PrivateRoute>)
├── FunctionDeclaration App()
│   └── ReturnStatement
│       └── JSXElement <RouterProvider router={router} />
└── ExportDefaultDeclaration App
```

## File: `frontend/src/context/AuthProvider.jsx`

```text
Program
├── ImportDeclaration("react")
├── VariableDeclaration const AuthContext = createContext()
├── ExportNamedDeclaration const AuthProvider = ({ children }) => { ... }
│   ├── VariableDeclaration [authToken, setAuthToken] = useState(localStorage.getItem("jwtToken"))
│   ├── VariableDeclaration [region, setRegion] = useState(localStorage.getItem("region"))
│   ├── VariableDeclaration [user, setUser] = useState(() => { ...localStorage user hydrate... })
│   ├── VariableDeclaration const login = (token, userDetails, region) => { ...persist auth/session... }
│   ├── VariableDeclaration const logout = () => { ...clear auth/session... }
│   ├── VariableDeclaration const headers = { "Content-Type": "application/json", Authorization: authToken }
│   └── ReturnStatement
│       └── JSXElement <AuthContext.Provider value={{ authToken, user, region, login, logout, headers, isAuthenticated }}>
│           └── JSXExpression {children}
└── ExportNamedDeclaration const useAuth = () => useContext(AuthContext)
```

## File: `frontend/src/context/PrivateRoute.jsx`

```text
Program
├── ImportDeclaration("../constants")
├── ImportDeclaration("react-router-dom")
├── ImportDeclaration("./AuthProvider")
└── ExportDefaultDeclaration FunctionDeclaration PrivateRoute({ children, allowedRoles = [] })
    ├── VariableDeclaration const { authToken } = useAuth()
    ├── VariableDeclaration const role = localStorage.getItem("role")
    ├── IfStatement (!authToken)
    │   └── ReturnStatement <Navigate to={LOGIN_PAGE} replace />
    ├── IfStatement (allowedRoles.length > 0 && !allowedRoles.includes(role))
    │   └── ReturnStatement <Navigate to={DASHBOARD_PAGE} replace />
    └── ReturnStatement children
```
