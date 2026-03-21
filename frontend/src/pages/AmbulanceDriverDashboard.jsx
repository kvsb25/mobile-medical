import { useEffect, useMemo, useRef, useState } from "react";

export default function AmbulanceDriverDashboard() {
  const [occupancy, setOccupancy] = useState("available");
  const [status, setStatus] = useState("idle");
  const watchIdRef = useRef(null);
  const token = useMemo(() => localStorage.getItem("jwtToken"), []);
  const region = useMemo(() => localStorage.getItem("region") || "north", []);
  const driverID = useMemo(() => Number(localStorage.getItem("driverID")), []);

  const pushUpdate = async (lat, lng, occ) => {
    if (!driverID) return;
    setStatus("publishing");
    try {
      const res = await fetch("http://localhost:2426/ambulanceDriver/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
          Region: region,
        },
        body: JSON.stringify({
          driverID,
          location: { lat, lng },
          occupancy: occ,
        }),
      });
      if (!res.ok) throw new Error("publish failed");
      setStatus("live");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!navigator.geolocation || !driverID) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (p) => {
        pushUpdate(p.coords.latitude, p.coords.longitude, occupancy);
      },
      () => setStatus("location-error"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [occupancy, driverID]);

  const markAvailable = async () => {
    await fetch("http://localhost:2426/ambulanceDriver/mark-available", {
      method: "POST",
      headers: { Authorization: token || "", Region: region },
    });
    setOccupancy("available");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Ambulance Driver Dashboard</h1>
        <p>Driver ID: {driverID || "Missing. Please login again."}</p>
        <p>Status: {status}</p>
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded ${occupancy === "available" ? "bg-green-600 text-white" : "bg-gray-200"}`}
            onClick={() => setOccupancy("available")}
          >
            Available
          </button>
          <button
            className={`px-4 py-2 rounded ${occupancy === "occupied" ? "bg-red-600 text-white" : "bg-gray-200"}`}
            onClick={() => setOccupancy("occupied")}
          >
            Occupied
          </button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={markAvailable}>
            Mark Available
          </button>
        </div>
      </div>
    </div>
  );
}

