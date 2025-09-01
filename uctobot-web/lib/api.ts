// Use local backend during development, production backend in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://uctobot.vercel.app'
);

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

  startFoundingMember: async () => {
    const token = localStorage.getItem('token');
    return apiCall('/auth/start-founding-member', {
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
  createCheckoutSession: async (planType: 'monthly' | 'annual', customerData: { name: string; email: string }) => {
    const plan = planType === 'monthly' ? 'MONTHLY' : 'YEARLY';
    
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan,
        isFoundingMember: true,
        customerName: customerData.name,
        customerEmail: customerData.email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    
    if (data.url) {
      // Redirect to Stripe Checkout immediately
      window.location.href = data.url;
    }

    return data;
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