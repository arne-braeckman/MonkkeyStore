# Data Models

## Product

Purpose: To store all product-related information, including details for both physical goods and customization options.

Key Attributes:
- name: The name of the product.
- description: A detailed description of the product.
- price: The price of the product.
- images: A list of high-quality image URLs.
- videos: A list of video URLs to showcase the product.
- stock: The current inventory level.
- customization_options: An array that defines each personalization area.

Relationships: A Product can be part of many GiftBox models.

## Order

Purpose: To track all customer purchases, from the moment an order is placed to when it is delivered.

Key Attributes:
- customer_id: A reference to the Customer model.
- items: A list of products and their specific personalization details.
- status: The current status of the order.
- total_price: The total cost of the order.
- shipping_info: The customer's shipping address.

Relationships: An Order belongs to a single Customer and contains multiple Product or GiftBox models.

## Customer

Purpose: To store customer data, which is required for processing orders and communication.

Key Attributes:
- name: The customer's full name.
- email: The customer's email address.
- phone_number: The customer's phone number.
- address: The customer's billing and shipping addresses.

Relationships: A Customer can place many Order models.

## GiftBox

Purpose: To store a collection of products that a customer has assembled into a gift box.

Key Attributes:
- items: A list of strings (references to products collection IDs).
- totalPrice: The combined price of all products in the gift box.
- personalizationMessage: A message for the gift box as a whole.

Relationships: A GiftBox contains multiple Product models.

## CorporateBillingInfo

Purpose: To store corporate-specific billing and tax information.

Key Attributes:
- customer_id: A reference to the Customer model.
- company_name: The name of the company.
- tax_id: The company's tax identification number.
- billing_contact: The name and email of the billing contact.

Relationships: A CorporateBillingInfo model belongs to one Customer.
