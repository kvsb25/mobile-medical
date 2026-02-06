import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem("jwtToken"));
  const [region, setRegion] = useState(localStorage.getItem("region"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Add role to the login function
  const login = (token, userDetails, region) => {
    const role = localStorage.getItem("role"); // Get role from localStorage
    setAuthToken(token);
    setUser({ ...userDetails, role }); // Include role in user details
    setRegion(region);
    localStorage.setItem("jwtToken", token);
    localStorage.setItem("region", region);
    localStorage.setItem("user", JSON.stringify({ ...userDetails, role }));
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setRegion(null);
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("region");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  };

  const headers = { "Content-Type": "application/json", Authorization: authToken };

  return (
    <AuthContext.Provider value={{ 
      authToken, 
      user, 
      region, 
      login, 
      logout, 
      headers, 
      isAuthenticated: !!authToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);