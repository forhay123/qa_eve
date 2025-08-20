// src/components/Layout.jsx
import React from "react";

const Layout = ({ children }) => {
  return (
    <div>
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-blue-900 text-white p-4 z-50">
        Sidebar content
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 left-64 right-0 h-16 bg-blue-900 text-white flex items-center px-6 z-40">
        Topbar content
      </header>

      {/* Main Content */}
      <main className="ml-64 mt-16 p-6 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;
