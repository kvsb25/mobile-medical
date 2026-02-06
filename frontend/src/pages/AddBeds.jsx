import React, { useState } from 'react';

const AddBeds = () => {
  const [formData, setFormData] = useState({
    type_name: '',
    total_beds: ''
  });

  const [responseMessage, setResponseMessage] = useState('');
  const jwtToken = localStorage.getItem("jwtToken");
  const region = localStorage.getItem("region");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert total_beds to number
    const payload = {
      type_name: formData.type_name,
      total_beds: parseInt(formData.total_beds, 10)  // backend expects number
    };

    try {
      const response = await fetch('http://localhost:2426/hospitalAdmin/registerBeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': jwtToken,
          'Region': region,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error adding bed record.');
      }

      setResponseMessage(data.message || 'Bed record added successfully!');
    } catch (error) {
      setResponseMessage(error.message || 'Error adding bed record.');
    }
  };

  return (
    <div className="add-beds" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', color: '#333' }}>Add Beds</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>Bed Type Name:</label>
          <select
            name="type_name"
            value={formData.type_name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
          >
            <option value="">Select Bed Type</option>
            <option value="ICU">ICU</option>
            <option value="General-ward">General Ward</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>Total Beds:</label>
          <input
            type="number"
            name="total_beds"
            value={formData.total_beds}
            onChange={handleChange}
            required
            min="1"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', color: '#333' }}
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
          Add Bed
        </button>
      </form>
      {responseMessage && (
        <p style={{ textAlign: 'center', color: responseMessage.includes("success") ? 'green' : 'red', marginTop: '20px', fontSize: '16px' }}>
          {responseMessage}
        </p>
      )}
    </div>
  );
};

export default AddBeds;
