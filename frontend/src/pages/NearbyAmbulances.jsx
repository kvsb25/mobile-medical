import { useMemo, useState } from "react";

export default function NearbyAmbulances() {
  const [radiusKm, setRadiusKm] = useState(5);
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [ambulances, setAmbulances] = useState([]);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const auth = useMemo(() => localStorage.getItem("jwtToken"), []);
  const region = useMemo(() => localStorage.getItem("region") || "north", []);

  const startWithCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => setError("Location permission denied or unavailable")
    );
  };

  const startStream = () => {
    setError("");
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!lat || !lng) {
      setError("Please provide valid latitude and longitude");
      return;
    }
    const url = `http://localhost:2426/ambulances/stream?region=${region}&lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&token=${encodeURIComponent(auth || "")}`;
    const es = new EventSource(url, { withCredentials: false });
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
    };
  };

  const requestAmbulance = async () => {
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    const res = await fetch("http://localhost:2426/ambulances/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth || "",
        Region: region,
      },
      body: JSON.stringify({ lat, lng, radiusKm }),
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
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Nearby Ambulances</h1>
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
          <button className="bg-green-600 text-white rounded px-3 py-2" onClick={requestAmbulance}>
            Request Ambulance
          </button>
        </div>
        <p className="text-sm text-gray-600">{connected ? "SSE connected" : "SSE disconnected"}</p>
        {error && <p className="text-red-600">{error}</p>}
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

