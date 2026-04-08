import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { LogOut, Building2, LayoutDashboard, Users, UserCircle } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setIsAdmin(userData?.role === 'admin');
    } catch (error) {
      setUser(null);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Public pages (no layout needed)
  const publicPages = ['Home', 'Login', 'Checkout', 'CardView', 'Demo'];
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createPageUrl(isAdmin ? 'SuperAdminDashboard' : 'CompanyDashboard')} className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6993ef3c029e3c249b7f556c/bfcfbf9dc_main-identra-logo.png" 
                alt="Identra" 
                className="h-8"
              />
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              {user && (
                <>
                  {isAdmin ? (
                    <Link to={createPageUrl('SuperAdminDashboard')}>
                      <Button variant="ghost" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link to={createPageUrl('CompanyDashboard')}>
                      <Button variant="ghost" className="gap-2">
                        <Users className="w-4 h-4" />
                        My Cards
                      </Button>
                    </Link>
                  )}

                  <div className="border-l border-gray-200 h-6" />

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.full_name || user.email}</p>
                      {isAdmin && (
                        <p className="text-xs text-gray-500">Super Admin</p>
                      )}
                    </div>
                    <Link to={createPageUrl('Account')}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <UserCircle className="w-4 h-4" />
                        Account
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}