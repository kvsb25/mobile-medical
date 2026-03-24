# AST: `Backend/controllers/userController.go`

```text
File
├── FuncDecl Register(c)
│   ├── VarDecl newUser Users
│   ├── IfStmt BindJSON error -> 400
│   ├── VarDecl existingUser Users
│   ├── IfStmt DB.Where(email).First success -> 409
│   ├── AssignStmt hashedPassword := bcrypt.GenerateFromPassword(...)
│   ├── IfStmt hash error -> 500
│   ├── AssignStmt newUser.Password = hashed
│   ├── IfStmt DB.Create(newUser) error -> 500
│   └── JSON 200 success
├── FuncDecl Login(c)
│   ├── VarDecl anonymous struct loginRequest
│   ├── BindJSON guard
│   ├── DB lookup by email guard
│   ├── bcrypt compare guard
│   ├── otp := GenerateAndSendOTP(email) guard
│   └── JSON 200 OTP sent
└── FuncDecl VerifyOTP(c)
    ├── VarDecl anonymous struct otpRequest
    ├── BindJSON guard
    ├── VerifyOtp(email, otp) guard
    ├── DB lookup user guard
    ├── Redis Set otp_verified:<user_id> = "verified" guard
    ├── token := GenerateJwt(...)
    └── JSON 200 with token/userType
```
