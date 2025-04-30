import React, { useState, useEffect } from 'react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92'); // Default country code
  const [password, setPassword] = useState('');
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
    console.log('Login submitted:', { phone: `${countryCode} ${phone}`, password });
  };

  const countries = [
    { code: '+1', flag: '🇺🇸' },
    { code: '+44', flag: '🇬🇧' },
    { code: '+91', flag: '🇮🇳' },
    { code: '+92', flag: '🇵🇰' },
    { code: '+61', flag: '🇦🇺' },
    { code: '+81', flag: '🇯🇵' },
    { code: '+49', flag: '🇩🇪' },
    { code: '+33', flag: '🇫🇷' },
    { code: '+86', flag: '🇨🇳' },
    { code: '+7', flag: '🇷🇺' },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-teal-700 dark:text-emerald-400">
          Welcome Back
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
                  {country.flag} {country.code}
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
        <div className="mb-6">
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
        <button
          type="submit"
          className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          Login
        </button>
        <p className="text-center text-gray-700 dark:text-gray-400 mt-4">
          Don't have an account?{' '}
          <a href="/signup" className="text-teal-500 hover:underline dark:text-emerald-400">
            Signup
          </a>
        </p>
      </form>
      <div
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 cursor-pointer text-gray-800 dark:text-gray-200 text-2xl"
      >
        {isDarkMode ? <FaSun /> : <FaMoon />}
      </div>
    </div>
  );
};

export default Login;