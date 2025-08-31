# Implemented Features

## Cart-wise Coupons
- **Description:** These coupons provide discounts based on the total cart value, applicable when a minimum threshold is reached. Discounts can be either fixed or percentage-based, and each coupon has an expiration date.
- **Examples:**
  - 10% off on cart totals exceeding ₹1000.
  - ₹100 off on cart totals exceeding ₹1000.

## Product-wise Coupons
- **Description:** These coupons offer discounts on specific products in the cart, ideal for targeted promotions. Discounts can be fixed or percentage-based, and each coupon has an expiration date.
- **Examples:**
  - 15% off on Product X.
  - ₹15 off on Product X.

## BxGy Coupons
- **Description:** "Buy X, Get Y" deals allow customers to receive free or discounted items when purchasing a certain quantity of other items. Limits can be set on the number of free or discounted products, and each coupon has an expiration date.
- **Example:** Buy 2 items from Category A, get 1 item from Category B free.

# Unimplemented Features

Coupon management is a broad and interesting area, with many possible scenarios. While several types have been considered, only the main ones have been implemented due to time constraints.

## Other Potential Coupon Types
- **Free Shipping:** Free shipping for carts above a specified value (e.g., free shipping for orders over ₹1,000).
- **Bundle Discount:** Discounts for purchasing specific products together (e.g., buy Product A and Product B together to get ₹200 off).
- **Category-Wise Discount:** Discounts on all products within a particular category (e.g., 15% off on all electronics).
- **Seasonal/Occasional Discounts:** Special offers for festivals or events (e.g., 20% off on winter wear during Christmas).
- **First-Time Purchase Coupon:** Special discounts for first-time buyers (e.g., ₹200 off on first purchase above ₹500).
- **Loyalty Coupons:** Discounts based on customer loyalty points or past purchases (e.g., ₹50 off for every 500 loyalty points redeemed).
- **Referral Discounts:** Discounts for customers who refer others (e.g., ₹100 off for both referrer and referee).
- **User-Specific Coupons:** Coupons tailored for specific user segments (e.g., 10% off for users who haven’t purchased in the last 3 months).

# Limitations

- **No Integration with User, Cart, or Product Tables:** This project focuses solely on the coupon management system and does not include integration with user, cart, or product tables.

# Assumptions

- **Cart and Product Data:** It is assumed that cart and product details (such as product IDs, prices, and quantities) are provided as input when applying coupons. There is no direct integration with cart or product tables.
- **User Context:** The system does not consider user-specific information (such as roles or purchase history) when determining coupon applicability. All coupons are considered universally applicable unless restricted by their conditions.
- **Coupon Types:** Only cart-wise, product-wise, and BxGy coupons are supported. Additional types can be added as needed.
- **Error Handling:** The system assumes that all inputs (cart data, coupon details, etc.) are valid and well-formed. Basic error handling is included, but advanced validation is not implemented.

# API Endpoints

The following endpoints are available for managing and applying coupons:

- **POST /api/coupons:** Create a new coupon with details such as type, discount value, applicable products, and restrictions.
- **GET /api/coupons:** Retrieve all available coupons.
- **GET /api/coupons/:id:** Retrieve a specific coupon by its ID.
- **PUT /api/coupons/:id:** Update coupon details for a given ID.
- **DELETE /api/coupons/:id:** Delete a coupon by ID.
- **POST /api/applicable-coupons:** Retrieve and calculate all applicable coupons for a given cart.
- **POST /api/apply-coupon/:id:** Apply a specific coupon to a cart and return the updated cart with discounted prices.

# Setup Instructions

Before running the application, follow these steps:

## Environment Setup

1. Create a `.env` file in the root directory.
2. Add the following environment variables to the `.env` file:

   ```plaintext
    PORT=3000
    NODE_ENV="development"
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=coupon_management_monk
    DB_DIALECT=mysql
    DB_HOST=127.0.0.1
   ```

3. Install dependencies:
   ```
   npm i
   ```
4. Start the development server:
   ```
   node start
   ```