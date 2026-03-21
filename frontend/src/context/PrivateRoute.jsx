/* eslint-disable react/prop-types */
import { RoutesPathName } from "../constants";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { authToken } = useAuth();
  const role = localStorage.getItem("role");

  if (!authToken) {
    return <Navigate to={RoutesPathName.LOGIN_PAGE} replace />;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={RoutesPathName.DASHBOARD_PAGE} replace />;
  }

  return children;
}