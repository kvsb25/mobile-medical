import React, { useState, useEffect } from "react";
import axios from "axios";

export default function RegisterDoctor() {
    const [formData, setFormData] = useState({
        full_name: "",
        description: "",
        contact_number: "",
        email: "",
        department: "",
    });

    const [doctors, setDoctors] = useState([]);
    const [responseMessage, setResponseMessage] = useState("");
    const [error, setError] = useState(null);

    const jwtToken = localStorage.getItem("jwtToken");
    const region = localStorage.getItem("region");

    // Handle Input Changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setResponseMessage("");

        try {
            const response = await fetch("http://localhost:2426/hospitalAdmin/Registerdoctor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": jwtToken,
                    "Region": region,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            setResponseMessage("Doctor registered successfully!");
            setFormData({ full_name: "", description: "", contact_number: "", email: "", department: "" });
            fetchDoctors(); // Refresh doctor list after registration
        } catch (error) {
            setResponseMessage(error.message || "Error registering doctor.");
        }
    };

    // Fetch Doctor Details
    const fetchDoctors = async () => {
        try {
            setError(null);
            const response = await axios.get("http://localhost:2426/hospitalAdmin/getDoctorsAdmin", {
                headers: {
                    "Authorization": jwtToken,
                    "Region": region,
                },
            });
            setDoctors(response.data.doctors);
        } catch (err) {
            setDoctors([]);
            setError(err.response?.data?.error || "Error fetching doctor details");
        }
    };

    // Fetch doctors on component mount
    useEffect(() => {
        fetchDoctors();
    }, []);

    return (
        <div style={{ width: "80%", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ textAlign: "center", color: "#333" }}>Doctor Management</h2>

            {/* Doctor Registration Form */}
            <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
                <h3 style={{ textAlign: "center", marginBottom: "10px" }}>Register Doctor</h3>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Full Name" required style={{ padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required style={{ padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc", height: "80px" }}></textarea>
                    <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} placeholder="Contact Number" required style={{ padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required style={{ padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
                    <select name="department" value={formData.department} onChange={handleChange} required style={{ padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }}>
                        <option value="">Select Department</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Surgeon">Surgeon</option>
                    </select>
                    <button type="submit" style={{ padding: "10px", background: "#007bff", color: "white", fontSize: "16px", border: "none", borderRadius: "4px", cursor: "pointer" }}>Register</button>
                </form>
                {responseMessage && <p style={{ textAlign: "center", color: "green", marginTop: "10px" }}>{responseMessage}</p>}
            </div>

            {/* Doctor Details Table */}
            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>Doctor List</h3>
            {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
            <div style={{ overflowX: "auto", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", background: "#fff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                    <thead>
                        <tr style={{ background: "#007bff", color: "white" }}>
                            <th style={tableHeaderStyle}>ID</th>
                            <th style={tableHeaderStyle}>Full Name</th>
                            <th style={tableHeaderStyle}>Description</th>
                            <th style={tableHeaderStyle}>Contact</th>
                            <th style={tableHeaderStyle}>Email</th>
                            <th style={tableHeaderStyle}>Department</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.length > 0 ? (
                            doctors.map((doctor) => (
                                <tr key={doctor.doctor_id} style={tableRowStyle}>
                                    <td style={tableCellStyle}>{doctor.doctor_id}</td>
                                    <td style={tableCellStyle}>{doctor.full_name}</td>
                                    <td style={tableCellStyle}>{doctor.description}</td>
                                    <td style={tableCellStyle}>{doctor.contact_number}</td>
                                    <td style={tableCellStyle}>{doctor.email}</td>
                                    <td style={tableCellStyle}>{doctor.department}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>No doctors found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Table Styles
const tableHeaderStyle = { padding: "10px", textAlign: "left", borderBottom: "2px solid white" };
const tableCellStyle = { padding: "10px", borderBottom: "1px solid #ddd" };
const tableRowStyle = { background: "#f9f9f9", transition: "background 0.3s ease-in-out" };

