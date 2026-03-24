# AST: `Backend/routes/*.go`

```text
Package routes
├── FuncDecl UserRoutes(engine)
│   ├── POST /register -> Register
│   ├── POST /login -> RateLimiterMiddleware(...) -> Login
│   ├── POST /verify-otp -> RateLimiterMiddleware(...) -> VerifyOTP
│   └── POST /bookAppointment -> AuthRequired("Patient") -> OtpAuthRequireed -> CreateAppointment
├── FuncDecl HospitalAdmin(engine, km)
│   ├── Group "/hospitalAdmin"
│   ├── Route registrations with inline closures injecting km via c.Set("km", km)
│   ├── Middleware: AuthRequired("Admin", "")
│   └── Nested route set for admin workflows (hospital, staff, doctor, beds, appointment ops)
├── FuncDecl StaffRoutes(engine, km)
│   ├── Group "/compounder" + AuthRequired("Staff", "Compounder")
│   └── Group "/receptionist" + AuthRequired("Staff", "Receptionist")
├── FuncDecl DoctorRoutes(engine)
│   └── Group "/doctor" + AuthRequired("Doctor", "")
└── FuncDecl AmbulanceRoutes(engine, km)
    ├── Group "/ambulanceDriver" + AuthRequired("AmbulanceDriver", "")
    └── Group "/ambulances" + AuthRequired("Patient", "")
```
