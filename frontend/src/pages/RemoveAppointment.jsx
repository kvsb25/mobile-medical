import React, { useState } from 'react';

const RemoveAppointment = () => {
  const [appointmentID, setAppointmentID] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const jwtToken = localStorage.getItem('jwtToken');
  const region = localStorage.getItem('region'); // In case middleware requires it

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!appointmentID) {
      setError('Please enter a valid Appointment ID.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:2426/markAppointment/${appointmentID}`, {
        method: 'POST', // ✅ Changed from DELETE to POST
        headers: {
          'Content-Type': 'application/json',
          Authorization: jwtToken,
          Region: region,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark appointment.');
      }

      setMessage(data.message || 'Appointment successfully marked.');
      setAppointmentID('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Mark Appointment as Done</h2>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label htmlFor="appointmentID" style={labelStyle}>
          Appointment ID:
        </label>
        <input
          type="number"
          id="appointmentID"
          value={appointmentID}
          onChange={(e) => setAppointmentID(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Mark as Done
        </button>
      </form>

      {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
    </div>
  );
};

// Styles
const containerStyle = {
  maxWidth: '400px',
  margin: '40px auto',
  padding: '20px',
  borderRadius: '10px',
  backgroundColor: '#f4f4f4',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '20px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const labelStyle = {
  marginBottom: '5px',
  fontWeight: 'bold',
};

const inputStyle = {
  marginBottom: '15px',
  padding: '10px',
  borderRadius: '5px',
  border: '1px solid #ccc',
};

const buttonStyle = {
  padding: '10px',
  backgroundColor: '#28a745',
  color: 'white',
  fontSize: '16px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default RemoveAppointment;
