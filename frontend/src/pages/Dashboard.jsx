import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import CompounderDashboard from './CompounderDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import { RoutesPathName } from '../constants';

function Dashboard() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get role from localStorage
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  switch (userRole) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Doctor':
      return <DoctorDashboard />;
    case 'Receptionist':
      return <ReceptionistDashboard />;
    case 'Compounder':
      return <CompounderDashboard />;
    default:
      return <Navigate to={RoutesPathName.LOGIN_PAGE} replace />;
  }
}

export default Dashboard;