# API Integration Documentation

## Overview
Frontend to backend API integration for ÚčtoBot landing page.

## Implemented Features

### 1. Button Integration
All main CTA buttons are now connected to backend functionality:

- **Registration buttons** ("Vyzkoušet ZDARMA", "Začít ZDARMA")
  - Redirects to WhatsApp with START message
  - Phone: +420 777 123 456
  - Loading states implemented

- **Pricing buttons**
  - Monthly plan: 299 Kč
  - Annual plan: 2990 Kč (249 Kč effective monthly)
  - WhatsApp integration with plan-specific messages

- **Partner button**
  - Email integration: partner@uctobot.cz
  - Pre-filled subject and body

- **API contact button**
  - Email integration: api@uctobot.cz
  - Pre-filled subject for API interest

### 2. Error Handling
- Error state management
- Loading indicators on all buttons
- Network error handling with user-friendly messages
- Dismissible error notifications

### 3. Environment Configuration
Files created:
- `.env.local` with API_URL and STRIPE_KEY
- `lib/api.ts` with API utility functions

### 4. Backend API Endpoints Ready
Utility functions created for future backend integration:
- `authAPI.register()` - User registration
- `authAPI.login()` - User login
- `authAPI.startTrial()` - Trial activation
- `paymentsAPI.createCheckoutSession()` - Stripe payments
- `onboardingAPI.validateIco()` - Czech company validation
- `userAPI.getProfile()` - User profile

### 5. Testing
- All buttons have onClick handlers
- Error states are implemented
- Loading states prevent double clicks
- Console logging for debugging

## Current Behavior
Since backend is not running, buttons currently:
1. **Registration/Free trial**: Redirect to WhatsApp
2. **Pricing**: Redirect to WhatsApp with plan info
3. **Partner**: Open email client
4. **API contact**: Open email client

## Next Steps
When backend becomes available:
1. Replace WhatsApp redirects with actual API calls
2. Implement Stripe payment integration
3. Add authentication flow
4. Add ICO validation for Czech companies

## Testing URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:8000 (expected)
- WhatsApp: https://wa.me/420777123456

## Files Modified
- `app/page.tsx` - Main landing page with API integration
- `lib/api.ts` - API utility functions
- `.env.local` - Environment variables
- `globals.css` - Already had green theme