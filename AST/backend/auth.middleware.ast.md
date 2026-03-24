# AST: `Backend/middleware/auth.go`

```text
File
├── FuncDecl AuthRequired(userType string, requiredRoles ...string) gin.HandlerFunc
│   └── Return closure(c)
│       ├── token resolution (header/query)
│       ├── JWT decode
│       ├── user_type guard
│       ├── user_id extraction + context set
│       ├── Staff role validation (variadic requiredRoles)
│       ├── region resolution from claims/header/query
│       ├── SwitchStmt userType
│       │   ├── case Admin -> set admin_id
│       │   ├── case AmbulanceDriver -> set driver_id
│       │   └── case Doctor -> validate doctor_id/department and set context
│       └── Next()
├── FuncDecl contains(list []string, item string) bool
└── FuncDecl OtpAuthRequireed(c)
    ├── token extraction
    ├── DecodeJwt(trim "Bearer ")
    ├── user_id extraction
    ├── Redis GET otp_verified:<id>
    ├── guard value == "verified"
    └── Next()
```
