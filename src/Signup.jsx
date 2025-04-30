import React, { useState, useEffect } from 'react';

const Signup = () => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92'); // Default country code
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Set initial dark mode based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Signup submitted:', { phone: `${countryCode} ${phone}`, password });
  };

  const countries = [
    { code: '+1', name: 'USA', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+7', name: 'Russia', flag: '🇷🇺' },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-200 via-emerald-300 to-white dark:from-gray-800 dark:via-gray-900 dark:to-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-teal-700 dark:text-emerald-400">
          Create an Account
        </h2>
        <div className="mb-4">
          <label className="block text-gray-800 dark:text-gray-300 font-medium mb-2">Phone Number</label>
          <div className="flex">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-emerald-600 dark:bg-gray-700 dark:text-gray-200"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code} ({country.name})
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-emerald-600 dark:bg-gray-700 dark:text-gray-200"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-800 dark:text-gray-300 font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-emerald-600 dark:bg-gray-700 dark:text-gray-200"
            placeholder="Enter your password"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-800 dark:text-gray-300 font-medium mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-emerald-600 dark:bg-gray-700 dark:text-gray-200"
            placeholder="Confirm your password"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          Signup
        </button>
        <p className="text-center text-gray-700 dark:text-gray-400 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-teal-500 hover:underline dark:text-emerald-400">
            Login
          </a>
        </p>
      </form>
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300"
      >
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </div>
  );
};

export default Signup;