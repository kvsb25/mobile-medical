/* eslint-disable react/prop-types */
import { RoutesPathName } from "../constants";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function PrivateRoute({ children }) {
  const { authToken } = useAuth();

  if (!authToken) {
    return <Navigate to={RoutesPathName.LOGIN_PAGE} replace />;
  }

  return children;
}