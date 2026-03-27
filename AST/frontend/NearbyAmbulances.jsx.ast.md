# AST: `frontend/src/pages/NearbyAmbulances.jsx`

```text
Program
├── ImportDeclaration React hooks: useEffect/useMemo/useRef/useState
├── ImportDeclaration default L from "leaflet"
├── ImportDeclaration side-effect "leaflet/dist/leaflet.css"
└── ExportDefaultDeclaration FunctionDeclaration NearbyAmbulances()
    ├── useState declarations
    │   ├── radiusKm
    │   ├── coords {lat, lng}
    │   ├── ambulances[]
    │   ├── error
    │   ├── connected
    │   ├── searchText
    │   ├── searching
    │   └── searchResults[]
    ├── useMemo auth/region from localStorage
    ├── useRef mapContainerRef/mapRef/patientLayerRef/ambulanceLayerRef/streamRef
    ├── Derived numeric coordinates + validity guard
    ├── useEffect(map bootstrap, [])
    │   ├── If no container or map exists -> return
    │   ├── L.map(...).setView(defaultIndiaCenter, 5)
    │   ├── L.tileLayer(OpenStreetMap).addTo(map)
    │   ├── patientLayer = L.layerGroup().addTo(map)
    │   ├── ambulanceLayer = L.layerGroup().addTo(map)
    │   └── cleanup: close stream + remove map
    ├── useEffect(patient marker, [hasValidCoords, parsedLat, parsedLng])
    │   ├── clear patient layer
    │   ├── if invalid coords -> return
    │   ├── L.circleMarker(patient).bindPopup("Patient origin")
    │   └── map.setView(patient, 13)
    ├── useEffect(ambulance markers, [ambulances])
    │   ├── clear ambulance layer
    │   └── forEach ambulance -> parse lat/lng -> L.circleMarker(...).bindPopup(...)
    ├── FunctionDeclaration startWithCurrentLocation()
    │   └── navigator.geolocation.getCurrentPosition(success -> setCoords, failure -> setError)
    ├── AsyncFunctionDeclaration searchLocation()
    │   ├── guard non-empty search
    │   ├── fetch Nominatim `/search?format=json&limit=5&q=...`
    │   ├── parse JSON results
    │   └── set search results or error
    ├── FunctionDeclaration chooseSearchResult(result)
    │   ├── setCoords from result.lat/result.lon
    │   ├── clear result list
    │   └── set searchText to display_name
    ├── FunctionDeclaration stopStream()
    │   ├── close EventSource if present
    │   └── setConnected(false)
    ├── FunctionDeclaration startStream()
    │   ├── validate coords
    │   ├── stop previous stream
    │   ├── new EventSource(`/ambulances/stream?...token=...`)
    │   ├── listener "ambulances" -> parse event.data -> setAmbulances
    │   └── onerror -> set disconnected/error and close stream
    ├── AsyncFunctionDeclaration requestAmbulance()
    │   ├── validate coords
    │   ├── fetch POST `/ambulances/request` with auth+region headers
    │   ├── parse JSON response
    │   └── setError or alert success
    └── ReturnStatement JSX
        ├── Search section (input, search button, result list)
        ├── Coordinate inputs
        ├── Action controls (geo, radius, start/stop, request)
        ├── Status + error display
        ├── Map container `div` with ref
        └── Ambulance cards list
```
