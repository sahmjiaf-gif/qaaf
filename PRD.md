# Product Requirements Document (PRD)

## Project: QAAF Luxury Beauty Store

### Version: 1.0
### Document Status: Draft for approval
### Prepared for: Product, Engineering, Operations, and Business stakeholders

---

## 1. Executive Summary

QAAF is a premium beauty and fragrance e-commerce platform focused on luxury skincare, perfumes, and curated beauty products. The platform must deliver a refined customer experience, a streamlined order lifecycle, and a powerful operational dashboard for staff and administrators.

The product combines:
- a luxury storefront with premium branding and editorial-style presentation
- a shopping cart and checkout flow for online orders
- a customer support and WhatsApp-like bot experience
- order tracking, shipping coordination, and payment verification
- an admin operations dashboard for inventory, staff, payments, and marketing

The business goal is to transform the brand into a premium, trust-driven online retail experience that supports product sales, customer retention, and operational control with a low-friction support workflow.

---

## 2. Product Vision

To build a luxury online commerce platform that gives customers confidence, product discovery, and an elegant checkout experience while equipping the business with operational tools to manage sales, support, inventory, staffing, and customer communication in one connected system.

---

## 3. Problem Statement

The brand currently needs a digital commerce experience that can:
- present the business as premium and trustworthy
- allow customers to purchase products easily
- support a modern support process without losing conversations
- handle payment proof validation and shipping confirmation
- give staff a reliable admin console to manage orders and support tickets

Without a robust system, the company risks:
- poor conversion due to weak product experience and checkout flow
- support confusion and delays
- payment disputes or missed confirmations
- inconsistent communication between customer and staff across devices
- operational inefficiency due to disconnected management tools

---

## 4. Product Goals

### 4.1 Business Goals
- Increase conversion from product discovery to checkout
- Improve customer trust and repeat purchases
- Reduce support ticket resolution time
- Improve operational visibility for teams and managers
- Enable scalable growth without rewriting the platform

### 4.2 User Goals
- Customers can browse luxury products, read details, and purchase confidently
- Support agents can respond to customer issues without losing context
- Staff can track orders, shipping, and payment proof in real time
- Admins can manage branding, products, review activity, and operational workflows

---

## 5. Target Users

### 5.1 End Customers
- Shopping online for beauty, skincare, and fragrance products
- Prefer premium branding, clear product information, and trust signals
- Often interact with support through WhatsApp-style bot or customer service chat

### 5.2 Store Staff / Support Agents
- Handle customer questions and issues
- Review pending orders and payment proof
- Assign tickets, resolve open cases, and update statuses

### 5.3 Administrators / Business Owners
- Manage site branding, products, offers, pricing, staff assignments, and warehouse activity
- Monitor payments, order performance, reviews, and customer satisfaction

---

## 6. Core Product Requirements

### 6.1 Storefront Requirements
The storefront must:
- display premium branded visuals and luxury aesthetic presentation
- show categories, product cards, hero banners, offers, and promotional content
- allow customers to browse products with search and filtering
- let users add products to cart, update quantity, and remove items
- support product detail pages with pricing, stock information, and variant selection
- allow users to place orders with address and shipping details
- support order confirmation and messaging after purchase

### 6.2 Checkout and Payment Requirements
The checkout flow must:
- capture customer details and shipping information
- calculate shipping fees based on an order or region
- validate discount or promo code application
- support order submission and payment-status tracking
- allow customers to submit payment proof for shipping-related fee confirmation
- compare the paid amount with required shipping fee and classify the transaction as valid or incomplete

### 6.3 Customer Support Requirements
Support system must:
- allow a customer to open a support ticket from bot/chat flow
- determine whether the issue is shipping, payment, or general support
- route customers to support queue when staff are unavailable
- support customer conversation messaging with system prompts and agent replies
- allow the same ticket to sync across devices and sessions
- maintain support ticket history without duplicate or overwritten messages
- support assignment to an available staff member when applicable

### 6.4 Admin Dashboard Requirements
Admin dashboard must:
- show live overview of orders, support tickets, staff, and inventory
- support order status updates from pending to approved, shipped, delivered, or cancelled
- manage products and stock
- manage staff permissions and availability
- manage support queue assignment and resolution
- review customer orders and payment-proofs
- configure branding, logo, colors, and store layout settings
- manage marketing offers, social links, and store content

---

## 7. User Stories

### 7.1 Customer Stories
- As a customer, I want to browse luxury products so that I can discover items I like.
- As a customer, I want to view product details and pricing so that I can decide whether to buy.
- As a customer, I want to add items to my cart so that I can prepare an order.
- As a customer, I want to place an order with shipping information so that I can complete my purchase.
- As a customer, I want to send payment-proof details if required so that my order can be verified.
- As a customer, I want to receive support replies so that my questions are resolved quickly.

### 7.2 Staff Stories
- As a support agent, I want to see open tickets so that I can handle them by priority.
- As a support agent, I want to assign tickets to myself so that I can manage my workload.
- As a support agent, I want to see a customer’s order and payment status so that I can validate the request accurately.
- As an operations staff member, I want to update order status so that customers know their order progress.

### 7.3 Admin Stories
- As an admin, I want to update branding and store identity so that the storefront matches the business vision.
- As an admin, I want to add and manage products so that stock and campaigns stay current.
- As an admin, I want to monitor staff activity and support queue so that service quality remains consistent.
- As an admin, I want to manage offers and promotions so that sales goals are met.

---

## 8. Functional Requirements

### 8.1 Storefront & Catalog
FR-01: The system shall display a premium landing page with hero content, offers, and product categories.
FR-02: The system shall render product cards showing name, price, image, and sale state.
FR-03: The system shall support product detail views with description and stock status.
FR-04: The system shall support filtering and browsing by category or product type.
FR-05: The system shall support cart operations including add, remove, and quantity updates.
FR-06: The system shall maintain an order summary with accurate totals and shipping fees.

### 8.2 Orders & Checkout
FR-07: The system shall capture shipping information, including governorate, city, address, and landmark.
FR-08: The system shall calculate order totals including discounts and shipping fee.
FR-09: The system shall create an order record in the database upon checkout submission.
FR-10: The system shall assign the order to a staff member when required by business rules.
FR-11: The system shall update order status through defined lifecycle states.
FR-12: The system shall allow cancellation where appropriate.

### 8.3 Payment Verification
FR-13: The system shall accept payment proof text or image input from customer support flow.
FR-14: The system shall extract or validate a monetary amount from payment proof messages.
FR-15: The system shall compare the amount to the required shipping fee.
FR-16: If the amount matches or exceeds the expected fee, the order shall be marked as approved/confirmed.
FR-17: If the amount is insufficient, the order shall remain pending and a note shall be kept for review.
FR-18: The system shall record sender phone and payment state metadata with the order.

### 8.4 Support System
FR-19: The system shall create a support ticket when a customer initiates contact.
FR-20: The system shall identify customer intent using the support message content.
FR-21: The system shall route shipping or payment issues to relevant support logic.
FR-22: The system shall detect queue load and inform customers if staff are busy.
FR-23: The system shall keep messaging synchronized across sessions and devices.
FR-24: The system shall allow multiple messages in a single ticket without duplicating content.
FR-25: The system shall support assigning tickets to a staff member.
FR-26: The system shall allow support resolution or closure when the issue is complete.

### 8.5 Branding & Store Configuration
FR-27: The system shall allow admin configuration of primary colors, secondary colors, and accent colors.
FR-28: The system shall allow asset selection for logo and hero image.
FR-29: The system shall persist branding settings in a central configuration store.
FR-30: The system shall avoid blank or broken branding states when configuration data is incomplete.

### 8.6 Admin Operations
FR-31: The system shall provide an admin login and protected access to operational tools.
FR-32: The system shall display order statistics and support status summaries.
FR-33: The system shall display product inventory statuses and allow stock updates.
FR-34: The system shall support team management and staff status updates.
FR-35: The system shall support review moderation and listing management.
FR-36: The system shall enable sales and campaign configuration through offers and promo codes.

---

## 9. Business Rules

1. Customers can create a support ticket only with valid contact data or identifiable order metadata.
2. Pending orders are the primary target for payment-proof validation.
3. Only the shipping fee amount is assessed for verification, not the full order total.
4. If the payment amount is lower than the required shipping fee, the order remains incomplete and requires follow-up.
5. If the payment amount equals or exceeds the shipping fee, the order is approved and proceeds.
6. Support ticket state should be shared across devices and sessions through the database instead of client-local state only.
7. If a support ticket already exists for a customer, new messages should merge into the same ticket rather than creating duplicates.
8. Admin access must be protected and restricted to authorized staff accounts.
9. Brand configuration must preserve default assets even when remote data is missing or stale.
10. Product stock must reflect current inventory and be reduced upon completed orders.

---

## 10. Data Model Overview

### 10.1 Customer
- id
- name
- phone
- email (optional)
- totalSpent
- ordersCount
- lastOrderDate
- customerType
- notes

### 10.2 Product
- id
- name
- category
- price
- salePrice
- isOnSale
- stock
- inStock
- image
- description
- sizes
- colors

### 10.3 Order
- id
- customerName
- phoneNumber
- address
- governorate
- city
- landmark
- products
- status
- date
- shippingFee
- discountAmount
- finalTotal
- paymentStatus
- paymentSenderPhone
- shippingFeePaid
- shippingPaymentNote
- assignedTo

### 10.4 Support Ticket
- id
- customerName
- phone
- message
- imageUrl
- status
- isOpen
- isClosed
- assignedStaffId
- orderId
- orderMatch
- customerIntent
- botStep
- queuePosition
- waitingCount
- availableStaffCount
- createdAt
- updatedAt
- messages[]

### 10.5 Support Message
- id
- sender
- text
- imageUrl
- createdAt

### 10.6 Branding Config
- primaryColor
- secondaryColor
- accentColor
- fontFamily
- heroTitle
- heroSubtitle
- heroImage
- logoImage
- logoSize
- socialLinks
- contactNumber
- footerTextAr
- footerTextEn
- templateId
- offers
- categories

---

## 11. User Experience Requirements

### 11.1 Storefront Experience
The UX must feel premium and editorial, using elevated typography, soft colors, luxury imagery, and structured modules for categories, offers, and product marketing.

### 11.2 Cart & Checkout Experience
The flow must be clear and low-friction: add to cart, review order, enter address, confirm order, and complete payment status tracking.

### 11.3 Support Experience
Support should feel conversational and guided. The bot must ask the minimum number of questions needed to recognize the issue and route it to the right place.

### 11.4 Admin Experience
The admin experience should prioritize speed and clarity with dashboards grouped by operational area: orders, support, catalog, staff, and appearance.

---

## 12. Functional Workflow Examples

### 12.1 Customer Purchase Journey
1. Customer lands on storefront
2. Customer browses products and categories
3. Customer adds items to the cart
4. Customer proceeds to checkout
5. Customer enters shipping information
6. Customer confirms the order
7. System creates order and updates stock/assignment status
8. Customer receives order status and support communication as needed

### 12.2 Payment Verification Workflow
1. Customer reports payment issue or shipping fee concern
2. Bot asks whether the issue is about shipping or payment
3. Bot asks whether payment has already been made
4. If yes, bot requests proof and order reference
5. System compares proof amount to required shipping fee
6. If valid, order is approved
7. If insufficient, order remains pending with note

### 12.3 Support Ticket Workflow
1. Customer opens chat or support request
2. System searches for existing active support ticket by phone
3. If found, system merges new messages into the same ticket
4. System checks queue status and decides whether to route to an agent or wait
5. Admin/support staff view, assign, and resolve ticket
6. Messages remain synchronized across all devices

---

## 13. Non-Functional Requirements

### 13.1 Performance
- Home page and product pages should load quickly under regular traffic conditions
- Support messages and updates should render without visible lag
- Admin dashboards should respond smoothly with data refreshes

### 13.2 Reliability
- App must remain stable when partial or stale Firebase data is present
- Support ticket merge logic must prevent message loss or duplicate creation
- Default asset fallback must prevent broken branding or blank-page issues

### 13.3 Security
- Admin authentication must be protected
- Support and order data must be stored securely in Firebase collections
- Sensitive operational data must not be exposed to the public storefront

### 13.4 Scalability
- The platform must support growth in products, orders, and support volume
- The data model should remain extendable for marketing, CRM, and operational reporting

### 13.5 Accessibility
- UI must be usable on mobile and desktop
- Interfaces must support Arabic and English content
- Form fields and actions must be clearly labeled

---

## 14. Technical Constraints and Architecture

### 14.1 Platform Stack
- Frontend: React + Vite
- Styling: Tailwind / CSS-based themes
- Database: Firebase Firestore
- Realtime Database: Firebase RTDB for presence and system event support
- Storage: Firebase Storage for assets and uploaded files
- Hosting: Static deployment compatible with GitHub Pages / static hosting patterns

### 14.2 Constraints
- Product must remain Firebase-first and not require a full rewrite to a backend framework
- The app must support static hosting and deploy reliably in a production environment
- The platform must preserve business logic while staying manageable for a small-to-mid-sized operational team

---

## 15. Success Metrics

### Customer Metrics
- conversion rate from product view to checkout
- average order value
- repeat purchase rate
- support resolution time
- customer satisfaction / ticket closure quality

### Operational Metrics
- number of tickets resolved per agent
- support queue time
- order processing time
- stock accuracy
- delayed payment or incomplete payment recovery rate

### Product Metrics
- storefront session engagement
- product page engagement rate
- return visitor rate
- bounce rate for product and checkout pages

---

## 16. Risks and Dependencies

### Risks
- data duplication in support tickets across client devices
- stale branding or missing assets causing visual defects
- incomplete or invalid payment-proof amount extraction
- limited staff availability causing queue delays
- deployment incompatibility between static hosting and app routing

### Dependencies
- stable Firebase project configuration
- correct Firestore collection structure and database rules
- valid logo and image assets
- admin user account setup
- proper staffing and support assignment workflows

---

## 17. Release Scope

### MVP Scope
- storefront and landing page
- catalog and product detail pages
- cart and checkout flow
- order lifecycle status management
- support bot and ticket system
- admin dashboard essentials
- branding settings and static asset support

### Future Enhancements
- advanced analytics dashboards
- customer segmentation and CRM automation
- WhatsApp outbound messaging workflows
- loyalty programs and referral features
- more advanced payment integrations and reconciliation

---

## 18. Acceptance Criteria

### Storefront Acceptance
- The storefront loads with a branded luxury design and correct logo rendering
- Product cards, pages, and categories display correctly on desktop and mobile
- Cart and checkout are functional and order data is stored

### Support Acceptance
- Customer support conversations are visible across devices
- A duplicated or repeated message does not overwrite the ticket history
- Support queue and assignment logic are functioning
- Payment proof validation correctly compares payment amount with required fee

### Admin Acceptance
- Admin dashboard loads protected content only for valid staff/admin users
- Orders, support tickets, and products are visible and maintainable
- Staff can assign and resolve support tickets
- Admin can update branding and key promotional settings

---

## 19. Open Questions

- Should the support bot be entirely chat-based or also support WhatsApp outbound messaging?
- Do we need full customer authentication for purchase tracking beyond contact details?
- What are the final shipping-fee rules by city/governorate?
- Is there a preferred payment provider for production beyond proof-based validation?
- Should the admin dashboard include advanced analytics in the first release or later phases?

---

## 20. Recommendation

The current product direction is sound and aligned to a premium direct-to-consumer beauty brand. The focus should remain on operational reliability, clean customer support synchronization, and a polished brand experience. The most critical technical priorities are:

1. reliable shared support ticket synchronization
2. consistent production deployment behavior
3. robust payment-proof validation workflow
4. premium but efficient admin operations

These priorities are essential to building a trustworthy, scalable store that supports both growth and customer confidence.

---

## 21. Appendix A: Suggested Product Roadmap

### Phase 1 – Launch Readiness
- premium storefront polish
- product catalog and order flow
- basic admin dashboard
- support bot routing
- branding configuration

### Phase 2 – Operational Optimization
- advanced queue management
- fulfillment tracking
- payment proof automation
- customer insights and CRM improvements

### Phase 3 – Growth Expansion
- retention features
- loyalty and campaigns
- analytics and reporting
- multi-channel communication

---

## 22. Sign-off

This PRD should be reviewed and approved by:
- Product Owner
- Engineering Lead
- Operations Manager
- Business Owner / Brand Stakeholder

Approval confirms that the required scope, workflow, and success criteria are accepted before implementation proceeds into full production rollout.
