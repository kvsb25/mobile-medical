# AST: `Backend/middleware/rateLimmiter.go`

```text
File
└── FuncDecl RateLimiterMiddleware(limit int, duration time.Duration) gin.HandlerFunc
    └── Return closure(c)
        ├── client := database.GetRedisClient()
        ├── ip := c.ClientIP()
        ├── key := "rate_limit:" + ip
        ├── count := client.Incr(key)
        ├── IfStmt count == 1 -> client.Expire(key, duration)
        ├── IfStmt count > limit
        │   ├── ttl := client.TTL(key)
        │   ├── c.Header("Retry-After", ...)
        │   └── c.AbortWithStatusJSON(429, ...)
        └── c.Next()
```
