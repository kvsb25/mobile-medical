import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "./layout/mainlayout";

function AdminDashboard() {
  const navigate = useNavigate();

  const actionCards = [
    {
      image: "/images/doctor.jpg",
      label: "Register Doctor",
      description: "Add new doctors to your medical team effortlessly.",
      href: "/RegisterDoctor",
    },
    {
      image: "/images/hospital.jpg",
      label: "Register Hospital",
      description: "Manage and register hospitals within your network.",
      href: "/RegisterHospital",
    },
    {
      image: "/images/staff.jpg",
      label: "Register Staff",
      description: "Expand your team by adding qualified staff members.",
      href: "/RegisterStaff",
    },
    {
      image: "/images/beds.jpg",
      label: "Add Beds",
      description: "Track and manage hospital bed availability in real-time.",
      href: "/AddBed",
    },
    {
      image: "/images/beds.jpg",
      label: "Update Beds",
      description: "Track and manage hospital bed availability in real-time.",
      href: "/UpdateBed",
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 flex flex-col">
        <h1>ADMIN DASHBOARD</h1>
        {/* Action Cards Section */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
          {actionCards.map((card, index) => (
            <motion.div
              key={index}
              className="relative group rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 p-1 shadow-lg hover:shadow-2xl"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => navigate(card.href)}
            >
              <div className="h-full bg-white p-4 rounded-lg">
                <img
                  src={card.image}
                  alt={card.label}
                  className="w-full h-32 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform"
                />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{card.label}</h2>
                <p className="text-gray-600 mb-4">{card.description}</p>
                <div className="flex justify-between">
                  <span
                    className="px-4 py-2 text-blue-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                    onClick={() => navigate(card.href)}
                  >
                    View More
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      </div>
    </MainLayout>
  );
}

export default AdminDashboard;
