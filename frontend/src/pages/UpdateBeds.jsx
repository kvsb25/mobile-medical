import React, { useState } from 'react';

const UpdateBeds = () => {
  const [formData, setFormData] = useState({
    type_name: '',
    total_beds: '',
    action: '',
  });

  const [responseMessage, setResponseMessage] = useState('');
  const jwtToken = localStorage.getItem('jwtToken');
  const region = localStorage.getItem('region');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure total_beds is a number
    const payload = {
      ...formData,
      total_beds: Number(formData.total_beds),
    };

    try {
      const response = await fetch('http://localhost:2426/hospitalAdmin/updateBeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: jwtToken,
          Region: region,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      setResponseMessage(data.message || 'Beds updated successfully');
    } catch (error) {
      setResponseMessage(error.message || 'Error updating bed record.');
    }
  };

  return (
    <div
      className="update-beds"
      style={{
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', color: '#333' }}>
        Update Beds
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>
            Bed Type Name:
          </label>
          <select
            name="type_name"
            value={formData.type_name}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              color: '#333',
            }}
          >
            <option value="">Select Bed Type</option>
            <option value="ICU">ICU</option>
            <option value="General-ward">General Ward</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>
            Total Beds:
          </label>
          <input
            type="number"
            name="total_beds"
            value={formData.total_beds}
            onChange={handleChange}
            required
            min="1"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              color: '#333',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', color: '#555', marginBottom: '5px', display: 'block' }}>
            Action:
          </label>
          <select
            name="action"
            value={formData.action}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              backgroundColor: '#fff',
              color: '#333',
              cursor: 'pointer',
            }}
          >
            <option value="">Select Action</option>
            <option value="add">Add</option>
            <option value="remove">Remove</option>
          </select>
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
          }}
        >
          Update Beds
        </button>
      </form>

      {responseMessage && (
        <p
          style={{
            textAlign: 'center',
            color: responseMessage.includes('success') ? 'green' : 'red',
            marginTop: '20px',
            fontSize: '16px',
          }}
        >
          {responseMessage}
        </p>
      )}
    </div>
  );
};

export default UpdateBeds;
