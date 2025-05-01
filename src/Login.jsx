import React, { useState } from 'react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92'); // Default country code
  const [password, setPassword] = useState('');

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
    <div className="flex items-center justify-center min-h-screen bg-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-teal-700">
          Welcome Back
        </h2>
        <div className="mb-4">
          <label className="block text-gray-800 font-medium mb-2">Phone Number</label>
          <div className="flex">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-200 text-gray-800"
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
              className="w-full px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-200 text-gray-800"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-gray-800 font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-200 text-gray-800"
            placeholder="Enter your password"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300"
        >
          Login
        </button>
        <p className="text-center text-gray-700 mt-4">
          Don't have an account?{' '}
          <a href="/signup" className="text-teal-500 hover:underline">
            Signup
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;