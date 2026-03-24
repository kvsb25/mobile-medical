# AST: `Backend/controllers/appointment.go`

```text
File
└── FuncDecl CreateAppointment(c)
    ├── kmAny := c.Get("km") guard exists
    ├── kafkaManager type assertion guard
    ├── VarDecl appointmentData Appointment
    ├── BindJSON guard
    ├── region := c.Get("region") guard + type assertion
    ├── db := GetDBForRegion(region) guard
    ├── DB lookup doctor guard
    ├── DB lookup patient guard
    ├── Construct appointment payload struct
    ├── json.Marshal(appointment) guard
    ├── SwitchStmt region
    │   ├── case "north": SendHospitalRegistrationMessage(..., "appointment_reg", ...)
    │   ├── case "south": SendHospitalRegistrationMessage(..., "appointment_reg", ...)
    │   └── default: 400 invalid region
    ├── IfStmt kafka error -> 500
    └── JSON 201 created
```
