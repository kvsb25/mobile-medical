# Backend AST (Core App Logic)

## File: `Backend/main.go`

```text
File
├── PackageClause("main")
├── ImportDecl(...)
├── VarDecl km *KafkaManager
├── FuncDecl init()
│   └── CallExpr initiliazers.LoadEnvVariable()
├── FuncDecl main()
│   ├── IfStmt (godotenv.Load error -> log optional)
│   ├── CallExpr database.InitDatabase()
│   ├── DeferStmt database.CloseDatabase()
│   ├── CallExpr database.InitializeRedisClient()
│   ├── AssignStmt kafkaBroker from env with fallback
│   ├── AssignStmt brokers := strings.Split(...) + trim loop
│   ├── AssignStmt km, err = kafkamanager.NewKafkaManager(...)
│   ├── IfStmt err != nil -> log.Fatal
│   ├── RangeStmt over regions ["north","south"]
│   │   ├── GoStmt consumer.StartConsumer(region)
│   │   └── GoStmt consumer.StartAmbulanceConsumer(region)
│   ├── GoStmt controllers.SubscribeToPaymentUpdates()
│   ├── GoStmt controllers.SubscribeToHospitalizationUpdates()
│   ├── GoStmt controllers.SubscribeToHospitaliztionUpdates()
│   ├── GoStmt controllers.SubscribeToAppointmentUpdates()
│   ├── GoStmt controllers.CheckAppointmentsQueue()
│   ├── GoStmt controllers.SubscribeToAppointmentUpdates()
│   ├── GoStmt controllers.StartPatientCountSubscriber()
│   ├── AssignStmt router := gin.Default()
│   ├── CallExpr router.Use(setupCORS())
│   ├── CallExpr setupSessions(router)
│   ├── CallExpr setupRoutes(router)
│   ├── CompositeLit http.Server{Addr, Handler}
│   ├── CallExpr server.ListenAndServe()
│   └── SelectStmt {} (keep-alive)
├── FuncDecl setupCORS() gin.HandlerFunc
│   ├── AssignStmt config := cors.DefaultConfig()
│   ├── AssignStmt AllowOrigins/AllowHeaders/AllowMethods/AllowCredentials
│   └── ReturnStmt cors.New(config)
├── FuncDecl setupSessions(router *gin.Engine)
│   ├── AssignStmt store := cookie.NewStore(...)
│   └── CallExpr router.Use(sessions.Sessions(...))
└── FuncDecl setupRoutes(router *gin.Engine)
    ├── CallExpr routes.UserRoutes(router)
    ├── CallExpr routes.UserInfoRoutes(router)
    ├── CallExpr routes.HospitalAdmin(router, km)
    ├── CallExpr routes.StaffRoutes(router, km)
    ├── CallExpr routes.DoctorRoutes(router)
    ├── CallExpr routes.AmbulanceRoutes(router, km)
    └── CallExpr routes.HealthRoutes(router)
```

## File Group: `Backend/routes/*.go` (API wiring)

```text
Package routes
├── FuncDecl UserRoutes(engine)
│   ├── POST /register -> controllers.Register
│   ├── POST /login -> RateLimiter -> controllers.Login
│   ├── POST /verify-otp -> RateLimiter -> controllers.VerifyOTP
│   └── POST /bookAppointment -> AuthRequired(Patient) + OtpAuthRequireed -> controllers.CreateAppointment
├── FuncDecl HospitalAdmin(engine, km)
│   ├── Group "/hospitalAdmin"
│   ├── Public:
│   │   ├── POST /registerHospitalAdmin -> RegisterHospitalAdmin (inject km)
│   │   ├── POST /adminLogin -> RateLimiter -> AdminLogin
│   │   └── POST /adminOtp -> AuthRequired(Admin) -> VerifyAdminOTP
│   └── Protected(AuthRequired Admin):
│       ├── POST /AdminRegisteringHospital -> RegisterHospital (inject km)
│       ├── POST /Registerdoctor -> RegisterDoctor
│       ├── GET /getDoctorsAdmin -> GetAllDoctorsDetailsAdmin
│       ├── GET /gethospital/:id -> GetHospital
│       ├── POST /registerStaff -> RegisterStaff (inject km)
│       ├── POST /registerAmbulanceDriver -> RegisterAmbulanceDriver
│       ├── POST /registerBeds -> OtpAuthRequireed -> AddBedType
│       ├── POST /updateBeds -> OtpAuthRequireed -> UpdateTotalBeds
│       ├── GET /getBeds -> OtpAuthRequireed -> GetTotalBeds
│       ├── GET /getdoctor/:id -> OtpAuthRequireed -> GetDoctor
│       ├── POST /createAppointment -> OtpAuthRequireed -> CreateAppointment (inject km)
│       ├── POST /markAppointment/:appointment_id -> RemoveAppointmentFromQueue
│       └── GET /getRooms -> AuthRequired(Staff, Compounder) -> GetRoomAssignments
├── FuncDecl StaffRoutes(engine, km)
│   ├── Group "/compounder": login + AuthRequired(Staff, Compounder) + OTP/mark/get endpoints
│   └── Group "/receptionist": login + AuthRequired(Staff, Receptionist) + patient workflows (km-injected)
├── FuncDecl DoctorRoutes(engine)
│   └── Group "/doctor": doctorLogin + AuthRequired(Doctor) + patientAppointed
└── FuncDecl AmbulanceRoutes(engine, km)
    ├── Group "/ambulanceDriver": login + AuthRequired(AmbulanceDriver) + update/mark-available
    └── Group "/ambulances": AuthRequired(Patient) + stream/request
```

## File: `Backend/middleware/auth.go`

```text
File
├── FuncDecl AuthRequired(userType string, requiredRoles ...string) gin.HandlerFunc
│   └── ReturnStmt closure(c *gin.Context)
│       ├── Read token from Authorization or query token
│       ├── Decode JWT -> claims
│       ├── Guard claims["user_type"] == userType
│       ├── Parse claims["user_id"] and set context user_id
│       ├── If userType == Staff:
│       │   ├── Validate role in requiredRoles
│       │   └── Set context staff_id
│       ├── Resolve region from token/header/query and set context region
│       ├── Switch userType:
│       │   ├── Admin -> set admin_id
│       │   ├── AmbulanceDriver -> set driver_id
│       │   └── Doctor -> validate doctor_id+department and set context
│       └── Next()
├── FuncDecl contains(list []string, item string) bool
└── FuncDecl OtpAuthRequireed(c *gin.Context)
    ├── Extract token
    ├── Decode JWT and read user_id
    ├── Build Redis key otp_verified:<user_id>
    ├── Validate Redis value == "verified"
    └── Next()
```

## File: `Backend/middleware/rateLimmiter.go`

```text
File
└── FuncDecl RateLimiterMiddleware(limit int, duration time.Duration) gin.HandlerFunc
    └── ReturnStmt closure(c *gin.Context)
        ├── key := "rate_limit:" + c.ClientIP()
        ├── count := redis.INCR(key)
        ├── If first request -> EXPIRE(key, duration)
        ├── If count > limit:
        │   ├── Read TTL
        │   ├── Set Retry-After header
        │   └── AbortWithStatusJSON(429)
        └── Next()
```

## File Group: `Backend/controllers/*.go` (primary request workflows)

```text
Package controllers
├── userController.go
│   ├── FuncDecl Register(c)
│   │   ├── BindJSON -> Users
│   │   ├── DB existence check by email
│   │   ├── bcrypt hash password
│   │   ├── DB create user
│   │   └── JSON success
│   ├── FuncDecl Login(c)
│   │   ├── BindJSON(email/contact/password)
│   │   ├── DB lookup user by email
│   │   ├── bcrypt compare
│   │   ├── GenerateAndSendOTP(email)
│   │   └── JSON prompt for OTP verification
│   └── FuncDecl VerifyOTP(c)
│       ├── BindJSON(email, otp)
│       ├── VerifyOtp(email, otp)
│       ├── DB lookup user
│       ├── Redis SET otp_verified:<user_id> = "verified"
│       ├── GenerateJwt(user_id, Patient, ..., ...)
│       └── JSON token response
├── appointment.go
│   └── FuncDecl CreateAppointment(c)
│       ├── Read km from context and type-assert KafkaManager
│       ├── BindJSON(Appointment)
│       ├── Resolve region from context and region-specific DB
│       ├── Validate doctor and patient existence
│       ├── Build appointment payload
│       ├── Marshal JSON
│       ├── Switch by region -> SendHospitalRegistrationMessage(topic="appointment_reg")
│       └── JSON created response
└── ambulance.go
    ├── ConstDecl ambulanceMetaKeyPrefix/ambulanceGeoKeyPrefix/defaultSSEIntervalSec
    ├── TypeDecl ambulanceUpdatePayload
    ├── FuncDecl RegisterAmbulanceDriver(c)
    │   ├── BindJSON + admin/region context resolution
    │   ├── Resolve hospital by admin
    │   ├── Hash password
    │   ├── Create driver record
    │   └── JSON created
    ├── FuncDecl AmbulanceDriverLogin(c)
    │   ├── BindJSON + region DB
    │   ├── Credential verification
    │   ├── JWT generation (role=Driver)
    │   └── JSON token payload
    ├── FuncDecl UpdateAmbulanceState(c)
    │   ├── Resolve km from context
    │   ├── BindJSON(payload)
    │   ├── Validate driver identity and occupancy
    │   ├── Marshal update message
    │   └── Kafka send via SendAmbulanceLocationMessage
    ├── FuncDecl RequestAmbulance(c)
    │   ├── BindJSON(lat,lng,radius)
    │   ├── nearestAvailableAmbulance(...)
    │   ├── Mark selected ambulance occupied in Redis metadata
    │   └── JSON assigned ambulance
    ├── FuncDecl MarkAmbulanceAvailable(c)
    │   ├── Resolve region+driver context
    │   ├── Load metadata from Redis
    │   ├── Set occupancy=available, requestStatus=closed, refresh lastSeen
    │   └── Persist and return success
    ├── FuncDecl StreamNearbyAmbulances(c)
    │   ├── Parse region/lat/lng/radius/interval
    │   ├── Set SSE headers
    │   └── Stream loop:
    │       ├── getNearbyAvailableAmbulances(...)
    │       ├── Marshal payload
    │       ├── SSEvent("ambulances", payload)
    │       └── Sleep(interval)
    ├── TypeDecl ambulanceMeta
    ├── FuncDecl getNearbyAvailableAmbulances(region, lat, lng, radiusKm)
    │   ├── Redis GEORADIUS
    │   ├── HGET metadata per candidate
    │   ├── Filter occupancy/staleness
    │   └── Return list
    └── FuncDecl nearestAvailableAmbulance(...)
        ├── Delegate to getNearbyAvailableAmbulances
        └── Return first result or error
```
