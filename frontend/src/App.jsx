import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LoginOTPVerification from './pages/LoginOtpPage';
import { RoutesPathName } from './constants';
import PrivateRoute from './context/PrivateRoute';
import RegisterDoctor from './pages/RegisterDoctor';
import RegisterHospital from './pages/RegisterHospital';
import RegisterStaff from './pages/RegisterStaff';
import AddBeds from './pages/AddBeds';
import UpdateBeds from './pages/UpdateBeds';
import { LandingPage } from './pages/landingPage/landingPage';
import PatientRegistration from './pages/PatientRegistration';
import PatientHospitalise from './pages/PatientHospitalise';
import CreateAppointment from './pages/CreateAppointment';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import RemoveAppointment from './pages/RemoveAppointment';
import MarkAppointment from './pages/MarkAppointment';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: RoutesPathName.SIGNUP_PAGE,
    element: <Register />,
  },
  {
    path: RoutesPathName.LOGIN_PAGE,
    element: <Login />,
  },
  {
    path: RoutesPathName.LoginOTPVerification_Page,
    element: <LoginOTPVerification />,
  },
  {
    path: RoutesPathName.DASHBOARD_PAGE,
    element: (
      <PrivateRoute>
          <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.REGISTER_DOC,
    element: (
      <PrivateRoute>
        <RegisterDoctor />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.REGISTER_HOSPITAL,
    element: (
      <PrivateRoute>
        <RegisterHospital />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.REGISTER_STAFF,
    element: (
      <PrivateRoute>
        <RegisterStaff />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.ADD_BED,
    element: (
      <PrivateRoute>
        <AddBeds />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.UPDATE_BED,
    element: (
      <PrivateRoute>
        <UpdateBeds />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.PATIENT_REGISTER,
    element: (
      <PrivateRoute>
        <PatientRegistration />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.PATIENT_HOSPITALISE,
    element: (
      <PrivateRoute>
        <PatientHospitalise />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.CREATE_APPOINTMENT,
    element: (
      <PrivateRoute>
        <CreateAppointment />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.GET_DOCTORS,
    element: (
      <PrivateRoute>
        <Doctors />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.GET_PATIENTS,
    element: (
      <PrivateRoute>
        <Patients />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.REMOVE_APPOINTMENT,
    element: (
      <PrivateRoute>
        <RemoveAppointment />
      </PrivateRoute>
    ),
  },
  {
    path: RoutesPathName.MARK_APPOINTMENT,
    element: (
      <PrivateRoute>
        <MarkAppointment />
      </PrivateRoute>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;