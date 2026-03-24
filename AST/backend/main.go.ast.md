# AST: `Backend/main.go`

```text
File
├── PackageClause main
├── ImportDecl (...)
├── VarDecl km *KafkaManager
├── FuncDecl init()
│   └── ExprStmt LoadEnvVariable()
├── FuncDecl main()
│   ├── IfStmt godotenv.Load() error -> log.Printf
│   ├── ExprStmt InitDatabase()
│   ├── DeferStmt CloseDatabase()
│   ├── ExprStmt InitializeRedisClient()
│   ├── AssignStmt kafka broker parsing and normalization
│   ├── AssignStmt km = NewKafkaManager(...)
│   ├── IfStmt err -> log.Fatal
│   ├── RangeStmt over regions
│   │   ├── GoStmt StartConsumer(region)
│   │   └── GoStmt StartAmbulanceConsumer(region)
│   ├── GoStmt subscription/monitor routines
│   ├── AssignStmt router := gin.Default()
│   ├── ExprStmt router.Use(setupCORS())
│   ├── ExprStmt setupSessions(router)
│   ├── ExprStmt setupRoutes(router)
│   ├── AssignStmt server := &http.Server{Addr, Handler}
│   ├── IfStmt server.ListenAndServe() error -> log.Fatalf
│   └── SelectStmt {}
├── FuncDecl setupCORS() gin.HandlerFunc
├── FuncDecl setupSessions(*gin.Engine)
└── FuncDecl setupRoutes(*gin.Engine)
```
