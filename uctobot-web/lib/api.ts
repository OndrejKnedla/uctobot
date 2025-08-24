// Always use the main domain for API calls, regardless of current URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://uctobot.vercel.app';

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  console.log('API Call:', url, options);
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      throw new Error(`API call failed: ${response.status} ${errorData}`);
    }

    return response.json();
  } catch (error) {
    console.error('Network error:', error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Požadavek vypršel. Zkuste to prosím znovu.');
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Nelze se připojit k serveru. Zkontrolujte internetové připojení.');
    }
    
    throw error;
  }
}

// Auth API calls
export const authAPI = {
  register: async (userData: { email: string; password: string; ico?: string; company_name?: string }) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  startTrial: async () => {
    const token = localStorage.getItem('token');
    return apiCall('/auth/start-trial', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Onboarding API calls
export const onboardingAPI = {
  validateIco: async (ico: string) => {
    return apiCall(`/onboarding/validate-ico/${ico}`);
  },
};

// Payment API calls
export const paymentsAPI = {
  createCheckoutSession: async (planType: 'monthly' | 'annual') => {
    const token = localStorage.getItem('token');
    return apiCall('/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ plan_type: planType }),
    });
  },
};

// User management
export const userAPI = {
  getProfile: async () => {
    const token = localStorage.getItem('token');
    return apiCall('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Utility functions
export const tokenManager = {
  saveToken: (token: string) => {
    localStorage.setItem('token', token);
    console.log('Token saved to localStorage');
  },
  
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  removeToken: () => {
    localStorage.removeItem('token');
    console.log('Token removed from localStorage');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};