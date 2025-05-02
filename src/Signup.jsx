import React, { useState } from 'react';
import background from './background.png'; // adjust the path if needed

const Signup = () => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Signup submitted:', { phone: `${countryCode} ${phone}`, password });
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
    <div
      className="min-h-screen grid grid-cols-2 bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: '120%', // Scales the background image to 120% of its original size
        backgroundRepeat: 'no-repeat', // Prevents the image from repeating
        backgroundPosition: 'center', // Ensures the image is centered
      }}
    >
      <div className="bg-opacity-50 p-8 rounded-lg w-full flex justify-center items-center flex-col  h-full ">
<div className='flex flex-col justify-center items-start'>
        <div className='font-black text-7xl ml-7 mb-7'>Connect With Those Who Matter The Most</div>
        <div className='ml-8 text-xl'>Join Credily now and become a part of our community!</div>
        </div>
      </div>
     <div className='flex justify-center items-center w-full h-full'>
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-lg shadow-2xl  glass "
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-black">Create an Account</h2>

        <div className="mb-4">
          <label className="block text-black font-medium mb-2">Phone Number</label>
          <div className="flex">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-4 py-2 border rounded-l-lg  mr-8 glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
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
              className="w-full px-4 py-2 border rounded-r-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-black font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border glass rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Enter your password"
          />
        </div>

        <div className="mb-6">
          <label className="block text-black font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg glass text-black focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          className="w-full grad text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300"
        >
          Signup
        </button>

        <p className="text-center text-black mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-purple-900 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div></div>
  );
};

export default Signup;
