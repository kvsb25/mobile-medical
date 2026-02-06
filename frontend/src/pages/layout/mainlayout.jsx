import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Header from './header';
import Footer from './footer';

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header />
        
        {/* Children will be rendered here */}
        <main className="flex-1 p-6 mt-16 mb-12 overflow-y-auto">
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
