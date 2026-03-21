import React, { useState } from "react";
import { Bell, User } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Perform logout operations
    localStorage.removeItem("jwtToken"); // Clear JWT token or other session data
    navigate("/login"); // Redirect to the login page
  };

  return (
    <header className="fixed top-0 right-0 h-16 bg-white shadow-sm flex items-center justify-end px-6 z-10 w-full">
      <div className="flex items-center space-x-4">
        {/* <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="h-6 w-6 text-gray-600" />
        </button> */}
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => setShowDropdown((prev) => !prev)} // Toggle dropdown
          >
            <User className="h-6 w-6 text-gray-600" />
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-40 z-20"
              onClick={() => setShowDropdown(false)} // Close dropdown when clicked
            >
              {user && (
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}