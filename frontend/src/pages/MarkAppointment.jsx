import React, { useState, useEffect } from 'react';

const MarkAppointment = () => {
  const [appointmentID, setAppointmentID] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const jwtToken = localStorage.getItem('jwtToken');
  const region = localStorage.getItem('region'); // In case middleware requires it

  const handleMarkAppointed = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch(
        `http://localhost:2426/patientAppointed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: jwtToken,
            Region: region
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');

      setMessage(data.message);
      setAppointmentID('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Mark Appointment as Done</h2>
      <form onSubmit={handleMarkAppointed}>
        <input
          type="number"
          placeholder="Enter Appointment ID"
          value={appointmentID}
          onChange={(e) => setAppointmentID(e.target.value)}
        />
        <button type="submit">Mark as Done</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default MarkAppointment;