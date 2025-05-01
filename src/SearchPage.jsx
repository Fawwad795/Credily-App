import React, { useState } from 'react';

const SearchPage = () => {
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
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-teal-500 text-white py-4 px-6 w-full shadow-md">
        <h1 className="text-2xl font-bold text-center">Search Accounts</h1>
      </header>

      {/* Search Input */}
      <div className="mt-8 w-full max-w-md">
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
      <div className="mt-8 w-full max-w-md">
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

export default SearchPage;