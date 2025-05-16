/**
 * Debug utility for the Credily frontend app
 * Functions to help diagnose and troubleshoot common issues
 */

// Check if a user is logged in with valid token
export const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return {
      isLoggedIn: false,
      message: 'No authentication token found in localStorage',
      action: 'Please log in again'
    };
  }
  
  try {
    // Try to decode the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        isLoggedIn: false,
        message: 'Invalid token format (not a valid JWT)',
        action: 'Clear localStorage and log in again'
      };
    }
    
    // Decode the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    const expiryDate = new Date(payload.exp * 1000);
    const now = new Date();
    
    if (now > expiryDate) {
      return {
        isLoggedIn: false,
        message: `Token expired on ${expiryDate.toLocaleString()}`,
        token: {
          ...payload,
          exp: expiryDate.toLocaleString()
        },
        action: 'Please log in again to refresh your token'
      };
    }
    
    // Token is valid and not expired
    return {
      isLoggedIn: true,
      message: 'Authentication valid',
      token: {
        ...payload,
        exp: expiryDate.toLocaleString()
      }
    };
  } catch (error) {
    return {
      isLoggedIn: false,
      message: `Error decoding token: ${error.message}`,
      action: 'Clear localStorage and log in again'
    };
  }
};

// Check API connection by making a simple request
export const checkApiConnection = async () => {
  try {
    const startTime = Date.now();
    const response = await fetch('/api', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const endTime = Date.now();
    
    return {
      connected: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime: `${endTime - startTime}ms`,
      serverResponse: await response.text()
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      hint: error.message.includes('Failed to fetch') 
        ? 'Backend server may not be running' 
        : 'Unknown connection issue'
    };
  }
};

// Examine localStorage for any issues
export const examineStorage = () => {
  try {
    const storageItems = { ...localStorage };
    const storageSize = JSON.stringify(storageItems).length;
    const maxSize = 5 * 1024 * 1024; // 5MB is typical localStorage limit
    
    // Check specific important items
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    
    return {
      items: Object.keys(storageItems).length,
      storageSize: `${(storageSize / 1024).toFixed(2)} KB`,
      storagePercentage: `${((storageSize / maxSize) * 100).toFixed(2)}%`,
      hasToken: !!token,
      hasUserId: !!userId,
      hasUserEmail: !!userEmail,
      potentialIssues: !token ? ['Missing auth token'] : []
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
};

// Run all diagnostic tests and return results
export const runDiagnostics = async () => {
  console.log('🔍 Running frontend diagnostics...');
  
  // Auth status check
  console.log('Checking authentication status...');
  const authStatus = checkAuthStatus();
  
  // API connection check
  console.log('Checking API connection...');
  const apiStatus = await checkApiConnection();
  
  // Storage check  
  console.log('Examining localStorage...');
  const storageStatus = examineStorage();
  
  // Environment check
  const environmentStatus = {
    nodeEnv: import.meta.env.MODE || 'development',
    apiPort: import.meta.env.VITE_API_PORT || '5000 (default)',
    isDevelopment: import.meta.env.DEV === true,
    isProduction: import.meta.env.PROD === true
  };
  
  // Rendering environment 
  const browserInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine ? 'Online' : 'Offline',
    screenSize: `${window.innerWidth}x${window.innerHeight}`
  };

  // Return complete diagnostic results
  const results = {
    timestamp: new Date().toISOString(),
    auth: authStatus,
    api: apiStatus,
    storage: storageStatus,
    environment: environmentStatus,
    browser: browserInfo
  };
  
  console.log('Diagnostics complete:', results);
  return results;
};

// Clear all localStorage and reload
export const resetApplication = () => {
  if (confirm('This will clear all local data and reload the application. Continue?')) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }
};

// Log user out by removing auth token
export const forceLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  window.location.href = '/login';
};

// Function to help troubleshoot common issues
export const troubleshootWhiteScreen = async () => {
  const diagnostics = await runDiagnostics();
  
  // Check for common issues
  const issues = [];
  
  // Authentication issues
  if (!diagnostics.auth.isLoggedIn) {
    issues.push({
      type: 'Authentication',
      message: diagnostics.auth.message,
      severity: 'High',
      solution: 'Clear localStorage and log in again'
    });
  }
  
  // API connection issues
  if (!diagnostics.api.connected) {
    issues.push({
      type: 'API Connection',
      message: diagnostics.api.error || 'Cannot connect to backend server',
      severity: 'High',
      solution: 'Ensure backend server is running on correct port'
    });
  }
  
  // Storage issues
  if (diagnostics.storage.potentialIssues?.length > 0) {
    diagnostics.storage.potentialIssues.forEach(issue => {
      issues.push({
        type: 'Local Storage',
        message: issue,
        severity: 'Medium',
        solution: 'Clear browser storage and log in again'
      });
    });
  }
  
  // If no specific issues found
  if (issues.length === 0) {
    issues.push({
      type: 'Unknown',
      message: 'No specific issues detected. This might be a rendering or code error.',
      severity: 'Medium',
      solution: 'Try clearing cache and reloading, or check console for errors'
    });
  }
  
  return {
    issues,
    diagnostics,
    timestamp: new Date().toISOString()
  };
};

// Export a simple console utility that can be quickly accessed
window.debugCredily = {
  diagnose: runDiagnostics,
  checkAuth: checkAuthStatus,
  checkApi: checkApiConnection,
  checkStorage: examineStorage,
  reset: resetApplication,
  logout: forceLogout,
  troubleshoot: troubleshootWhiteScreen
};

console.log('🛠️ Credily Debug Utility loaded. Access via window.debugCredily in console'); 