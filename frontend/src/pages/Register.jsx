/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

const roleConfigs = {
  Admin: {
    endpoint: "http://localhost:2426/hospitalAdmin/registerHospitalAdmin",
    requiresAdminAuth: false,
    requiredFields: ["fullName", "email", "contactNumber", "region", "password"],
    buildBody: (formData) => ({
      full_name: formData.fullName,
      email: formData.email,
      contact_number: formData.contactNumber,
      region: formData.region,
      password: formData.password,
      user_type: "Admin",
    }),
  },
  Patient: {
    endpoint: "http://localhost:2426/register",
    requiresAdminAuth: false,
    requiredFields: ["fullName", "email", "contactNumber", "region", "password"],
    buildBody: (formData) => ({
      Full_Name: formData.fullName,
      Email: formData.email,
      ContactNumber: formData.contactNumber,
      Password: formData.password,
      region: formData.region,
      User_type: "Patient",
    }),
  },
  Doctor: {
    endpoint: "http://localhost:2426/hospitalAdmin/Registerdoctor",
    requiresAdminAuth: true,
    requiredFields: ["fullName", "email", "contactNumber", "description", "department", "region"],
    buildBody: (formData) => ({
      full_name: formData.fullName,
      email: formData.email,
      contact_number: formData.contactNumber,
      description: formData.description,
      department: formData.department,
    }),
  },
  Compounder: {
    endpoint: "http://localhost:2426/hospitalAdmin/registerStaff",
    requiresAdminAuth: true,
    requiredFields: ["fullName", "email", "contactNumber", "region"],
    buildBody: (formData) => ({
      full_name: formData.fullName,
      email: formData.email,
      contact_number: formData.contactNumber,
      position: "Compounder",
    }),
  },
  Receptionist: {
    endpoint: "http://localhost:2426/hospitalAdmin/registerStaff",
    requiresAdminAuth: true,
    requiredFields: ["fullName", "email", "contactNumber", "region"],
    buildBody: (formData) => ({
      full_name: formData.fullName,
      email: formData.email,
      contact_number: formData.contactNumber,
      position: "Reception",
    }),
  },
  AmbulanceDriver: {
    endpoint: "http://localhost:2426/hospitalAdmin/registerAmbulanceDriver",
    requiresAdminAuth: true,
    requiredFields: ["fullName", "email", "vehicleNo", "password", "region"],
    buildBody: (formData) => ({
      full_name: formData.fullName,
      email: formData.email,
      vehicle_no: formData.vehicleNo,
      password: formData.password,
    }),
  },
};

export default function Register() {
  const [formData, setFormData] = useState({
    role: "Admin",
    fullName: "",
    email: "",
    contactNumber: "",
    region: "",
    password: "",
    vehicleNo: "",
    description: "",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const config = roleConfigs[formData.role];
    if (!config) {
      setError("Invalid role selected.");
      setLoading(false);
      return;
    }

    for (const field of config.requiredFields) {
      if (!String(formData[field] || "").trim()) {
        setError(`Please fill ${field}.`);
        setLoading(false);
        return;
      }
    }

    const headers = { "Content-Type": "application/json" };
    if (config.requiresAdminAuth) {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        setError("This role signup is admin-protected. Please login as Admin first.");
        setLoading(false);
        return;
      }
      headers.Authorization = token;
      headers.Region = formData.region;
    }

    try {
      const body = config.buildBody(formData);
      const response = await axios.post(config.endpoint, body, { headers });

      if (response.status >= 200 && response.status < 300) {
        setSuccess(`${formData.role} signup successful.`);
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showPasswordField = ["Admin", "Patient", "AmbulanceDriver"].includes(formData.role);
  const showContactField = ["Admin", "Patient", "Doctor", "Compounder", "Receptionist"].includes(formData.role);
  const showVehicleField = formData.role === "AmbulanceDriver";
  const showDoctorFields = formData.role === "Doctor";
  const adminProtectedRoles = ["Doctor", "Compounder", "Receptionist", "AmbulanceDriver"];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full">
        {/* Left Container - Image */}
        <div className="w-1/2 bg-indigo-100 items-center justify-center hidden md:block">
          <img 
            src="https://i.pinimg.com/736x/6e/37/5a/6e375ad883c69fbb6f5845e99ca25623.jpg" 
            alt="Hospital" 
            className="object-cover h-full w-full"
          />
        </div>
        
        {/* Right Container - Registration Form */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Sign Up
          </h2>
          
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && <p className="text-green-600 text-center mb-4">{success}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(roleConfigs).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {adminProtectedRoles.includes(formData.role) && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                This role registration requires an authenticated Admin token (current backend config).
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {showContactField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  placeholder="Enter your contact number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a region</option>
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
              </select>
            </div>
            
            {showDoctorFields && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Cardiology"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Doctor profile description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {showVehicleField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicleNo"
                  placeholder="Enter ambulance vehicle number"
                  value={formData.vehicleNo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {showPasswordField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-300 disabled:opacity-50 mt-2"
            >
              {loading ? "Signing Up..." : `Sign Up as ${formData.role}`}
            </button>
          </form>
          
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 font-medium hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}