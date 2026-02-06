import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdmitPatient = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        contactNumber: "",
        bedType: "General",
        doctorName: "",
        paymentFlag: true
    });

    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [responseMessage, setResponseMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const jwtToken = localStorage.getItem("jwtToken");
    const region = localStorage.getItem("region");

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get("http://localhost:2426/receptionist/getPatientDetails", {
                    headers: { Authorization: jwtToken, Region: region }
                });
                setPatients(response.data.patients || []);
            } catch (error) {
                setPatients([]);
                console.error("Error fetching patients:", error);
            }
        };

        const fetchDoctors = async () => {
            try {
                const response = await axios.get("http://localhost:2426/receptionist/getDoctorDetails", {
                    headers: { Authorization: jwtToken, Region: region }
                });
                setDoctors(response.data.doctors || []);
            } catch (error) {
                setDoctors([]);
                console.error("Error fetching doctors:", error);
            }
        };

        fetchPatients();
        fetchDoctors();
    }, [jwtToken, region]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value.trim()
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setResponseMessage('');
        setErrorMessage('');

        try {
            const response = await fetch("http://localhost:2426/receptionist/patientHospitaliseRequest", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: jwtToken,
                    Region: region,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to admit patient');
            }

            setResponseMessage(data.message || 'Patient admitted successfully!');
            setFormData({
                fullName: "",
                contactNumber: "",
                bedType: "General",
                doctorName: "",
                paymentFlag: true
            });
        } catch (error) {
            console.error("Error:", error);
            setErrorMessage(error.message || 'Error admitting patient.');
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '450px',
            margin: '40px auto',
            padding: '25px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
            fontFamily: 'Arial, sans-serif',
        }}>
            <h2 style={{
                textAlign: 'center',
                marginBottom: '20px',
                fontSize: '22px',
                color: '#333',
                fontWeight: 'bold',
                borderBottom: '2px solid #007bff',
                paddingBottom: '10px'
            }}>Admit Patient</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Patient Dropdown */}
                <label style={{ fontWeight: 'bold', color: '#444' }}>Full Name:</label>
                <select 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    required
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '14px',
                        backgroundColor: '#f9f9f9',
                        cursor: 'pointer'
                    }}>
                    <option value="">Select a Patient</option>
                    {patients.map((patient) => (
                        // <option key={patient.patient_id} value={patient.full_name}>
                        //     {patient.full_name}
                        // </option>
                        <option key={patient.patient_id} value={patient.email}>
                            {patient.email}
                        </option>
                    ))}
                </select>

                <label style={{ fontWeight: 'bold', color: '#444' }}>Contact Number:</label>
                <input 
                    type="tel" 
                    name="contactNumber" 
                    value={formData.contactNumber} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter contact number"
                    pattern="[0-9]{10}" 
                    title="Enter a valid 10-digit phone number"
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '14px'
                    }}
                />

                <label style={{ fontWeight: 'bold', color: '#444' }}>Bed Type:</label>
                <select 
                    name="bedType" 
                    value={formData.bedType} 
                    onChange={handleChange} 
                    required
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '14px',
                        backgroundColor: '#f9f9f9',
                        cursor: 'pointer'
                    }}>
                    <option value="General-Ward">General-Ward</option>
                    <option value="ICU">ICU</option>
                </select>

                {/* Doctor Dropdown */}
                <label style={{ fontWeight: 'bold', color: '#444' }}>Doctor Name:</label>
                <select 
                    name="doctorName" 
                    value={formData.doctorName} 
                    onChange={handleChange} 
                    required
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '14px',
                        backgroundColor: '#f9f9f9',
                        cursor: 'pointer'
                    }}>
                    <option value="">Select a Doctor</option>
                    {doctors.map((doctor) => (
                        <option key={doctor.doctor_id} value={doctor.full_name}>
                            {doctor.full_name} ({doctor.department})
                        </option>
                    ))}
                </select>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold", color: "#444" }}>
                    <input 
                        type="checkbox" 
                        name="paymentFlag" 
                        checked={formData.paymentFlag} 
                        onChange={handleChange} 
                        style={{ width: "18px", height: "18px" }}
                    />
                    Payment Confirmed
                </label>

                <button type="submit" style={{
                    padding: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: '0.3s',
                    fontWeight: 'bold'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}>
                    Admit Patient
                </button>
            </form>

            {responseMessage && <p style={{ textAlign: 'center', color: 'green', marginTop: '15px', fontWeight: 'bold' }}>{responseMessage}</p>}
            {errorMessage && <p style={{ textAlign: 'center', color: 'red', marginTop: '15px', fontWeight: 'bold' }}>{errorMessage}</p>}
        </div>
    );
};

export default AdmitPatient;
