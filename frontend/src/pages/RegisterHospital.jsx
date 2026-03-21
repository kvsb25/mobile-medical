import React, { useState } from 'react';

const RegisterHospital = () => {
    const [formData, setFormData] = useState({
        hospital_name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        contact_number: '',
        email: '',
        // admin_id: '',
        // username: '',
        description: '',
        // region: ''
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
            const response = await fetch('http://localhost:2426/hospitalAdmin/AdminRegisteringHospital', {
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
            setResponseMessage(data.message || 'Hospital registered successfully!');
        } catch (error) {
            setResponseMessage(error.message || 'Error registering hospital.');
        }
    };


    return (
        <div className="register-hospital" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', color: '#333' }}>Register Hospital</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>Hospital Name:</label>
                    <input
                        type="text"
                        name="hospital_name"
                        value={formData.hospital_name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>Address:</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>City:</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>State:</label>
                    <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>Pin Code:</label>
                    <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>Contact Number:</label>
                    <input
                        type="text"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333', height: '120px', resize: 'none' }}
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        padding: '12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        fontSize: '16px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                    }}
                >
                    Register
                </button>
            </form>
            {responseMessage && <p style={{ textAlign: 'center', color: 'green', marginTop: '20px', fontSize: '16px' }}>{responseMessage}</p>}
        </div>

    );
};

export default RegisterHospital;
