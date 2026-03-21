import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCog, 
  Building2, 
  Users, 
  Bed, 
  Menu 
} from 'lucide-react';
import { RoutesPathName } from '../../constants';

export default function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: RoutesPathName.DASHBOARD_PAGE 
    },
    { 
      icon: UserCog, 
      label: 'Register Doctor', 
      path: RoutesPathName.REGISTER_DOC 
    },
    { 
      icon: Building2, 
      label: 'Register Hospital', 
      path: RoutesPathName.REGISTER_HOSPITAL 
    },
    { 
      icon: Users, 
      label: 'Register Staff', 
      path: RoutesPathName.REGISTER_STAFF 
    },
    { 
      icon: Bed, 
      label: 'Add Beds', 
      path: RoutesPathName.ADD_BED 
    },
    // { 
    //   icon: Bed, 
    //   label: 'Update Beds', 
    //   path: RoutesPathName.UPDATE_BED 
    // },
  ];

  return (
    <aside className={`fixed h-full bg-gray-900 text-white transition-all duration-300 ease-in-out ${
      isSidebarOpen ? 'w-64' : 'w-20'
    } z-20`}>
      <div className="flex items-center justify-between p-4">
        {isSidebarOpen && (
          <h1 className="text-xl font-bold text-cyan-500">SWAASTHYA</h1>
        )}
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <nav className="mt-6">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className={`
                flex items-center px-4 py-3 cursor-pointer
                transition-colors duration-200
                ${isActive 
                  ? 'bg-cyan-500 text-white' 
                  : 'hover:bg-gray-800 text-gray-300'
                }
              `}
            >
              <item.icon className="h-6 w-6" />
              {isSidebarOpen && (
                <span className="ml-3">{item.label}</span>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}