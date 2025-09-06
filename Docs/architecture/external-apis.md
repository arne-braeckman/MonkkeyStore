# External APIs

## 1. Stripe Payment Gateway

Purpose: To securely process payments from customers during the checkout process.

Payment Methods: Credit Card, Bancontact, and PayPal.

Authentication: We'll use a standard, secure method like an API key. The key will be stored securely in our environment variables, never in the codebase.

Key Endpoints Used: We'll use endpoints for creating a payment intent, confirming a payment, and handling webhooks for post-payment events.

## 2. Email Notification Service

Purpose: To send automated transactional emails for order confirmations and shipping updates to customers.

Authentication: We'll use a secure API key or a similar token-based authentication method.
