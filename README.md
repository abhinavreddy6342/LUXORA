<div align="center">

# ✨ LUXORA

### AI-Native Full-Stack E-Commerce Platform

**Agentic commerce powered by React, FastAPI, SQLAlchemy, Groq, JWT authentication, marketplace vendors, intelligent recommendations, and automated commerce workflows.**

<p>
  <a href="https://luxora-psi.vercel.app/">
    🌐 Live Demo
  </a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://luxora-backend-9xyg.onrender.com/">
    ⚡ API
  </a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://github.com/abhinavreddy6342/LUXORA">
    💻 Source Code
  </a>
</p>

</div>

---

> **LUXORA is a full-stack, AI-native commerce platform that combines customer shopping, marketplace vendors, inventory, orders, authentication, multi-agent AI, recommendations, conversation memory, and automated communication into one integrated system.**

---


## 🚀 About LUXORA

**LUXORA** is a modern full-stack e-commerce platform built to demonstrate how a real-world commerce application can be designed, integrated, secured, and deployed as a complete software product.

The platform combines a premium customer shopping experience with an **AI-native commerce layer**, secure authentication, multi-agent orchestration, database-driven recommendations, marketplace vendor management, inventory workflows, order processing, automated email communication, and cloud deployment.

LUXORA goes beyond a traditional CRUD e-commerce application by connecting **frontend engineering, backend architecture, AI agents, business workflows, databases, and deployment infrastructure** into one cohesive system.

### Core Engineering Areas

**Full-Stack Development • REST API Design • Authentication • Database Integration • AI Agents • Agent Orchestration • Recommendation Systems • E-Commerce Architecture • Vendor Management • Inventory Management • Email Automation • Cloud Deployment**

---

# 🌟 Key Features

## 🛍️ Customer Shopping Experience

* Product discovery and browsing
* Product search and filtering
* Category and subcategory organization
* Detailed product pages
* Quick-view product experience
* Product ratings and reviews
* Wishlist management
* Smart shopping cart
* Quantity management
* Delivery address management
* Responsive premium UI
* Mobile-friendly shopping experience

---

# 🤖 LUXORA AI — Agentic Commerce Layer

LUXORA includes a **multi-agent AI architecture** designed to assist customers throughout the shopping journey.

Instead of using an LLM only as a chatbot, LUXORA uses specialized agents connected to real application data.

## 🧠 AI Agents

| Agent                  | Responsibility                                                                   |
| ---------------------- | -------------------------------------------------------------------------------- |
| 🛍️ Shopping Agent     | Understand natural-language shopping requests and find matching catalog products |
| 📦 Product Agent       | Product information, product details, and product comparisons                    |
| ✨ Recommendation Agent | Recommend complementary products from the real catalog                           |
| 🛒 Cart Agent          | Analyze customer cart contents and provide commerce insights                     |
| 📋 Order Agent         | Provide order-related summaries and assistance                                   |
| 🎯 Orchestrator        | Detect intent and coordinate specialized agents and workflows                    |

---

## 🔥 AI Capabilities

* Natural-language shopping
* Budget-aware product search
* Category detection
* Product ID extraction
* Product comparison
* Deterministic product ranking
* Rating-aware ranking
* Stock-aware ranking
* Review-aware ranking
* Complementary product recommendations
* Cart analysis
* Order assistance
* Context-aware follow-up questions
* Conversation memory
* Multi-agent routing
* Agent-to-agent handoffs
* Verified database-grounded product responses

---

# 🧩 Multi-Agent Architecture

```text
                         CUSTOMER
                            │
                            ↓
                     ┌──────────────┐
                     │ LUXORA AI    │
                     │ Orchestrator │
                     └──────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ↓                 ↓                 ↓
   Shopping Agent     Product Agent    Recommendation Agent
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ↓               ↓
               Cart Agent      Order Agent
                    │               │
                    └───────┬───────┘
                            ↓
                    REAL LUXORA DATABASE
```

---

# 🔄 AI Shopping Workflow

Example request:

```text
"Find me a premium watch under ₹20,000"
```

LUXORA processes the request through:

```text
Natural Language Request
          ↓
Intent Detection
          ↓
Budget Extraction
          ↓
Category Detection
          ↓
Search Query Construction
          ↓
Real Database Search
          ↓
Deterministic Ranking
          ↓
Verified Product Results
          ↓
LLM Explanation
          ↓
Product Cards + AI Response
```

### Grounded AI

The AI layer is designed so that product recommendations come from the actual LUXORA catalog.

The LLM is not allowed to invent:

* Product names
* Prices
* Stock
* Specifications
* Catalog products
* Order creation
* Payment completion

This keeps the AI experience grounded in application data.

---

# 🧠 Deterministic Product Ranking

LUXORA combines AI understanding with deterministic backend logic.

Products can be scored using signals such as:

```text
Category Match
      +
Query Relevance
      +
Budget Fit
      +
Product Rating
      +
Stock Availability
      +
Review Count
      ↓
Match Score
      ↓
Ranked Products
```

This creates a more reliable recommendation pipeline than allowing the LLM to independently invent product choices.

---

# 🔗 Agent-to-Agent Handoff

LUXORA supports multi-agent workflows such as:

```text
Customer Request
      ↓
Shopping Agent
      ↓
Real Catalog Products
      ↓
Recommendation Agent
      ↓
Complementary Products
      ↓
AI Explanation
      ↓
Customer
```

For example:

```text
"Show me good watches under ₹20,000 and suggest
something that goes well with the best one."
```

The Shopping Agent can identify the relevant products, after which the Recommendation Agent can continue the workflow using those verified results.

---

# 💬 Conversation Memory

LUXORA supports conversational follow-ups so customers do not always need to repeat their original request.

Examples:

```text
"Find me premium shoes under ₹10,000"

        ↓

"Which one is better?"

        ↓

"Tell me more about the second one."

        ↓

"What goes well with this?"
```

The AI layer resolves product references using conversation context and previously returned product results.

---

# 🔐 Authentication & Security

LUXORA includes a complete authentication system.

## Customer Authentication

* Customer registration
* Customer login
* JWT-based authentication
* Protected routes
* Authenticated API requests
* Secure password hashing
* User-role handling
* Session-aware frontend behavior

## Vendor Authentication

* Vendor registration
* Vendor login
* Vendor-only protected routes
* Business identity management
* Role-based backend authorization

---

# 🔑 Password Recovery

LUXORA includes an OTP-based password reset workflow.

```text
Forgot Password
      ↓
Enter Registered Email
      ↓
Generate Secure OTP
      ↓
Send OTP Email
      ↓
Verify OTP
      ↓
Create New Password
      ↓
Hash New Password
      ↓
Update Account
      ↓
Return to Login
```

### Password reset security includes

* Six-digit OTP generation
* OTP expiration
* One-time OTP usage
* Verification expiration
* Password validation
* Secure password hashing
* Account-existence protection in reset responses

---

# 🏪 Vendor Marketplace Portal

LUXORA also functions as a marketplace platform with a dedicated business portal.

## Vendor Features

* Vendor registration
* Vendor authentication
* Business profile management
* Product creation
* Product editing
* Product publishing
* Product archiving
* Inventory management
* Stock updates
* Vendor order management
* Customer information
* Delivery information
* Order status updates
* Business dashboard
* Marketplace synchronization

---

# 📦 Vendor Product Workflow

```text
Vendor Registration
        ↓
Business Dashboard
        ↓
Create Product
        ↓
Publish Product
        ↓
Product Appears in Marketplace
        ↓
Customer Purchases
        ↓
Vendor Receives Order
        ↓
Manage Fulfillment
        ↓
Update Order Status
```

---

# 📊 Vendor Dashboard

The business portal provides visibility into:

* Total products
* Active products
* Out-of-stock products
* Order items
* Revenue
* Inventory
* Product status
* Customer orders
* Delivery information
* Business profile

---

# 📦 Complete Order Management

LUXORA implements a real backend order workflow.

## Customer Order Flow

```text
Browse Products
      ↓
Add to Cart
      ↓
Checkout
      ↓
Choose Delivery Address
      ↓
Select Payment Method
      ↓
Confirm Order
      ↓
Validate Products
      ↓
Validate Stock
      ↓
Calculate Pricing
      ↓
Create Order
      ↓
Create Order Items
      ↓
Reduce Inventory
      ↓
Generate Receipt
      ↓
Send Email
      ↓
Order Success
```

### Order capabilities

* Backend order creation
* Product validation
* Stock validation
* Quantity validation
* Coupon support
* Discount calculation
* Delivery charge calculation
* Final total calculation
* Order history
* Order details
* Order status tracking
* Vendor order visibility
* Customer delivery information

---

# 💳 Payment Workflows

LUXORA supports multiple payment-method workflows:

* Cash on Delivery
* UPI
* Credit / Debit Card

> **Important:** Online payment methods are currently implemented as application workflows and selected payment states. A production payment gateway must be integrated before accepting real online card or UPI payments.

---

# 📧 Automated Email Workflows

LUXORA includes an automated email service connected to customer workflows.

## Password Reset

```text
Customer
   ↓
Forgot Password
   ↓
OTP Generated
   ↓
Email Service
   ↓
Customer Registered Email
```

## Order Receipt

```text
Order Confirmed
      ↓
Receipt Generated
      ↓
Email Service
      ↓
Customer Registered Email
```

### Receipt includes

* Order ID
* Order date
* Customer name
* Customer email
* Delivery address
* Ordered products
* Quantity
* Unit price
* Line totals
* Subtotal
* Discount
* Delivery charge
* Final total
* Payment method
* Order status

---

# 🗄️ Database Architecture

LUXORA uses a SQL database with **SQLAlchemy ORM**.

The backend persists data for:

* Users
* Vendor profiles
* Products
* Product inventory
* Cart items
* Wishlist items
* Orders
* Order items
* Addresses
* Reviews
* Vendor ownership
* Marketplace relationships

### Data Flow

```text
React Frontend
      ↓
FastAPI REST API
      ↓
Routers / Services
      ↓
SQLAlchemy ORM
      ↓
SQL Database
```

---

# ⚡ Backend Architecture

The backend follows a modular FastAPI structure with separate application responsibilities.

```text
backend/
│
├── app/
│   ├── ai/
│   │   ├── agents/
│   │   │   ├── cart_agent.py
│   │   │   ├── order_agent.py
│   │   │   ├── product_agent.py
│   │   │   ├── recommendation_agent.py
│   │   │   └── shopping_agent.py
│   │   │
│   │   ├── llm.py
│   │   ├── memory.py
│   │   ├── orchestrator.py
│   │   ├── prompts.py
│   │   └── tools.py
│   │
│   ├── routers/
│   │   ├── ai.py
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── cart.py
│   │   ├── wishlist.py
│   │   ├── reviews.py
│   │   ├── addresses.py
│   │   ├── orders.py
│   │   ├── checkout.py
│   │   └── vendor.py
│   │
│   ├── services/
│   │   └── email_service.py
│   │
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   └── main.py
```

---

# 🎨 Frontend Architecture

The frontend is built with **React + Vite** using reusable components, contexts, pages, and services.

```text
frontend/
│
├── src/
│   ├── components/
│   │   ├── LuxoraAI.jsx
│   │   ├── ProductCard.jsx
│   │   └── QuickViewModal.jsx
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ShopContext.jsx
│   │
│   ├── pages/
│   │   ├── Shop.jsx
│   │   ├── ProductDetails.jsx
│   │   ├── Checkout.jsx
│   │   ├── Payment.jsx
│   │   ├── OrderSuccess.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── VerifyResetCode.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── VendorLogin.jsx
│   │   ├── VendorRegister.jsx
│   │   └── VendorDashboard.jsx
│   │
│   └── services/
│       └── aiService.js
```

---

# 🛠️ Technology Stack

## Frontend

* React
* JavaScript
* Vite
* Tailwind CSS
* React Router
* Axios
* Context API
* Framer Motion
* Lucide React

## Backend

* Python
* FastAPI
* REST APIs
* SQLAlchemy
* Pydantic
* Uvicorn
* JWT Authentication
* Argon2 Password Hashing

## AI

* Groq
* LangChain
* LLM-based intent understanding
* Multi-agent architecture
* Agent orchestration
* Conversation memory
* Deterministic product ranking
* Database-grounded recommendations

## Database

* SQL Database
* SQLAlchemy ORM

## Email

* Gmail SMTP
* OTP email automation
* Order receipt automation

## Development & Deployment

* Git
* GitHub
* Vercel
* Render
* Environment Variables
* Production CORS Configuration

---

# 🔗 API Architecture

## Authentication APIs

```text
POST /auth/register
POST /auth/login
POST /auth/forgot-password
POST /auth/verify-reset-code
POST /auth/reset-password
POST /auth/vendor/register
POST /auth/vendor/login
GET  /auth/me
```

## Commerce APIs

```text
GET  /products
GET  /products/{id}
GET  /cart
POST /cart
GET  /wishlist
GET  /addresses
GET  /reviews
POST /orders
GET  /orders
GET  /orders/{id}
```

## Vendor APIs

```text
GET    /vendor/profile
PUT    /vendor/profile
GET    /vendor/dashboard
GET    /vendor/products
POST   /vendor/products
PUT    /vendor/products/{id}
DELETE /vendor/products/{id}
PUT    /vendor/products/{id}/stock
GET    /vendor/orders
PUT    /vendor/orders/{id}/status
```

## AI API

```text
POST /ai/chat
```

---

# ☁️ Cloud Deployment Architecture

LUXORA uses a separated frontend/backend deployment model.

```text
                     INTERNET
                        │
                        ↓
              ┌─────────────────┐
              │ React Frontend  │
              │     Vercel      │
              └────────┬────────┘
                       │
                       │ HTTPS
                       ↓
              ┌─────────────────┐
              │ FastAPI Backend │
              │     Render      │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ↓            ↓            ↓
      Database       AI Layer    Email Service
```

---

# 🌐 Live Deployment

## LUXORA AI / Frontend

**Live Application**

https://luxora-psi.vercel.app

## LUXORA AI / Backend

**Live FastAPI API**

https://luxora-backend-9xyg.onrender.com

## GitHub Repository

https://github.com/abhinavreddy6342/LUXORA

---

# 🔐 Environment Configuration

Sensitive configuration is stored using environment variables.

Example:

```env
GROQ_API_KEY=your_api_key
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TEMPERATURE=0.1

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_sender@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_sender@gmail.com

LUXORA_SECRET_KEY=your_secret_key
```

> Never commit API keys, passwords, SMTP credentials, JWT secrets, or other private credentials to GitHub.

---

# 🧪 Production-Style Features

LUXORA includes several practices commonly found in real-world applications:

### API Validation

Requests are validated with Pydantic schemas before reaching business logic.

### Role-Based Authorization

Customer and vendor access are separated through authenticated roles.

### Database Ownership

Products and order items preserve vendor ownership information for marketplace workflows.

### Secure Secret Management

API keys and credentials are supplied through environment variables rather than source code.

### Production CORS

The backend explicitly allows the deployed frontend origin.

### Error Handling

Frontend and backend API failures are handled with user-facing messages and backend logging.

### Immediate UI Updates

Actions such as inventory changes and product state updates update the interface immediately while the backend remains the source of truth.

---

# 📈 Engineering Highlights

LUXORA demonstrates experience with:

```text
Frontend Engineering
        +
Backend API Engineering
        +
Database Design
        +
Authentication & Security
        +
AI Agent Architecture
        +
Recommendation Systems
        +
Marketplace Workflows
        +
Email Automation
        +
Cloud Deployment
        ↓
Complete Full-Stack Product
```

---

# 💡 What Makes LUXORA Different?

Traditional e-commerce projects often demonstrate:

```text
Products
Cart
Checkout
Orders
```

LUXORA extends that foundation with:

```text
Products
   +
Cart
   +
Checkout
   +
Orders
   +
Authentication
   +
Vendor Marketplace
   +
Inventory Management
   +
AI Shopping Agent
   +
Recommendation Agent
   +
Product Agent
   +
Cart Agent
   +
Order Agent
   +
Conversation Memory
   +
Multi-Agent Orchestration
   +
Automated Email
   +
Cloud Deployment
```

This creates a complete **AI-native commerce system** rather than a simple storefront.

---

# 🔮 Future Enhancements

Potential next-stage improvements include:

* Real payment gateway integration
* Semantic vector search
* Product embeddings
* Personalized recommendations using purchase history
* AI-powered customer segmentation
* Vendor analytics
* Advanced catalog search
* Redis-backed production conversation memory
* Background email workers
* Structured application logging
* Automated testing
* CI/CD pipelines
* Dockerized production deployments
* Observability and monitoring
* Recommendation model optimization

---

# 🏆 Project Value

LUXORA demonstrates practical ability across the complete software development lifecycle:

```text
Design
  ↓
Frontend Development
  ↓
Backend Development
  ↓
Database Integration
  ↓
Authentication
  ↓
AI Integration
  ↓
Multi-Agent Orchestration
  ↓
Business Workflows
  ↓
Email Automation
  ↓
Testing & Debugging
  ↓
Cloud Deployment
  ↓
Production-Style Application
```

It showcases the ability to build **integrated systems**, not just individual features.

---

# 👨‍💻 Skills Demonstrated

**Software Development • Full-Stack Engineering • React • FastAPI • Python • JavaScript • REST APIs • SQLAlchemy • SQL • JWT • Authentication • Secure Password Hashing • AI Agents • LangChain • Groq • LLMs • Agent Orchestration • Recommendation Systems • E-Commerce Architecture • Marketplace Systems • Inventory Management • Email Automation • Git • GitHub • Vercel • Render • Cloud Deployment • Problem Solving**

---

# ⭐ Why LUXORA Matters

LUXORA was built to explore how **modern full-stack engineering and agentic AI can work together inside a real commerce application**.

The project combines:

> **Customer Experience + Backend Engineering + Real Database Data + Specialized AI Agents + Marketplace Operations + Secure Authentication + Automated Communication + Cloud Infrastructure**

---

## ✨ Final

**LUXORA is more than an e-commerce website.**

It is an **AI-native commerce platform** demonstrating how a modern software system can connect:

**Users → Products → Cart → Checkout → Orders → Vendors → Inventory → AI Agents → Recommendations → Email → Cloud Infrastructure**

---

### Built with ❤️, curiosity, and a lot of engineering.

## **LUXORA**

### *Elevated commerce, powered by intelligent systems.*
