# AST: `frontend/src/App.jsx`

```text
Program
├── ImportDeclaration (router primitives)
├── ImportDeclaration (page components)
├── ImportDeclaration RoutesPathName
├── ImportDeclaration PrivateRoute
├── VariableDeclaration const router
│   └── CallExpression createBrowserRouter(RouteObject[])
│       └── ArrayExpression
│           ├── ObjectExpression { path: "/", element: <LandingPage /> }
│           ├── ObjectExpression { path: SIGNUP_PAGE, element: <Register /> }
│           ├── ObjectExpression { path: LOGIN_PAGE, element: <Login /> }
│           ├── ObjectExpression { path: LoginOTPVerification_Page, element: <LoginOTPVerification /> }
│           ├── ObjectExpression protected: <PrivateRoute><Dashboard /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><RegisterDoctor /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><RegisterHospital /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><RegisterStaff /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><AddBeds /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><UpdateBeds /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><PatientRegistration /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><PatientHospitalise /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><CreateAppointment /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><Doctors /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><Patients /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><RemoveAppointment /></PrivateRoute>
│           ├── ObjectExpression protected: <PrivateRoute><MarkAppointment /></PrivateRoute>
│           ├── ObjectExpression role-scoped: allowedRoles=["Patient"] -> <NearbyAmbulances />
│           └── ObjectExpression role-scoped: allowedRoles=["AmbulanceDriver"] -> <AmbulanceDriverDashboard />
├── FunctionDeclaration App
│   └── ReturnStatement JSXElement <RouterProvider router={router} />
└── ExportDefaultDeclaration App
```
