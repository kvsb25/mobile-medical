import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

const roleEndpoints = {
  Admin: "http://localhost:2426/hospitalAdmin/adminOtp",
  Compounder: "http://localhost:2426/compounder/staffOtp",
  Receptionist: "http://localhost:2426/receptionist/staffOtp"
};

export default function VerifyOtpPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    const jwtToken = localStorage.getItem("jwtToken");
    const region = localStorage.getItem("region");
    const role = localStorage.getItem("role");

    if (!jwtToken || !region || !role) {
      alert("Missing authentication data. Please log in again.");
      navigate("/login");
      return;
    }

    const endpoint = roleEndpoints[role];
    if (!endpoint) {
      alert("Invalid role configuration. Contact support.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": jwtToken,
          "Region": region
        },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        login(jwtToken, { email }, region);
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "OTP verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("An error occurred during verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 shadow-lg rounded-lg max-w-sm w-full">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          Verify OTP
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        {/* <p className="mt-4 text-center text-sm text-gray-600">
          Didn't receive an OTP?{" "}
          <button
            className="text-blue-500 font-medium hover:underline"
            onClick={() => alert("Resend OTP functionality coming soon!")}
          >
            Resend OTP
          </button>
        </p> */}
      </div>
    </div>
  );
}
