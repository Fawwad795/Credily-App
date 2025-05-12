import React, { useState } from 'react';

const SearchSlider = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please login to search users');
      }

      const response = await fetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login again to continue');
        }
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.data.users || []);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setError(error.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-1/3 bg-white shadow-lg transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 z-50`}
    >
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold">Search Accounts</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder="Search by username, email, or phone..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="mt-4 w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 disabled:bg-teal-300"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 text-red-500 text-center">
          {error}
        </div>
      )}

      {/* Search Results */}
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {results.length > 0 ? (
          <ul className="bg-white shadow-md rounded-lg">
            {results.map((user) => (
              <li
                key={user._id}
                className="p-4 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-bold">{user.username}</p>
                {user.phoneNumber && (
                  <p className="text-sm text-gray-600">{user.phoneNumber}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">
            {loading ? 'Searching...' : searchQuery ? 'No results found.' : 'Start searching for accounts.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchSlider;