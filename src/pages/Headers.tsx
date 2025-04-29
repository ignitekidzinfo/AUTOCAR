import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, User, LogOut, Menu, X, Home, ShoppingBag, BarChart2, Car, Wrench, Plus } from "lucide-react";
import storageUtils from "../utils/storageUtils";

const WebHeader = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  let isLogin = false;
  let userRole = "";

  const userData = storageUtils.getUserData();
  if (userData) {
    userRole = userData.authorities?.[0] || "";
    isLogin = true;
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    storageUtils.clearAuthData();
    isLogin = false;
    navigate("/signIn");
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-gradient-to-r from-gray-900 to-gray-800'}`}>
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 text-2xl font-bold text-white hover:text-blue-400 transition-all duration-300"
          >
            <Car className="h-8 w-8 text-blue-500" strokeWidth={1.5} />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              AutoCarCarePoint
            </span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-white focus:outline-none hover:bg-gray-700/60 rounded-lg p-2 transition-all"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div
            className={`lg:flex lg:items-center lg:space-x-1 transition-all duration-300 ${
              isMobileMenuOpen 
                ? "absolute top-full left-0 w-full bg-gray-900/95 backdrop-blur-md shadow-lg py-2 opacity-100 translate-y-0" 
                : "absolute top-full left-0 w-full bg-gray-900/95 opacity-0 -translate-y-4 pointer-events-none lg:opacity-100 lg:translate-y-0 lg:pointer-events-auto lg:relative lg:bg-transparent lg:w-auto lg:shadow-none"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 px-4 lg:px-0">
              <NavItem to="/" label="Home" icon={<Home size={18} />} />
              {userRole === "ADMIN" && (
                <NavItem to="/add-part" label="Add Parts" icon={<Wrench size={18} />} />
              )}
              <NavItem to="/getAll" label="Accessories" icon={<ShoppingBag size={18} />} />
              {(userRole === "ADMIN" || userRole === "EMPLOYEE") && (
                <NavItem to="/admin/dashboard" label="Dashboard" icon={<BarChart2 size={18} />} />
              )}
              {!isLogin && (
                <div className="lg:ml-6 mt-4 lg:mt-0 border-t border-gray-700 lg:border-0 pt-4 lg:pt-0 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 w-full lg:w-auto">
                  <Link
                    to="/signIn"
                    className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <span className="relative z-10 flex items-center justify-center font-medium">
                      <User size={16} className="mr-2" />
                      Sign In
                    </span>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></span>
                  </Link>
                  
                  <Link
                    to="/signup"
                    className="relative overflow-hidden group px-6 py-2.5 rounded-lg border-2 border-blue-500/70 text-blue-400 hover:text-white transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-blue-500/20"
                  >
                    <span className="relative z-10 flex items-center justify-center font-medium">
                      <Plus size={16} className="mr-2" />
                      Sign Up
                    </span>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-right duration-300 ease-out"></span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {isLogin && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User size={16} />
                </div>
                <span className="hidden sm:inline">{userData?.sub?.split('@')[0] || 'User'}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden origin-top-right transform transition-all duration-200 scale-100">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{userData?.sub || 'User'}</p>
                    <p className="text-xs text-gray-400 mt-1">{userRole || 'User Role'}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200"
                  >
                    <User size={16} className="mr-2 text-gray-400" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:bg-gray-700"
                  >
                    <LogOut size={16} className="mr-2 text-gray-400" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
    </>
  );
};

// Reusable navigation item component
interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem = ({ to, label, icon }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 ${
        isActive 
          ? 'bg-blue-600/20 text-blue-400' 
          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </Link>
  );
};

export default WebHeader;