
export const getNetworkInfo = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  console.log('🌐 Network Info:', {
    hostname,
    port,
    protocol,
    fullUrl: window.location.href,
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1'
  });
  
  return {
    hostname,
    port,
    protocol,
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1'
  };
};

export const testBackendConnection = async (baseUrl) => {
  try {
    console.log(`🔍 Testing connection to: ${baseUrl}`);
    const response = await fetch(`${baseUrl}/test-connection`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ Backend connection successful');
      return true;
    } else {
      console.log('❌ Backend connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connection error:', error.message);
    return false;
  }
};
