# AST: `Backend/controllers/ambulance.go`

```text
File
├── ConstDecl (ambulanceMetaKeyPrefix, ambulanceGeoKeyPrefix, defaultSSEIntervalSec)
├── TypeDecl ambulanceUpdatePayload struct
├── FuncDecl RegisterAmbulanceDriver(c)
│   ├── BindJSON(req) guard
│   ├── admin_id/region context resolution
│   ├── region DB resolution
│   ├── hospital lookup by admin_id
│   ├── password hashing
│   ├── driver struct construction
│   ├── DB create(driver) guard
│   └── JSON 201
├── FuncDecl AmbulanceDriverLogin(c)
│   ├── BindJSON(req) guard
│   ├── region DB resolution
│   ├── driver lookup by email
│   ├── bcrypt compare
│   ├── token generation
│   └── JSON 200 token payload
├── FuncDecl UpdateAmbulanceState(c)
│   ├── km context resolution + type assertion
│   ├── BindJSON(payload) guard
│   ├── region/user_id context reads
│   ├── driver identity match guard
│   ├── occupancy enum guard
│   ├── msg map creation + json.Marshal
│   ├── km.SendAmbulanceLocationMessage(region, raw) guard
│   └── JSON 200
├── FuncDecl RequestAmbulance(c)
│   ├── BindJSON(req) guard
│   ├── region context read + radius normalization
│   ├── nearestAvailableAmbulance(...) guard
│   ├── Redis metadata update to accepted/occupied
│   └── JSON assigned ambulance
├── FuncDecl MarkAmbulanceAvailable(c)
│   ├── region/driver context read
│   ├── Redis HGet meta by driver
│   ├── json.Unmarshal(meta) guard
│   ├── mutate occupancy/requestStatus/lastSeen
│   ├── Redis HSet updated meta
│   └── JSON 200
├── FuncDecl StreamNearbyAmbulances(c)
│   ├── query/context parsing for region/lat/lng/radius/interval
│   ├── response SSE headers
│   └── c.Stream(loop)
│       ├── getNearbyAvailableAmbulances(...)
│       ├── json.Marshal payload
│       ├── c.SSEvent("ambulances", payload)
│       └── time.Sleep(interval)
├── TypeDecl ambulanceMeta struct
├── FuncDecl getNearbyAvailableAmbulances(region, lat, lng, radiusKm)
│   ├── Redis GEORADIUS query
│   ├── loop over entries -> HGET metadata
│   ├── unmarshal + filter occupancy + stale pruning
│   └── return []ambulanceMeta
└── FuncDecl nearestAvailableAmbulance(...)
    ├── list := getNearbyAvailableAmbulances(...)
    ├── guard empty/error
    └── return list[0]
```
