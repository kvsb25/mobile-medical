import React, { useState } from 'react';

const CreateAppointment = () => {
    const [formData, setFormData] = useState({
        patientID: "",
        doctorID: "",
        appointmentDate: "",
        appointmentTime: "",
        description: ""
    });
    
    const [responseMessage, setResponseMessage] = useState('');
    const jwtToken = localStorage.getItem("jwtToken");
    const region = localStorage.getItem("region");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:2426/hospitalAdmin/createAppointment", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": jwtToken,
                    "Region": region,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const data = await response.json();
            setResponseMessage(data.message || 'Appointment created successfully!');
        } catch (error) {
            setResponseMessage(error.message || 'Error creating appointment.');
        }
    };

    return (
        <div>
            <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', color: '#333' }}>Create Appointment</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                    <input type="text" name="patientID" value={formData.patientID} onChange={handleChange} placeholder="Patient ID" required style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <input type="text" name="doctorID" value={formData.doctorID} onChange={handleChange} placeholder="Doctor ID" required style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <input type="time" name="appointmentTime" value={formData.appointmentTime} onChange={handleChange} required style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', height: '80px' }} />
                    <button type="submit" style={{ padding: '12px', backgroundColor: '#007bff', color: 'white', fontSize: '16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Appointment</button>
                </form>
                {responseMessage && <p style={{ textAlign: 'center', color: 'green', marginTop: '20px', fontSize: '16px' }}>{responseMessage}</p>}
            </div>
        </div>
    );
};

export default CreateAppointment;
