import React, { useState } from 'react';

const SearchSlider = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  // Simulate a search API call
  const handleSearch = () => {
    fetch(`/api/accounts?query=${searchQuery}`) // Replace with your backend API endpoint
      .then((response) => response.json())
      .then((data) => setResults(data))
      .catch((error) => console.error('Error fetching search results:', error));
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
          onClick={onClose} // Close the slider
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
          placeholder="Search for accounts..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          onClick={handleSearch}
          className="mt-4 w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300"
        >
          Search
        </button>
      </div>

      {/* Search Results */}
      <div className="p-4">
        {results.length > 0 ? (
          <ul className="bg-white shadow-md rounded-lg">
            {results.map((account) => (
              <li
                key={account.id}
                className="p-4 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-bold">{account.name}</p>
                <p className="text-sm text-gray-600">{account.email}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">
            {searchQuery ? 'No results found.' : 'Start searching for accounts.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchSlider;