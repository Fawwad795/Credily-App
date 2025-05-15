import React, { createContext, useState, useContext } from 'react';

// Create context
const SliderContext = createContext();

// Provider component
export const SliderProvider = ({ children }) => {
  const [activeSlider, setActiveSlider] = useState(null);
  const [sliderParams, setSliderParams] = useState({});

  // Function to open the search slider
  const openSearchSlider = () => {
    setActiveSlider('search');
    setSliderParams({});
  };

  // Function to open the notifications slider
  const openNotificationsSlider = () => {
    setActiveSlider('notifications');
    setSliderParams({});
  };

  // Function to open the connections slider
  const openConnectionsSlider = (userId) => {
    setActiveSlider('connections');
    setSliderParams({ userId });
  };

  // Function to close any active slider
  const closeSlider = () => {
    setActiveSlider(null);
    setSliderParams({});
  };

  return (
    <SliderContext.Provider 
      value={{ 
        activeSlider,
        sliderParams, 
        openSearchSlider, 
        openNotificationsSlider,
        openConnectionsSlider, 
        closeSlider 
      }}
    >
      {children}
    </SliderContext.Provider>
  );
};

// Custom hook to use the slider context
export const useSlider = () => {
  const context = useContext(SliderContext);
  if (!context) {
    throw new Error('useSlider must be used within a SliderProvider');
  }
  return context;
};

export default SliderContext; 