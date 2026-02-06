/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    region: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      full_name: formData.fullName,
      email: formData.email,
      contact_number: formData.contactNumber,
      region: formData.region,
      password: formData.password,
    };

    try {
      const response = await axios.post(
        "http://localhost:2426/hospitalAdmin/registerHospitalAdmin",
        body,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 201) {
        navigate("/login"); // Redirect to login on success
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-300 disabled:opacity-50 mt-2"
            >
              {loading ? "Signing Up..." : "Sign Up"}
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