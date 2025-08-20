import React from 'react';
import ResponsiveLayout from '../layouts/ResponsiveLayout';

const Index = () => {
  return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12">
        <div className="text-center space-y-8 max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            Welcome to <span className="text-indigo-600">ABapp</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Your intelligent educational platform designed to adapt perfectly to any device.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">📱</div>
              <p className="text-sm font-medium text-gray-700">Mobile Portrait</p>
            </div>
            <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-md transition text-center">
              <div className="text-3xl mb-2 rotate-90 transform">📱</div>
              <p className="text-sm font-medium text-gray-700">Mobile Landscape</p>
            </div>
            <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">📲</div>
              <p className="text-sm font-medium text-gray-700">Tablet Portrait</p>
            </div>
            <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">💻</div>
              <p className="text-sm font-medium text-gray-700">Desktop</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Index;
