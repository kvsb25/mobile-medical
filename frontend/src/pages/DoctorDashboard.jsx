import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./layout/header";


function DoctorDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const actionCards = [
    {
      image: "/images/patient.jpg",
      label: "Patient Details",
      description: "View and manage your patient information.",
      href: "/patients",
    },
    {
      image: "/images/doctor.jpg",
      label: "Doctor Directory",
      description: "Access details of all doctors in the hospital.",
      href: "/doctors",
    }
  ];

  const filteredCards = actionCards.filter(card => 
    card.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="p-4 md:p-6 pt-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            DOCTOR DASHBOARD
          </h1>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full md:w-64 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg 
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Your Patients", value: "32", color: "bg-blue-500" },
            { label: "Appointments Today", value: "8", color: "bg-green-500" },
            { label: "Pending Reports", value: "5", color: "bg-yellow-500" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4 flex flex-col">
              <div className={`${stat.color} w-12 h-2 rounded mb-2`}></div>
              <span className="text-sm text-gray-500">{stat.label}</span>
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Action Cards Section */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 cursor-pointer"
              onClick={() => navigate(card.href)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.label}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{card.label}</h3>
                <p className="text-gray-600 mb-4">{card.description}</p>
                <button 
                  className="w-full px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex justify-center items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(card.href);
                  }}
                >
                  View Details
                  <svg 
                    className="ml-1 h-4 w-4" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default DoctorDashboard;