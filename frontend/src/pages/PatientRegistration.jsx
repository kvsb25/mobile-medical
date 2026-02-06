import React, { useState, useEffect } from "react";
import axios from "axios";

const PatientManagement = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gender: "Male",
    aadhar: "",
  });

  const [responseMessage, setResponseMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);

  const jwtToken = localStorage.getItem("jwtToken");
  const region = localStorage.getItem("region");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value.trim(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        "http://localhost:2426/receptionist/patientRegistration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: jwtToken,
            Region: region,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setResponseMessage(data.message || "Patient registered successfully!");
      setFormData({
        fullName: "",
        contactNumber: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        gender: "Male",
        aadhar: "",
      });

      fetchPatients();
    } catch (error) {
      setErrorMessage(error.message || "Error registering patient.");
    }
  };

  const fetchPatients = async () => {
    try {
      setError(null);
      const response = await axios.get(
        "http://localhost:2426/receptionist/getPatientDetails",
        {
          headers: {
            Authorization: jwtToken,
            Region: region,
          },
        }
      );
      setPatients(response.data.patients);
    } catch (err) {
      setPatients([]);
      setError(err.response?.data?.error || "Error fetching patient details");
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div style={{ width: "95%", margin: "0 auto", padding: "20px" }}>
      {/* Patient Registration Form */}
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", fontSize: "24px", color: "#333" }}>
          Patient Registration
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
          <label>Full Name:</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />

          <label>Contact Number:</label>
          <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required pattern="[0-9]{10}" />

          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />

          <label>Address:</label>
          <textarea name="address" value={formData.address} onChange={handleChange} required></textarea>

          <label>City:</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange} required />

          <label>State:</label>
          <input type="text" name="state" value={formData.state} onChange={handleChange} required />

          <label>Pincode:</label>
          <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required pattern="[0-9]{6}" />

          <label>Gender:</label>
          <div>
            <input type="radio" name="gender" value="Male" checked={formData.gender === "Male"} onChange={handleChange} /> Male
            <input type="radio" name="gender" value="Female" checked={formData.gender === "Female"} onChange={handleChange} style={{ marginLeft: "10px" }} /> Female
            <input type="radio" name="gender" value="Other" checked={formData.gender === "Other"} onChange={handleChange} style={{ marginLeft: "10px" }} /> Other
          </div>

          <label>Aadhar:</label>
          <input type="text" name="aadhar" value={formData.aadhar} onChange={handleChange} pattern="[0-9]{12}" />

          <button type="submit" style={{ padding: "12px", backgroundColor: "#007bff", color: "white", fontSize: "16px", borderRadius: "4px", marginTop: "10px" }}>
            Register
          </button>
        </form>

        {responseMessage && <p style={{ textAlign: "center", color: "green", marginTop: "20px" }}>{responseMessage}</p>}
        {errorMessage && <p style={{ textAlign: "center", color: "red", marginTop: "20px" }}>{errorMessage}</p>}
      </div>

      {/* Patient Details Table */}
      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#ffffff", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
        <h2 style={{ textAlign: "center", fontSize: "24px", color: "#333" }}>Patient Details</h2>
        {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#007bff", color: "white" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Address</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>City</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>State</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Gender</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.patient_id}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{patient.email}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{patient.address}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{patient.city}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{patient.state}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{patient.gender}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientManagement;
