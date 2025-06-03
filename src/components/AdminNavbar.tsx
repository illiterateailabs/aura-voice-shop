
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminStore } from '../stores/adminStore';

const AdminNavbar = () => {
  const { user, logout } = useAdminStore();
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Aura Admin</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/admin" 
              className={`transition-colors ${
                isActiveRoute('/admin') 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/admin/products" 
              className={`transition-colors ${
                isActiveRoute('/admin/products') 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Products
            </Link>
            <Link 
              to="/admin/orders" 
              className={`transition-colors ${
                isActiveRoute('/admin/orders') 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Orders
            </Link>
            <Link 
              to="/admin/customers" 
              className={`transition-colors ${
                isActiveRoute('/admin/customers') 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Customers
            </Link>
            <Link 
              to="/" 
              className="text-gray-700 hover:text-purple-600 transition-colors"
              target="_blank"
            >
              View Store
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
