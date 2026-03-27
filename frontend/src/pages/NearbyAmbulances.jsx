import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function NearbyAmbulances() {
  const [radiusKm, setRadiusKm] = useState(5);
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [ambulances, setAmbulances] = useState([]);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const auth = useMemo(() => localStorage.getItem("jwtToken"), []);
  const region = useMemo(() => localStorage.getItem("region") || "north", []);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const patientLayerRef = useRef(null);
  const ambulanceLayerRef = useRef(null);
  const streamRef = useRef(null);

  const parsedLat = Number(coords.lat);
  const parsedLng = Number(coords.lng);
  const hasValidCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && parsedLat !== 0 && parsedLng !== 0;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    patientLayerRef.current = L.layerGroup().addTo(mapRef.current);
    ambulanceLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !patientLayerRef.current) return;
    patientLayerRef.current.clearLayers();

    if (!hasValidCoords) return;
    L.circleMarker([parsedLat, parsedLng], {
      radius: 9,
      color: "#1d4ed8",
      fillColor: "#2563eb",
      fillOpacity: 0.85,
      weight: 2,
    })
      .bindPopup("Patient origin")
      .addTo(patientLayerRef.current);
    mapRef.current.setView([parsedLat, parsedLng], 13);
  }, [hasValidCoords, parsedLat, parsedLng]);

  useEffect(() => {
    if (!ambulanceLayerRef.current) return;
    ambulanceLayerRef.current.clearLayers();

    ambulances.forEach((a) => {
      const lat = Number(a.lat);
      const lng = Number(a.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      L.circleMarker([lat, lng], {
        radius: 7,
        color: "#b91c1c",
        fillColor: "#ef4444",
        fillOpacity: 0.8,
        weight: 2,
      })
        .bindPopup(
          `<div><strong>Driver:</strong> ${a.driverID}<br/><strong>Hospital:</strong> ${a.hospitalID || "-"}<br/><strong>Occupancy:</strong> ${a.occupancy || "-"}</div>`
        )
        .addTo(ambulanceLayerRef.current);
    });
  }, [ambulances]);

  const startWithCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => setError("Location permission denied or unavailable")
    );
  };

  const searchLocation = async () => {
    if (!searchText.trim()) {
      setError("Please enter a location to search");
      return;
    }
    setError("");
    setSearching(true);
    setSearchResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchText.trim())}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Search service unavailable");
      }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setError("No locations found");
        return;
      }
      setSearchResults(data);
    } catch {
      setError("Failed to search location");
    } finally {
      setSearching(false);
    }
  };

  const chooseSearchResult = (result) => {
    setCoords({ lat: Number(result.lat), lng: Number(result.lon) });
    setSearchResults([]);
    setSearchText(result.display_name || "");
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    setConnected(false);
  };

  const startStream = () => {
    setError("");
    if (!hasValidCoords) {
      setError("Please provide valid latitude and longitude");
      return;
    }
    stopStream();
    const url = `http://localhost:2426/ambulances/stream?region=${region}&lat=${parsedLat}&lng=${parsedLng}&radiusKm=${radiusKm}&token=${encodeURIComponent(auth || "")}`;
    const es = new EventSource(url, { withCredentials: false });
    streamRef.current = es;
    setConnected(true);

    es.addEventListener("ambulances", (event) => {
      try {
        const payload = JSON.parse(event.data);
        setAmbulances(payload.ambulances || []);
      } catch {
        setError("Failed to parse SSE payload");
      }
    });
    es.onerror = () => {
      setConnected(false);
      setError("SSE disconnected. Try reconnecting.");
      es.close();
      streamRef.current = null;
    };
  };

  const requestAmbulance = async () => {
    if (!hasValidCoords) {
      setError("Please provide valid latitude and longitude");
      return;
    }
    const res = await fetch("http://localhost:2426/ambulances/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth || "",
        Region: region,
      },
      body: JSON.stringify({ lat: parsedLat, lng: parsedLng, radiusKm }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to request ambulance");
      return;
    }
    alert(`Ambulance assigned: Driver ${data.ambulance?.driverID}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Nearby Ambulances</h1>
        <div className="flex gap-3">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Search address or place (free via OpenStreetMap)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button className="bg-indigo-600 text-white rounded px-3 py-2" onClick={searchLocation} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="border rounded p-2 bg-gray-50 max-h-44 overflow-auto">
            {searchResults.map((r) => (
              <button
                key={r.place_id}
                type="button"
                className="block w-full text-left px-2 py-2 hover:bg-gray-100 rounded"
                onClick={() => chooseSearchResult(r)}
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Latitude"
            value={coords.lat}
            onChange={(e) => setCoords((s) => ({ ...s, lat: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Longitude"
            value={coords.lng}
            onChange={(e) => setCoords((s) => ({ ...s, lng: e.target.value }))}
          />
        </div>
        <div className="flex gap-3">
          <button className="bg-gray-200 rounded px-3 py-2" onClick={startWithCurrentLocation}>
            Use Current Location
          </button>
          <select
            className="border rounded px-3 py-2"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
          </select>
          <button className="bg-blue-600 text-white rounded px-3 py-2" onClick={startStream}>
            Start Stream
          </button>
          <button className="bg-slate-600 text-white rounded px-3 py-2" onClick={stopStream}>
            Stop Stream
          </button>
          <button className="bg-green-600 text-white rounded px-3 py-2" onClick={requestAmbulance}>
            Request Ambulance
          </button>
        </div>
        <p className="text-sm text-gray-600">{connected ? "SSE connected" : "SSE disconnected"}</p>
        {error && <p className="text-red-600">{error}</p>}
        <div ref={mapContainerRef} className="w-full h-96 rounded border" />
        <div className="space-y-2">
          {ambulances.map((a) => (
            <div key={a.driverID} className="border rounded p-3">
              <p>Driver ID: {a.driverID}</p>
              <p>Hospital ID: {a.hospitalID || "-"}</p>
              <p>Occupancy: {a.occupancy}</p>
              <p>
                Location: {a.lat}, {a.lng}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

