import React from 'react';

const Analytics = () => {
    return (
        <div className="max-w-4xl mx-auto my-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Analytics</h2>
          
          {/* Credibility Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Credibility</span>
              <span className="text-sm font-medium text-gray-700">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          
          {/* Optimism Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Optimism</span>
              <span className="text-sm font-medium text-gray-700">72%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>
          
          {/* Reputation Score Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Reputation Score</span>
              <span className="text-sm font-medium text-gray-700">93%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '93%' }}></div>
            </div>
          </div>
          
          {/* Additional context */}
          <p className="text-xs text-gray-500 mt-4">
            These metrics are calculated based on user interactions and feedback received over time.
          </p>
        </div>
    );
};

export default Analytics;