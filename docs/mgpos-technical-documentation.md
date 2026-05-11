# MGPOS - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Integration](#api-integration)
7. [Component Architecture](#component-architecture)
8. [State Management](#state-management)
9. [Hooks and Utilities](#hooks-and-utilities)
10. [Firebase Integration](#firebase-integration)
11. [Build and Deployment](#build-and-deployment)
12. [Testing Strategy](#testing-strategy)
13. [Development Guidelines](#development-guidelines)
14. [Security Considerations](#security-considerations)
15. [Performance Optimization](#performance-optimization)
16. [Payment Method Reports](#payment-method-reports)
17. [Troubleshooting for Developers](#troubleshooting-for-developers)
18. [Future Development Roadmap](#future-development-roadmap)

---

## System Architecture

### Overview
MGPOS is a modern web-based Point of Sale system built with React and Firebase, following a component-based architecture with real-time data synchronization.

### Architecture Patterns
- **Component-Based Architecture**: Modular React components with clear separation of concerns
- **Context API for State Management**: Global state management using React Context
- **Firebase as Backend**: Real-time NoSQL database with authentication
- **Progressive Web App (PWA)**: Offline capabilities and mobile optimization
- **Multi-Organization Support**: Tenant-based architecture with data isolation

### Data Flow
1. **Client Actions** → React Components
2. **State Management** → Context Providers
3. **API Calls** → Firebase Firestore
4. **Real-time Updates** → Firestore Listeners
5. **UI Updates** → Component Re-renders

---

## Technology Stack

### Frontend
- **React 19.2.5**: UI framework with hooks and concurrent features
- **Vite 5.4.19**: Build tool and development server
- **React Router DOM 6.30.3**: Client-side routing
- **TailwindCSS 3.4.19**: Utility-first CSS framework
- **React Hot Toast 2.4.1**: Notification system
- **UUID 14.0.0**: Unique identifier generation

### Backend
- **Firebase 12.12.1**: Backend-as-a-Service platform
  - **Firestore**: NoSQL real-time database
  - **Firebase Authentication**: User authentication
  - **Firebase Hosting**: Web hosting

### Development Tools
- **ESLint 10.2.1**: Code linting and formatting
- **Vitest 4.1.5**: Unit testing framework
- **Testing Library**: React component testing
- **PostCSS 8.5.10**: CSS processing
- **Autoprefixer 10.5.0**: CSS vendor prefixing

### PWA Features
- **Workbox 7.4.0**: Service worker management
- **Vite PWA Plugin 0.20.5**: PWA configuration

---

## Project Structure

```
mgpos/
├── public/
│   └── icons/                 # Application icons
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── AccessManagement.jsx
│   │   ├── CartPanel.jsx
│   │   ├── CustomerManagement.jsx
│   │   ├── CustomerSearchModal.jsx
│   │   ├── MasterDataTab.jsx
│   │   ├── MiscItemModal.jsx
│   │   ├── MultiOrgUserManager.jsx
│   │   ├── Navbar.jsx
│   │   ├── OrgUsersList.jsx
│   │   ├── OrganizationSelector.jsx
│   │   ├── PasswordChangeModal.jsx
│   │   ├── ProductFormModal.jsx
│   │   ├── ProductGrid.jsx
│   │   ├── ProductModal.jsx
│   │   ├── ToastContainer.jsx
│   │   ├── UnifiedUserManager.jsx
│   │   ├── UserOrganizationManager.jsx
│   │   └── UserProfileManager.jsx
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── OrgContext.jsx     # Organization state
│   ├── hooks/                 # Custom React hooks
│   │   ├── useBillingLogs.js
│   │   ├── useCategories.js
│   │   ├── useCustomers.js     # Customer management operations
│   │   ├── useLogs.js
│   │   ├── useOrganizations.js
│   │   ├── useProducts.js
│   │   ├── useReports.js
│   │   └── useSettings.js
│   ├── pages/                 # Page components
│   │   ├── BillingLogsPage.jsx
│   │   ├── CustomersPage.jsx   # Customer management interface
│   │   ├── LoginPage.jsx
│   │   ├── LogsPage.jsx
│   │   ├── POSPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── SuperAdminPage.jsx
│   │   └── SuperAdminPageNew.jsx
│   ├── utils/                 # Utility functions
│   │   ├── logger.js          # Logging utilities
│   │   └── passwordUtils.js
│   ├── App.jsx               # Main application component
│   ├── App.css               # Global styles
│   ├── firebase.js           # Firebase configuration
│   ├── index.css             # Base styles
│   └── main.jsx              # Application entry point
├── scripts/                  # Utility scripts
│   ├── createSuperAdmin.js
│   ├── createSuperAdminNode.js
│   └── runCreateSuperAdmin.js
├── docs/                     # Documentation
├── .firebaserc              # Firebase configuration
├── .gitignore               # Git ignore rules
├── eslint.config.js         # ESLint configuration
├── firebase.json            # Firebase hosting configuration
├── package.json             # Dependencies and scripts
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # TailwindCSS configuration
├── vite.config.js           # Vite configuration
└── vitest.config.js         # Vitest configuration
```

---

## Database Schema

### Firestore Collections

#### Users Collection
```javascript
{
  uid: string,           // Unique user identifier
  username: string,      // Unique username (case-insensitive)
  email: string,         // User email
  fullName: string,      // Full display name
  phone: string,         // Phone number
  role: string,          // 'super_admin', 'admin', 'user'
  orgId: string,         // Organization ID (null for super_admin)
  password: string,      // Hashed password
  isActive: boolean,     // Account status
  createdAt: timestamp,  // Account creation timestamp
  updatedAt: timestamp,  // Last update timestamp
  lastLogin: timestamp   // Last login timestamp
}
```

#### Organizations Collection
```javascript
{
  id: string,            // Organization ID
  name: string,          // Organization name
  address: string,       // Physical address
  phone: string,         // Contact phone
  email: string,         // Contact email
  taxId: string,         // Tax identifier
  businessType: string,   // Business type
  isActive: boolean,     // Organization status
  createdAt: timestamp,  // Creation timestamp
  updatedAt: timestamp   // Last update timestamp
}
```

#### Products Collection
```javascript
{
  id: string,            // Product ID
  orgId: string,         // Organization ID
  name: string,          // Product name
  description: string,   // Product description
  categoryId: string,    // Category ID
  price: number,         // Selling price
  cost: number,          // Cost price
  unit: string,          // Unit of measure
  stock: number,         // Current stock quantity
  minStock: number,      // Minimum stock level
  isActive: boolean,     // Product status
  createdAt: timestamp,  // Creation timestamp
  updatedAt: timestamp   // Last update timestamp
}
```

#### Categories Collection
```javascript
{
  id: string,            // Category ID
  orgId: string,         // Organization ID
  name: string,          // Category name
  description: string,   // Category description
  parentId: string,      // Parent category ID (for sub-categories)
  color: string,         // Category color code
  isActive: boolean,     // Category status
  sortOrder: number,    // Display order
  createdAt: timestamp,  // Creation timestamp
  updatedAt: timestamp   // Last update timestamp
}
```

#### Customers Collection
```javascript
{
  id: string,            // Customer ID
  orgId: string,         // Organization ID
  name: string,          // Customer full name
  phone: string,         // Phone number (optional)
  email: string,         // Email address (optional)
  address: string,       // Physical address (optional)
  creditBalance: number, // Current credit balance
  totalPurchases: number, // Total purchase amount
  purchaseCount: number, // Number of purchases made
  lastPurchaseDate: timestamp, // Date of last purchase
  isActive: boolean,     // Customer status
  createdAt: timestamp,  // Creation timestamp
  updatedAt: timestamp   // Last update timestamp
}
```

#### Credit History System

The credit history system provides comprehensive tracking of all credit transactions for customers, including purchases, payments, and adjustments with running balance calculations.

##### Credit Transaction Types
```javascript
export const CreditTransactionType = {
  PURCHASE: 'purchase',    // Credit purchases (negative impact on balance)
  PAYMENT: 'payment',      // Customer payments (positive impact on balance)
  ADJUSTMENT: 'adjustment'  // Manual adjustments (positive or negative)
}
```

##### Credit History Data Structure
```javascript
// Credit History Subcollection (organizations/{orgId}/customers/{customerId}/creditHistory)
{
  id: string,                    // Transaction ID
  type: 'purchase' | 'payment' | 'adjustment', // Transaction type
  amount: number,                // Transaction amount (always positive)
  description: string,           // Transaction description
  oldBalance: number,            // Balance before transaction
  newBalance: number,            // Balance after transaction
  runningBalance: number,        // Calculated running balance (for display)
  createdAt: timestamp,          // Transaction timestamp
  createdBy: string,             // User who created transaction
  createdByName: string,         // User's display name
  orgId: string,                 // Organization ID
  customerId: string,            // Customer ID
  customerName: string           // Customer name
}
```

##### Credit History Hook Implementation
```javascript
// useCreditHistory.js
export function useCreditHistory(customerId) {
  // Real-time credit history fetching
  const transactions = calculateRunningBalance()
  
  const addCreditTransaction = async (transactionData) => {
    // Add transaction to credit history subcollection
    // Log transaction creation
  }
  
  return { transactions, loading, addCreditTransaction }
}

export function useCreditSummary(customerId) {
  // Calculate summary statistics
  const summary = {
    totalCredit: number,        // Current credit balance
    totalPurchases: number,     // Total purchase amount
    totalPayments: number,      // Total payment amount
    totalAdjustments: number,   // Total adjustment amount
    transactionCount: number    // Number of transactions
  }
  
  return { summary, loading }
}
```

##### Credit Balance Update Flow
1. **Credit Purchase**: 
   - CartPanel calls `updateCreditBalance()` with negative amount
   - Transaction type: `PURCHASE`
   - Balance decreases by purchase amount

2. **Customer Payment**:
   - Admin calls `updateCreditBalance()` with positive amount
   - Transaction type: `PAYMENT`
   - Balance increases by payment amount

3. **Manual Adjustment**:
   - Admin calls `updateCreditBalance()` with any amount
   - Transaction type: `ADJUSTMENT`
   - Balance adjusts accordingly

##### Credit History UI Components

**CreditHistoryModal Component**:
- Displays comprehensive credit history with running balances
- Shows summary cards for current balance, payments, purchases, and transactions
- Color-coded transaction types (green for payments, red for purchases, yellow for adjustments)
- Responsive design for mobile, tablet, and desktop views
- Real-time updates via Firebase listeners

**Key Features**:
- Transaction filtering and sorting
- Running balance calculation
- Transaction details with timestamps and user attribution
- Export functionality for credit reports
- Search and pagination for large transaction histories

##### Integration Points

**CustomerManagement.jsx**:
- Added credit history button for each customer
- Modal integration for viewing detailed credit history
- Real-time balance updates after transactions

**CartPanel.jsx**:
- Automatic credit history logging for credit purchases
- Transaction type classification as `PURCHASE`
- Integration with receipt numbers for audit trail

**useCustomers.js**:
- Enhanced `updateCreditBalance()` function with transaction logging
- Automatic transaction type detection
- Credit history subcollection updates

##### Running Balance Calculation
```javascript
const calculateRunningBalance = () => {
  let balance = 0
  const transactionsWithBalance = transactions.slice().reverse().map(transaction => {
    if (transaction.type === CreditTransactionType.PURCHASE) {
      balance -= transaction.amount
    } else if (transaction.type === CreditTransactionType.PAYMENT) {
      balance += transaction.amount
    } else if (transaction.type === CreditTransactionType.ADJUSTMENT) {
      balance += transaction.amount
    }
    
    return {
      ...transaction,
      runningBalance: balance
    }
  }).reverse() // Reverse back to chronological order (newest first)
  
  return transactionsWithBalance
}
```

##### Credit History Security
- All credit transactions are logged with user attribution
- Transaction timestamps prevent tampering
- Running balance calculations ensure audit trail integrity
- Organization-based data isolation for multi-tenant security

#### Customer Management Validation

The customer management system includes client-side validation to ensure data integrity:

##### Form Validation Rules
- **Customer Name**: Required field, must not be empty
- **Phone**: Optional field, accepts any format
- **Email**: Optional field, accepts any format (server-side validation recommended)
- **Address**: Optional field, free text input

##### Validation Implementation
```javascript
// Customer form validation in CustomerFormModal
const handleSubmit = (e) => {
  e.preventDefault()
  if (!formData.name.trim()) {
    addToast('Customer name is required', 'error')
    return
  }
  onSave(formData)
}
```

**Key Validation Features**:
- Prevents empty customer names
- Provides clear error messages
- Form submission is prevented when validation fails

##### Currency Display
- Customer credit balances and total purchases display using organization's configured currency symbol
- Currency symbol is dynamically retrieved from organization settings via `useSettings` hook
- Supports multiple currencies: USD ($), EUR (€), GBP (£), JPY (¥), INR (₹), LKR (Rs), CAD (CA$), AUD (A$), SGD (S$), MYR (RM)
- Credit balance updates show appropriate currency symbol in success messages
- Null/undefined credit balance values are handled gracefully without display errors

#### Sales Collection
```javascript
{
  id: string,            // Sale ID
  orgId: string,         // Organization ID
  userId: string,        // User who made the sale
  receiptNo: string,     // Receipt number
  cart: array,           // Array of sale items
  subtotal: number,      // Subtotal before tax
  discountAmount: number, // Discount amount
  taxAmount: number,     // Tax amount
  total: number,         // Total amount
  itemCount: number,     // Number of items
  paymentMethod: string, // Payment method: 'cash', 'card', 'digital', 'credit', 'split'
  paymentDetails: object, // Payment method details
  customer: object,       // Customer information (if applicable)
  customerId: string,     // Customer ID (if applicable)
  cashierId: string,     // Cashier ID
  cashierName: string,   // Cashier name
  billingSettings: object, // Billing settings snapshot at checkout time
  createdAt: timestamp,  // Sale timestamp
  updatedAt: timestamp   // Last update timestamp
}
```

#### Discount Application Logic

The discount system ensures that discounts are always applied based on the billing settings at the time of checkout, not current settings that may have changed after the sale.

**Checkout-Time Settings Snapshot**
- When a sale is processed, a snapshot of current billing settings is captured
- All discount calculations use this snapshot for consistency
- The snapshot is stored with the sale record for audit purposes

**Discount Modes**
1. **Global Mode**: Single discount percentage applied to entire cart
2. **Item Mode**: Individual item discounts override global settings
3. **Category Mode**: Category-specific discounts applied to qualifying items

**Discount Priority Order**
1. Cart-level override (user-entered currency discount)
2. Item-level discount (when enabled)
3. Category-level discount (when enabled)
4. Global discount (when enabled)

**Implementation Details**
```javascript
// CartPanel.jsx - Checkout function
const handleCheckout = async () => {
  // Capture billing settings snapshot at checkout time
  const billingSettingsSnapshot = { ...settings }
  
  // Recalculate totals using checkout-time settings
  const checkoutSubtotal = cart.reduce((s, item) => 
    s + item.price * item.qty - getItemDiscount(item, billingSettingsSnapshot), 0)
  // ... rest of calculation using billingSettingsSnapshot
  
  // Store snapshot with sale data
  const saleData = {
    // ... other fields
    billingSettings: billingSettingsSnapshot
  }
}
```

#### Enhanced Discount Reporting

The system now provides detailed discount information in all reports and receipts, showing the exact type and amount/percentage of discounts applied to each item.

**Discount Utility Functions**
```javascript
// src/utils/discountUtils.js

// Get detailed discount information for a single item
getItemDiscountDetails(item, settings)
// Returns: { amount, type, percentage, source, description }

// Get comprehensive discount breakdown for entire cart
getCartDiscountBreakdown(cart, settings)
// Returns: { totalDiscount, itemDiscounts[], globalDiscount, discountMode }

// Format discount information for display
formatDiscountForReport(discountDetails)
// Returns: Human-readable discount description
```

**Discount Information Display**
- **Billing Reports**: Shows item-wise discount details with type and percentage
- **Sales Reports**: Includes "Discount Details" column in detailed reports
- **Receipt Printing**: Displays comprehensive discount breakdown
- **Bill Details Modal**: Shows individual item discount information

**Discount Types Supported**
1. **Custom**: User-entered currency discount (e.g., "Custom: $15.00 (7.5%)")
2. **Item**: Individual item percentage or fixed discount (e.g., "Item: 10%")
3. **Category**: Category-specific discounts (e.g., "Category (electronics): 15%")
4. **Global**: Cart-wide percentage discount (e.g., "Global: 10%")

**Report Integration**
```javascript
// Example: Detailed report with discount information
const discountBreakdown = getCartDiscountBreakdown(bill.cart, bill.billingSettings)
const discountDetailsText = discountBreakdown.itemDiscounts
  .filter(item => item.discount.amount > 0)
  .map(item => `${item.itemName}(${item.discount.description})`)
  .join(', ')
```

**Logging and Audit Trail**
- Bill details view logging includes discount presence flag
- Report generation logs capture discount summary information
- All discount calculations use billing settings snapshot for consistency

#### Settings Collection
```javascript
{
  id: string,            // Settings ID (usually orgId)
  orgId: string,         // Organization ID
  businessName: string,  // Business name
  currency: string,      // Currency code
  taxRate: number,       // Default tax rate
  taxEnabled: boolean,   // Whether tax is enabled
  address: string,       // Business address
  phone: string,         // Business phone
  email: string,         // Business email
  receiptHeader: string, // Receipt header text
  receiptFooter: string, // Receipt footer text
  masterCategories: array, // Master categories list
  unitsOfMeasure: array,  // Units of measure list
  // Discount Configuration
  discountMode: string,   // Discount mode: 'global', 'category', or 'item'
  globalDiscount: number, // Global discount percentage (when mode is 'global')
  categoryDiscounts: object, // Category-wise discounts (when mode is 'category')
  cartDiscountEnabled: boolean, // Allow cart discount override
  reprintEnabled: boolean, // Allow bill reprint
  miscEnabled: boolean,   // Allow miscellaneous items
  creditPurchaseEnabled: boolean, // Enable credit purchases (default: false)
  defaultQuantities: array, // Default quick quantities
  storeInfo: {           // Store information
    name: string,
    address: string,
    phone: string,
    footer: string
  },
  loggingEnabled: boolean, // Whether activity logging is enabled (default: false)
  updatedAt: timestamp   // Last update timestamp
}
```

#### Logs Collection
```javascript
{
  id: string,            // Log ID
  orgId: string,         // Organization ID
  userId: string,        // User who performed action
  action: string,        // Action type
  details: object,       // Action details
  timestamp: timestamp,  // Action timestamp
  ipAddress: string,     // User IP address
  userAgent: string      // User agent string
}
```

#### BillingLogs Collection
```javascript
{
  id: string,            // Billing log ID
  orgId: string,         // Organization ID
  userId: string,        // User who performed action
  action: string,        // Billing action type
  details: object,       // Billing details
  amount: number,        // Amount involved
  timestamp: timestamp,  // Action timestamp
  ipAddress: string,     // User IP address
  userAgent: string      // User agent string
}
```

---

## Authentication & Authorization

### Authentication Flow
1. **Login Attempt**: User enters credentials
2. **User Lookup**: Query Firestore for username
3. **Password Verification**: Hash comparison with stored password
4. **Session Creation**: Store user data in localStorage
5. **Context Update**: Update AuthContext with user data
6. **Route Protection**: Protected routes check authentication

### Role-Based Access Control (RBAC)

#### Super Admin
- Access all organizations
- Manage global settings
- Create/manage organizations
- Access system-wide reports and logs
- Manage all users

#### Admin
- Access assigned organization only
- Manage organization users
- Configure organization settings
- Access organization reports
- Manage products and categories

#### Regular User
- Access POS functionality
- View products and inventory
- Process sales transactions
- Access basic reports
- Manage own profile

### Route Protection Implementation
```javascript
// ProtectedRoute wrapper for authenticated users
function ProtectedRoute({ children }) {
  const { user, loading, initializing } = useAuth()
  
  if (loading || initializing) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// AdminRoute wrapper for admin users
function AdminRoute({ children }) {
  const { user, loading, initializing, isAdmin } = useAuth()
  
  if (loading || initializing) return <LoadingSpinner />
  if (!user || !isAdmin) return <Navigate to="/" replace />
  return children
}

// SuperAdminRoute wrapper for super admin users
function SuperAdminRoute({ children }) {
  const { user, loading, initializing, isSuperAdmin } = useAuth()
  
  if (loading || initializing) return <LoadingSpinner />
  if (!user || !isSuperAdmin) return <Navigate to="/" replace />
  return children
}
```

---

## API Integration

### Firebase Configuration
```javascript
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

**Note**: Replace the placeholder values with your actual Firebase project configuration. These sensitive values should be stored in environment variables for production deployments.

### Common Firebase Operations

#### Document Operations
```javascript
// Add document
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const addDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

// Update document
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

const updateDocument = async (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

// Delete document
import { doc, deleteDoc } from 'firebase/firestore'

const deleteDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId)
  await deleteDoc(docRef)
}
```

#### Query Operations
```javascript
// Get documents with filters
import { collection, query, where, getDocs } from 'firebase/firestore'

const getFilteredDocuments = async (collectionName, filters) => {
  const q = query(collection(db, collectionName), ...filters)
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Real-time listener
import { collection, query, where, onSnapshot } from 'firebase/firestore'

const subscribeToDocuments = (collectionName, filters, callback) => {
  const q = query(collection(db, collectionName), ...filters)
  return onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(documents)
  })
}
```

---

## Component Architecture

### Component Hierarchy
```
App
├── AuthProvider
├── OrgProvider
├── ToastProvider
└── BrowserRouter
    ├── Routes
    │   ├── LoginPage
    │   └── AppContent
    │       ├── Navbar
    │       └── Routes
    │           ├── POSPage
    │           │   ├── ProductGrid
    │           │   ├── CartPanel
    │           │   └── MiscItemModal
    │           ├── SettingsPage
    │           │   ├── ProductsTab
    │           │   │   └── ProductFormModal
    │           │   ├── CategoriesTab
    │           │   ├── UsersTab
    │           │   │   ├── UserProfileManager
    │           │   │   ├── UserOrganizationManager
    │           │   │   └── PasswordChangeModal
    │           │   └── MasterDataTab
    │           ├── ReportsPage
    │           ├── LogsPage
    │           ├── BillingLogsPage
    │           └── SuperAdminPage
    │               ├── MultiOrgUserManager
    │               └── OrganizationSelector
    └── ToastContainer
```

### Component Patterns

#### Functional Components with Hooks
All components are functional components using React hooks for state management and side effects.

#### Props Interface
```javascript
// Example component interface
const ProductGrid = ({ 
  products, 
  categories, 
  onProductSelect, 
  currencySymbol,
  selectedCategory,
  searchTerm 
}) => {
  // Component implementation
}
```

#### Custom Hooks Integration
Components use custom hooks for data fetching and business logic separation.

#### Error Boundaries
Implement error boundaries for graceful error handling.

---

## State Management

### Context Providers

#### AuthContext
```javascript
// src/contexts/AuthContext.jsx
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  // Authentication logic
  const login = async (username, password, selectedOrgId = null) => {
    // Login implementation
  }

  const logout = () => {
    // Logout implementation
  }

  // Role checking functions
  const isAdmin = userProfile?.role === 'admin'
  const isSuperAdmin = userProfile?.role === 'super_admin'

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading, initializing,
      login, logout, isAdmin, isSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### OrgContext
```javascript
// src/contexts/OrgContext.jsx
export const OrgContext = createContext(null)

export function OrgProvider({ children }) {
  const [selectedOrgId, setSelectedOrgId] = useState(null)
  const [organizations, setOrganizations] = useState([])

  return (
    <OrgContext.Provider value={{
      selectedOrgId, setSelectedOrgId,
      organizations, setOrganizations
    }}>
      {children}
    </OrgContext.Provider>
  )
}
```

### Local State Management
- **useState**: Component-level state
- **useReducer**: Complex state logic
- **useEffect**: Side effects and subscriptions
- **useMemo**: Performance optimization
- **useCallback**: Function memoization

---

## Hooks and Utilities

### Custom Hooks

#### useProducts
```javascript
// src/hooks/useProducts.js
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { selectedOrgId } = useOrg()

  useEffect(() => {
    if (!selectedOrgId) return

    const q = query(
      collection(db, 'products'),
      where('orgId', '==', selectedOrgId),
      where('isActive', '==', true)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setProducts(productsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [selectedOrgId])

  const addProduct = async (productData) => {
    // Add product implementation
  }

  const updateProduct = async (productId, productData) => {
    // Update product implementation
  }

  const deleteProduct = async (productId) => {
    // Delete product implementation
  }

  return { products, loading, addProduct, updateProduct, deleteProduct }
}
```

#### useSettings
```javascript
// src/hooks/useSettings.js
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  // ... more currencies
]

export function useSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const { selectedOrgId } = useOrg()

  useEffect(() => {
    // Settings fetching logic
  }, [selectedOrgId])

  const updateSettings = async (newSettings) => {
    // Update settings implementation
  }

  return { settings, loading, updateSettings }
}
```

### Utility Functions

#### Password Utilities
```javascript
// src/utils/passwordUtils.js
import bcrypt from 'bcryptjs'

export const hashPassword = async (password) => {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

export const verifyPasswordLegacy = async (password, legacyHash) => {
  // Legacy password verification for migration
}
```

#### Logger Utilities
```javascript
// src/utils/logger.js
export const LOG_TYPES = {
  // User actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_SIGNUP: 'user_signup',
  USER_PASSWORD_CHANGE: 'user_password_change',
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_ROLE_CHANGE: 'user_role_change',
  
  // Master data operations
  MASTER_DATA_CREATE: 'master_data_create',
  MASTER_DATA_UPDATE: 'master_data_update',
  MASTER_DATA_DELETE: 'master_data_delete',
  
  // Product operations
  PRODUCT_CREATE: 'product_create',
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_DELETE: 'product_delete',
  
  // Category operations
  CATEGORY_CREATE: 'category_create',
  CATEGORY_UPDATE: 'category_update',
  CATEGORY_DELETE: 'category_delete',
  
  // Billing/Sales operations
  SALE_CREATE: 'sale_create',
  SALE_UPDATE: 'sale_update',
  SALE_DELETE: 'sale_delete',
  SALE_VOID: 'sale_void',
  BILL_REPRINT: 'bill_reprint',
  
  // Organization operations
  ORG_CREATE: 'org_create',
  ORG_UPDATE: 'org_update',
  ORG_DELETE: 'org_delete',
  
  // Settings operations
  SETTINGS_UPDATE: 'settings_update',
  
  // System operations
  SYSTEM_ERROR: 'system_error',
  SYSTEM_WARNING: 'system_warning',
  DATA_IMPORT: 'data_import',
  DATA_EXPORT: 'data_export',
  
  // UI operations
  TOAST_NOTIFICATION: 'toast_notification',
  UI_REFRESH: 'ui_refresh',
  
  // Reporting operations
  REPORT_GENERATE: 'report_generate',
  REPORT_PRINT: 'report_print',
  REPORT_VIEW: 'report_view'
}

// Check if logging is enabled for an organization
export const isLoggingEnabled = async (orgId) => {
  try {
    if (!orgId) return true // System logs always enabled
    
    const settingsRef = doc(db, 'organizations', orgId, 'settings', 'config')
    const settingsSnap = await getDoc(settingsRef)
    
    if (settingsSnap.exists()) {
      const settings = settingsSnap.data()
      return settings.loggingEnabled !== false // Default to enabled
    }
    
    return true // Default to enabled if no settings exist
  } catch (error) {
    console.error('Error checking logging settings:', error)
    return true // Fail-safe to enabled
  }
}

// Create log entry with logging check
export const createLog = async (logData) => {
  const { orgId, ...restOfLogData } = logData
  
  // Check if logging is enabled for this organization
  const loggingEnabled = await isLoggingEnabled(orgId)
  if (!loggingEnabled) {
    return null // Logging disabled, skip creating log
  }
  
  // Create log entry...
}

export const logUserAction = async (actionType, description, user, orgId, metadata = {}) => {
  return createLog({
    type: actionType,
    level: LOG_LEVELS.INFO,
    description,
    userId: user.id,
    userName: user.displayName || user.username,
    orgId,
    metadata
  })
}
```

### Logging System Features

#### Organization-Based Logging Control
- **Per-Organization Settings**: Each organization can enable/disable logging independently
- **Default State**: Logging is disabled by default for new organizations
- **Super Admin Context**: Super admin operations respect organization logging settings when performed within an organization context
- **System-Level Logs**: Truly system-wide operations (no organization context) are always logged
- **Fail-Safe Behavior**: Errors in checking settings default to enabled to prevent log loss

#### Log Types and Levels
- **Log Levels**: INFO, WARNING, ERROR, SUCCESS
- **Comprehensive Coverage**: User actions, CRUD operations, system events, UI interactions
- **Metadata Support**: Additional context data stored with each log entry

#### Storage Locations
- **Global Logs**: All logs stored in `system_logs` collection for super admin access
- **Organization Logs**: Organization-specific logs stored in `organizations/{orgId}/logs` subcollection

#### Super Admin Logging Behavior
Super admin logging behavior depends on the context of the operation:

**Organization-Context Operations** (respect organization settings):
- User management within specific organizations
- Organization updates and configuration changes
- UI refreshes for specific organizations
- Any operation where `orgId` is provided

**System-Level Operations** (always logged):
- Login screen changes (system-wide UI updates)
- System error reporting
- Global system configuration changes
- Operations with no `orgId` (truly system-wide)

**Examples**:
```javascript
// Respects organization logging settings
await logUserAction('user_create', 'Created user in org', superAdmin, 'org123')

// Always logged (system-level)
await logUserAction('ui_change', 'Updated login screen', systemUser, null)
```

#### Performance Considerations
- **Async Operations**: All logging operations are non-blocking
- **Early Exit**: When logging is disabled, functions return early without database operations
- **Error Handling**: Logging failures don't affect main application functionality

---

## Firebase Integration

### Real-time Data Synchronization
- **Firestore Listeners**: Real-time updates for all collections
- **Optimistic Updates**: Immediate UI updates with server synchronization
- **Offline Support**: Local cache for offline functionality
- **Conflict Resolution**: Automatic conflict resolution strategies

### Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own organization's data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.orgId == resource.data.orgId;
    }
    
    // Super admins can access all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.role == 'super_admin';
    }
  }
}
```

### Data Validation
- **Client-side validation**: Form validation before submission
- **Server-side validation**: Security rules enforcement
- **Data sanitization**: Input cleaning and normalization
- **Type checking**: Runtime type validation

---

## Build and Deployment

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint
```

### Build Process
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### Firebase Deployment
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy all
firebase deploy
```

---

## Testing Strategy

### Unit Testing
```javascript
// Example test using Vitest and Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProductGrid from '../components/ProductGrid'

describe('ProductGrid', () => {
  const mockProducts = [
    { id: '1', name: 'Test Product', price: 10.99, stock: 5 }
  ]

  it('renders products correctly', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={vi.fn()}
        currencySymbol="$"
      />
    )
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$10.99')).toBeInTheDocument()
  })

  it('calls onProductSelect when product is clicked', () => {
    const mockSelect = vi.fn()
    render(
      <ProductGrid 
        products={mockProducts} 
        onProductSelect={mockSelect}
        currencySymbol="$"
      />
    )
    
    fireEvent.click(screen.getByText('Test Product'))
    expect(mockSelect).toHaveBeenCalledWith(mockProducts[0])
  })
})
```

### Integration Testing
- **Component Integration**: Test component interactions
- **API Integration**: Test Firebase operations
- **User Workflows**: End-to-end user scenarios
- **Performance Testing**: Load and stress testing

### Test Configuration
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true
  }
})
- **TypeScript**: Gradual migration to TypeScript
- **Component Naming**: PascalCase for components
- **File Naming**: camelCase for utilities, PascalCase for components

### Best Practices

#### Component Development
```javascript
// Good component structure
const ProductCard = ({ product, onSelect, currencySymbol }) => {
  // Hooks at the top
  const [isLoading, setIsLoading] = useState(false)
  
  // Event handlers
  const handleClick = useCallback(() => {
    onSelect(product)
  }, [product, onSelect])
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [])
  
  // Render
  return (
    <div className="product-card" onClick={handleClick}>
      <h3>{product.name}</h3>
      <p>{currencySymbol}{product.price}</p>
    </div>
  )
}

// PropTypes or TypeScript interfaces
ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  currencySymbol: PropTypes.string.isRequired
}
```

#### Hook Development
```javascript
// Custom hook pattern
const useCustomHook = (dependency) => {
  const [state, setState] = useState(initialState)
  
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    }
  }, [dependency])
  
  const memoizedValue = useMemo(() => {
    // Expensive computation
    return computedValue
  }, [state])
  
  return { state, setState, memoizedValue }
}
```

### Performance Optimization
- **React.memo**: Component memoization
- **useMemo**: Value memoization
- **useCallback**: Function memoization
- **Code Splitting**: Lazy loading with React.lazy
- **Virtual Scrolling**: For large lists
- **Debouncing**: Input field optimization

---

## Discount System

### Overview
MGPOS supports a flexible discount system with three modes: Global, Category-wise, and Item-level discounts. The discount configuration is stored in the Settings collection and applied in real-time during cart calculations.

### Discount Modes

#### Global Discount
- Applies a single discount percentage to all items
- Configured in Settings > Billing > Discount Type > Global Discount
- Stored in `settings.globalDiscount` as a percentage value

#### Category-wise Discount
- Allows different discounts per product category
- Configured in Settings > Billing > Discount Type > Category Discount, then manage discounts in Settings > Master Data > Categories
- Stored in `settings.categoryDiscounts` as an object with category IDs as keys
- Each category discount has:
  ```javascript
  {
    enabled: boolean,    // Whether discount is active
    type: string,        // 'percentage' or 'fixed'
    value: number        // Discount value
  }
  ```

#### Item Discount
- Individual product discounts set per product
- Configured in Products tab per product
- Stored in each product document's `discount` field

### Discount Calculation Logic
Discounts are calculated in the following order of precedence:
1. Item-level discount (highest priority)
2. Category-wise discount
3. Global discount (lowest priority)

### Implementation Details

#### Category Discount Update Function
```javascript
const updateCategoryDiscount = (category, field, value) => {
  const current = settings.categoryDiscounts?.[category] || { 
    enabled: false, 
    type: 'percentage', 
    value: 0 
  }
  updateSettings({
    categoryDiscounts: {
      ...settings.categoryDiscounts,
      [category]: { ...current, [field]: value },
    },
  })
}
```

#### Cart Discount Application
```javascript
// Category-level discount calculation
if (mode === 'category') {
  const catDisc = settings?.categoryDiscounts?.[item.category]
  if (catDisc?.enabled) {
    const lineTotal = item.price * item.qty
    if (catDisc.type === 'percentage') {
      discount = lineTotal * (catDisc.value / 100)
    } else {
      discount = Math.min(catDisc.value * item.qty, lineTotal)
    }
  }
}
```

### UI Components
- **SettingsPage**: Contains discount mode selection and global/item discount configuration
- **MasterDataTab**: Contains category-wise discount configuration in Categories section
- **CartPanel**: Displays and applies discounts
- **ProductGrid**: Shows discounted prices
- **BillingLogsPage**: Reports discount calculations

### Key Features
- Real-time discount updates
- Support for percentage and fixed amount discounts
- Category-wise discount toggle and configuration
- Cart discount override option
- Discount information display in cart and receipts

---

## Security Considerations

### Authentication Security
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure token storage
- **Password Policies**: Minimum requirements
- **Account Lockout**: Failed login protection
- **Two-Factor Authentication**: Optional 2FA support

### Data Security
- **Input Validation**: Client and server-side validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Token-based protection
- **Data Encryption**: Sensitive data encryption

### Firebase Security
```javascript
// Security rules example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own organization's data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.role == 'super_admin');
    }
    
    match /products/{productId} {
      allow read, write: if request.auth != null && 
        request.auth.token.orgId == resource.data.orgId;
    }
  }
}
```

### Environment Security
- **Environment Variables**: Secure configuration
- **API Keys**: Secure key management
- **HTTPS Enforcement**: SSL/TLS requirements
- **CORS Configuration**: Cross-origin security

---

## Performance Optimization

### Frontend Optimization
- **Bundle Size**: Code splitting and tree shaking
- **Image Optimization**: WebP format and lazy loading
- **Caching Strategy**: Service worker implementation
- **Minification**: Production build optimization
- **Compression**: Gzip compression

### Database Optimization
- **Indexing**: Firestore composite indexes
- **Query Optimization**: Efficient query patterns
- **Pagination**: Large dataset handling
- **Caching**: Client-side caching strategies
- **Batch Operations**: Bulk write operations

### Monitoring and Analytics
```javascript
// Performance monitoring
const measurePerformance = (name, fn) => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
  return result
}

// Error tracking
const trackError = (error, context) => {
  console.error('Error:', error, 'Context:', context)
  // Send to error tracking service
}
```

---

## Troubleshooting for Developers

### Common Development Issues

#### Firebase Connection Issues
```javascript
// Check Firebase initialization
import { getApps, getApp } from 'firebase/app'

if (!getApps().length) {
  initializeApp(firebaseConfig)
} else {
  getApp()
}
```

#### State Management Issues
- **Context Updates**: Ensure proper context provider wrapping
- **Memory Leaks**: Cleanup subscriptions in useEffect
- **Infinite Loops**: Check dependency arrays in useEffect

#### Build Issues
- **Import Errors**: Check import paths and file extensions
- **Environment Variables**: Verify .env configuration
- **Dependency Conflicts**: Update package-lock.json

### Debugging Tools
- **React DevTools**: Component inspection
- **Redux DevTools**: State inspection (if using Redux)
- **Firebase Emulator**: Local development testing
- **Browser DevTools**: Performance and network debugging

### Performance Debugging
```javascript
// Performance profiling
const profileComponent = (Component) => {
  return (props) => {
    useEffect(() => {
      const startTime = performance.now()
      return () => {
        const endTime = performance.now()
        console.log(`Component render time: ${endTime - startTime}ms`)
      }
    })
    return <Component {...props} />
  }
}
```

---

## Future Development Roadmap

### Planned Features
1. **Advanced Reporting**: Custom report builder
2. **Inventory Management**: Stock tracking and alerts
3. **Customer Management**: Customer database and loyalty
4. **Supplier Management**: Supplier and purchase orders
5. **Mobile App**: Native mobile applications
6. **API Integration**: Third-party service integrations
7. **Advanced Analytics**: Business intelligence features
8. **Multi-Language Support**: Internationalization

### Technical Improvements
1. **TypeScript Migration**: Full TypeScript adoption
2. **Microservices Architecture**: Backend service separation
3. **Advanced Caching**: Redis implementation
4. **Real-time Notifications**: WebSocket implementation
5. **Advanced Security**: Enhanced security features
6. **Performance Monitoring**: APM integration
7. **Automated Testing**: CI/CD pipeline improvements
8. **Documentation**: API documentation generation

### Development Guidelines for Contributors
1. **Code Review Process**: Pull request requirements
2. **Testing Requirements**: Minimum test coverage
3. **Documentation**: Documentation requirements
4. **Branch Strategy**: Git workflow guidelines
5. **Release Process**: Version management
6. **Performance Standards**: Performance benchmarks

---

## API Documentation (for Future REST API)

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/profile
```

### Product Endpoints
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

### Sales Endpoints
```
GET  /api/sales
POST /api/sales
GET  /api/sales/:id
GET  /api/sales/reports
```

### User Management Endpoints
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

---

## Contributing Guidelines

### Development Environment Setup
1. Clone the repository
2. Install dependencies with `npm install`
3. Set up Firebase configuration
4. Start development server with `npm run dev`
5. Run tests to verify setup

### Code Submission Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Submit pull request
5. Code review and approval
6. Merge to main branch

### Code Quality Standards
- **ESLint**: Pass all linting rules
- **Tests**: Minimum 80% code coverage
- **Documentation**: Update relevant documentation
- **Performance**: No performance regressions
- **Security**: Follow security best practices

---

## Payment Method Reports

### Architecture Overview

The Payment Method Reports feature is built as an extension to the existing reporting system in the MGPOS application. It follows a modular architecture that separates concerns between data filtering, calculation logic, and UI presentation.

### System Architecture

#### Component Structure

```
src/
├── pages/
│   └── ReportsPage.jsx              # Main reporting interface
├── hooks/
│   └── useReports.js                # Core data fetching and processing
├── test/
│   ├── ReportsPagePaymentMethods.test.jsx  # UI component tests
│   └── useReports.test.jsx          # Hook functionality tests
```

#### Data Flow

1. **User Interaction** → ReportsPage.jsx
2. **Report Type Selection** → Payment method filtering logic
3. **Data Processing** → useReports hook + filtering functions
4. **Summary Calculation** → Payment-specific summary functions
5. **UI Rendering** → Dynamic report components
6. **Export/Print** → Formatted output generation

### Core Components

#### 1. ReportsPage.jsx (Main Component)

**Location**: `src/pages/ReportsPage.jsx`

**Key Responsibilities**:
- UI rendering for report type selection
- Integration with payment method filtering logic
- Print functionality for payment method reports
- Multi-organization support

**New State Variables**:
```javascript
const [reportType, setReportType] = useState('summary') // 'summary', 'detailed', 'cash', 'card'
```

**Key Functions Added**:

##### `filterReportsByPaymentMethod(reports, method)`
Filters billing logs based on payment method with split payment handling.

**Parameters**:
- `reports`: Array of billing log objects
- `method`: Payment method filter ('cash', 'card', 'digital', 'credit')

**Returns**: Filtered array of billing logs

**Logic**:
```javascript
const filterReportsByPaymentMethod = (reports, method) => {
  return reports.filter(bill => {
    if (method === 'cash') {
      return bill.paymentMethod === 'cash' || (bill.paymentMethod === 'split' && bill.paymentDetails?.cashAmount > 0)
    } else if (method === 'card') {
      return bill.paymentMethod === 'card' || (bill.paymentMethod === 'split' && bill.paymentDetails?.cardAmount > 0)
    } else if (method === 'digital') {
      return bill.paymentMethod === 'digital'
    } else if (method === 'credit') {
      return bill.paymentMethod === 'credit'
    }
    return true
  })
}
```

##### `calculatePaymentMethodSummary(reports, method)`
Calculates summary statistics for specific payment methods.

**Parameters**:
- `reports`: Array of billing log objects
- `method`: Payment method for calculation

**Returns**: Summary object with transaction metrics

**Key Calculations**:
- Transaction count
- Gross sales (sum of all item prices × quantities)
- Total discounts (item-level + global)
- Net sales (gross - discounts)
- Total amount (payment method specific)

**Split Payment Handling**:
```javascript
if (method === 'cash' && bill.paymentMethod === 'split') {
  totalAmount += bill.paymentDetails?.cashAmount || 0
} else if (method === 'card' && bill.paymentMethod === 'split') {
  totalAmount += bill.paymentDetails?.cardAmount || 0
} else {
  totalAmount += bill.total || 0
}
```

#### 2. UI Components

##### Report Type Buttons
New buttons added to report type selection:
- "Cash Sales" - Filters for cash transactions
- "Card Sales" - Filters for card transactions
- "Digital Sales" - Filters for digital transactions
- "Credit Sales" - Filters for credit transactions

##### Dynamic Summary Cards
Summary cards update based on selected report type:
```javascript
{(() => {
  if (reportType === 'cash' || reportType === 'card' || reportType === 'digital' || reportType === 'credit') {
    const paymentSummary = calculatePaymentMethodSummary(reports, reportType)
    return (
      // Payment method specific summary cards
    )
  } else {
    return (
      // Standard summary cards
    )
  }
})()}
```

##### Payment Method Summary Tables
Dynamic table generation based on report type:
- Column headers adjust for payment method context
- Split payment details section for cash/card reports
- Totals calculated with payment-specific logic

### Print Functionality

#### Enhanced Print Templates

The print functionality was extended to support payment method reports:

**Template Structure**:
```javascript
${(reportType === 'cash' || reportType === 'card' || reportType === 'digital' || reportType === 'credit') ? `
  <div class="section-title">${reportType === 'cash' ? 'Cash Sales' : reportType === 'card' ? 'Card Sales' : reportType === 'digital' ? 'Digital Sales' : 'Credit Sales'} Details</div>
  <table>
    <!-- Payment method specific table content -->
  </table>
  
  ${filterReportsByPaymentMethod(reports, reportType).some(bill => bill.paymentMethod === 'split') ? `
    <div class="section-title">Split Payment Details</div>
    <table>
      <!-- Split payment breakdown table -->
    </table>
  ` : ''}
` : ''}

${reportType === 'detailed' ? `
  <div class="section-title">Bill Details</div>
  <table>
    <thead>
      <tr>
        <th>Receipt #</th>
        <th>Date/Time</th>
        <th>Cashier</th>
        <th>Payment Method</th>
        <th class="text-right">Items</th>
        <th class="text-right">Gross</th>
        <th class="text-right">Discount</th>
        <th class="text-right">Net</th>
      </tr>
    </thead>
    <tbody>
      <!-- Detailed transaction rows with payment method data -->
    </tbody>
  </table>
` : ''}
```

**Dynamic Report Title**:
```javascript
<title>${reportType === 'cash' ? 'Cash Sales Report' : reportType === 'card' ? 'Card Sales Report' : reportType === 'digital' ? 'Digital Sales Report' : reportType === 'credit' ? 'Credit Sales Report' : 'Sales Report'}</title>
```

### Data Models

#### Billing Log Structure

The system works with the existing billing log data structure:

```javascript
{
  id: string,
  receiptNo: string,
  createdAt: timestamp,
  cashierName: string,
  paymentMethod: 'cash' | 'card' | 'digital' | 'credit' | 'split',
  total: number,
  itemCount: number,
  cart: Array<{
    name: string,
    price: number,
    qty: number,
    // ... other item properties
  }>,
  discountAmount: number,
  // Split payment specific
  paymentDetails?: {
    cashAmount: number,
    cardAmount: number,
    digitalAmount: number,
    creditAmount: number
  },
  // Customer information for credit sales
  customer?: {
    id: string,
    name: string,
    phone: string
  }
}
```

#### Summary Data Structure

Payment method summary objects follow this structure:

```javascript
{
  transactionCount: number,
  grossSales: number,
  totalDiscounts: number,
  netSales: number,
  totalAmount: number
}
```

### Algorithm Implementation

#### Split Payment Distribution Algorithm

The core algorithm for handling split payments across different report types:

1. **Cash Report Calculation**:
   - Include all `paymentMethod: 'cash'` transactions
   - Include cash portion from `paymentMethod: 'split'` transactions
   - Exclude pure card and credit transactions

2. **Card Report Calculation**:
   - Include all `paymentMethod: 'card'` transactions
   - Include card portion from `paymentMethod: 'split'` transactions
   - Exclude pure cash and credit transactions

#### Filtering Logic Pseudocode

```javascript
function filterByPaymentMethod(reports, method) {
  return reports.filter(bill => {
    switch(method) {
      case 'cash':
        return isCashTransaction(bill)
      case 'card':
        return isCardTransaction(bill)
      default:
        return true
    }
  })
}

function isCashTransaction(bill) {
  return bill.paymentMethod === 'cash' || 
         (bill.paymentMethod === 'split' && bill.paymentDetails?.cashAmount > 0)
}

function isCardTransaction(bill) {
  return bill.paymentMethod === 'card' || 
         (bill.paymentMethod === 'split' && bill.paymentDetails?.cardAmount > 0)
}
```

### Performance Optimizations

#### Efficient Filtering

1. **Single Pass Filtering**: Reports are filtered once per report type
2. **Memoization**: Summary calculations cached for repeated access
3. **Lazy Loading**: Detailed tables rendered only when needed

#### Memory Management

1. **Data Pagination**: Large datasets handled through pagination
2. **Garbage Collection**: Proper cleanup of event listeners and subscriptions
3. **State Management**: Efficient state updates to prevent unnecessary re-renders

#### Database Query Optimization

The existing `useReports` hook handles database optimization:
- Indexed queries on timestamp fields
- Organization-based filtering at database level
- Efficient document fetching with limits

### Error Handling

#### Data Validation

1. **Missing Payment Details**: Graceful handling of incomplete split payment data
2. **Zero Amount Payments**: Proper filtering of zero-value split portions
3. **Null Values**: Safe navigation through optional properties

#### Error Boundaries

1. **Component-Level**: Error boundaries around report components
2. **Data Processing**: Try-catch blocks around calculation functions
3. **User Feedback**: Clear error messages for data issues

#### Fallback Behavior

```javascript
// Handle missing payment details
if (bill.paymentMethod === 'split' && !bill.paymentDetails) {
  console.warn('Split payment missing payment details:', bill.receiptNo)
  return false // Exclude from filtering
}

// Handle zero amounts
if (bill.paymentMethod === 'split' && bill.paymentDetails?.cashAmount === 0) {
  return false // Don't include in cash reports
}
```

### Testing Strategy

#### Unit Tests

**Location**: `src/test/useReports.test.jsx`

**Coverage**:
- Payment method filtering logic
- Split payment calculation accuracy
- Edge cases (missing data, zero amounts)
- Summary calculation precision

**Test Categories**:
1. **Filtering Tests**: Verify correct transaction inclusion/exclusion
2. **Calculation Tests**: Validate summary calculations
3. **Edge Case Tests**: Handle malformed data gracefully
4. **Performance Tests**: Ensure acceptable performance with large datasets

#### Integration Tests

**Location**: `src/test/ReportsPagePaymentMethods.test.jsx`

**Coverage**:
- UI component rendering
- User interaction flows
- Print functionality
- Multi-organization scenarios

**Test Scenarios**:
1. **Report Generation**: Verify all report types generate correctly
2. **Split Payment Display**: Ensure proper split payment handling
3. **Print Output**: Validate print template generation
4. **User Interface**: Test button states and transitions

#### Test Data Strategy

**Mock Data Structure**:
```javascript
const mockPaymentMethodLogs = [
  { paymentMethod: 'cash', total: 100.00 },
  { paymentMethod: 'card', total: 75.50 },
  { 
    paymentMethod: 'split', 
    total: 125.00,
    paymentDetails: { cashAmount: 75.00, cardAmount: 50.00 }
  },
  { paymentMethod: 'credit', total: 45.00 }
]
```

### Security Considerations

#### Data Access Control

1. **Role-Based Access**: Existing authentication system controls report access
2. **Organization Filtering**: Users can only access their organization's data
3. **Data Sanitization**: All user inputs sanitized before processing

#### Sensitive Data Protection

1. **Customer Information**: Limited customer data exposure in reports
2. **Payment Details**: Secure handling of payment information
3. **Audit Logging**: All report generation actions logged

#### Input Validation

```javascript
// Validate payment method parameter
const validMethods = ['cash', 'card']
if (!validMethods.includes(method)) {
  throw new Error('Invalid payment method')
}

// Validate payment details structure
if (bill.paymentMethod === 'split') {
  if (!bill.paymentDetails || typeof bill.paymentDetails !== 'object') {
    console.warn('Invalid payment details for split payment:', bill.receiptNo)
    return false
  }
}
```

### Browser Compatibility

#### Supported Browsers

1. **Chrome**: Full support (latest version)
2. **Firefox**: Full support (latest version)
3. **Safari**: Full support (latest version)
4. **Edge**: Full support (latest version)

#### Feature Compatibility

1. **ES6+ Features**: Modern JavaScript features used
2. **CSS Grid/Flexbox**: Modern layout techniques
3. **Print API**: Standard browser print functionality
4. **Local Storage**: Used for report preferences

#### Polyfills

No additional polyfills required beyond existing application dependencies.

### Deployment Considerations

#### Environment Variables

No new environment variables required for this feature.

#### Database Schema

No database schema changes required - uses existing billing logs structure.

#### Build Process

The feature integrates with the existing build process:
- React components compiled with existing webpack configuration
- Test files included in existing test suite
- Documentation included in build artifacts

### Monitoring & Analytics

#### Performance Metrics

1. **Report Generation Time**: Track time to generate reports
2. **Database Query Performance**: Monitor query execution times
3. **Memory Usage**: Track memory consumption during report generation

#### User Analytics

1. **Report Type Usage**: Track which report types are most used
2. **Print Frequency**: Monitor how often reports are printed
3. **Error Rates**: Track report generation failures

#### Logging Strategy

```javascript
// Report generation logging
try {
  await logUserAction(
    'REPORT_GENERATE',
    `Generated ${reportType} report for ${period}`,
    userProfile,
    currentOrgId,
    {
      reportType,
      period,
      transactionCount: reports.length,
      summary: currentSummary
    }
  )
} catch (logError) {
  console.error('Failed to log report generation:', logError)
}
```

### Future Extensibility

#### Planned Enhancements

1. **API Endpoints**: RESTful endpoints for report data access
2. **WebSocket Support**: Real-time report updates
3. **Advanced Filtering**: More sophisticated filtering options
4. **Custom Reports**: User-defined report configurations

#### Extension Points

1. **Payment Method Support**: Easy addition of new payment methods
2. **Report Templates**: Customizable report templates
3. **Export Formats**: Additional export format support
4. **Integration Hooks**: Points for third-party integrations

#### Code Architecture for Extensibility

```javascript
// Extensible payment method filter
const paymentMethodFilters = {
  cash: (bill) => isCashTransaction(bill),
  card: (bill) => isCardTransaction(bill),
  // Future payment methods can be added here
}

// Extensible summary calculator
const summaryCalculators = {
  cash: (reports) => calculatePaymentMethodSummary(reports, 'cash'),
  card: (reports) => calculatePaymentMethodSummary(reports, 'card')
}
```

#### Conclusion

The Payment Method Reports feature demonstrates a well-architected extension to the existing MGPOS reporting system. The implementation follows established patterns while introducing sophisticated payment method filtering and calculation logic. The modular design ensures maintainability, testability, and extensibility for future enhancements.

The technical implementation prioritizes performance, security, and user experience while maintaining compatibility with existing systems. Comprehensive testing and documentation ensure the feature meets both business requirements and technical standards.

### Payment Method Reports API Reference

#### Core Functions

##### `filterReportsByPaymentMethod(reports, method)`

Filters billing logs based on payment method with intelligent split payment handling.

**Signature**:
```javascript
filterReportsByPaymentMethod(reports: Array<BillingLog>, method: string): Array<BillingLog>
```

**Parameters**:
- `reports` (Array<BillingLog>): Array of billing log objects to filter
- `method` (string): Payment method filter. Valid values:
  - `'cash'` - Cash transactions and cash portions of split payments
  - `'card'` - Card transactions and card portions of split payments

**Returns**: Array<BillingLog> - Filtered billing logs

**Example Usage**:
```javascript
const reports = await useReports().reports
const cashReports = filterReportsByPaymentMethod(reports, 'cash')
const cardReports = filterReportsByPaymentMethod(reports, 'card')
```

**Filtering Logic**:
- **Cash**: Includes `paymentMethod: 'cash'` and split payments with `cashAmount > 0`
- **Card**: Includes `paymentMethod: 'card'` and split payments with `cardAmount > 0`

**Error Handling**:
- Returns empty array if `reports` is null/undefined
- Returns empty array if `method` is invalid
- Logs warnings for malformed payment details

##### `calculatePaymentMethodSummary(reports, method)`

Calculates comprehensive summary statistics for payment method reports.

**Signature**:
```javascript
calculatePaymentMethodSummary(reports: Array<BillingLog>, method: string): PaymentSummary
```

**Parameters**:
- `reports` (Array<BillingLog>): Array of billing log objects
- `method` (string): Payment method for calculation ('cash', 'card')

**Returns**: PaymentSummary object with the following structure:
```javascript
{
  transactionCount: number,    // Number of filtered transactions
  grossSales: number,         // Sum of all item prices × quantities
  totalDiscounts: number,     // Sum of all discounts (item + global)
  netSales: number,          // grossSales - totalDiscounts
  totalAmount: number        // Payment method specific total
}
```

**Example Usage**:
```javascript
const reports = await useReports().reports
const cashSummary = calculatePaymentMethodSummary(reports, 'cash')

console.log(`Cash Sales: $${cashSummary.totalAmount}`)
console.log(`Transactions: ${cashSummary.transactionCount}`)
console.log(`Net Sales: $${cashSummary.netSales}`)
```

**Calculation Rules**:
- **Gross Sales**: Sum of `(item.price × item.qty)` for all items
- **Total Discounts**: Sum of item-level discounts + global discounts
- **Net Sales**: `grossSales - totalDiscounts`
- **Total Amount**: Payment method specific (see split payment handling below)

**Split Payment Handling**:
```javascript
// For cash reports: uses cash portion of split payments
if (method === 'cash' && bill.paymentMethod === 'split') {
  totalAmount += bill.paymentDetails?.cashAmount || 0
}

// For card reports: uses card portion of split payments  
if (method === 'card' && bill.paymentMethod === 'split') {
  totalAmount += bill.paymentDetails?.cardAmount || 0
}
```

#### Helper Functions

##### `isCashTransaction(bill)`

Determines if a billing log should be included in cash reports.

**Signature**:
```javascript
isCashTransaction(bill: BillingLog): boolean
```

**Parameters**:
- `bill` (BillingLog): Billing log object to evaluate

**Returns**: boolean - True if transaction is cash-related

**Logic**:
```javascript
function isCashTransaction(bill) {
  return bill.paymentMethod === 'cash' || 
         (bill.paymentMethod === 'split' && hasCashAmount(bill))
}
```

##### `isCardTransaction(bill)`

Determines if a billing log should be included in card reports.

**Signature**:
```javascript
isCardTransaction(bill: BillingLog): boolean
```

**Parameters**:
- `bill` (BillingLog): Billing log object to evaluate

**Returns**: boolean - True if transaction is card-related

**Logic**:
```javascript
function isCardTransaction(bill) {
  return bill.paymentMethod === 'card' || 
         (bill.paymentMethod === 'split' && hasCardAmount(bill))
}
```

#### Data Types

##### BillingLog

```typescript
interface BillingLog {
  id: string
  receiptNo: string
  createdAt: string | Date
  cashierName: string
  paymentMethod: 'cash' | 'card' | 'credit' | 'split'
  total: number
  itemCount: number
  cart: Array<CartItem>
  discountAmount: number
  paymentDetails?: PaymentDetails
  customer?: CustomerInfo
  orgId?: string
  orgName?: string
}
```

##### PaymentDetails

```typescript
interface PaymentDetails {
  cashAmount: number
  cardAmount: number
  creditAmount: number
}
```

##### PaymentSummary

```typescript
interface PaymentSummary {
  transactionCount: number
  grossSales: number
  totalDiscounts: number
  netSales: number
  totalAmount: number
}
```

##### CartItem

```typescript
interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  discount?: {
    enabled: boolean
    type: 'percentage' | 'fixed'
    value: number
  }
  cartDiscount?: string
}
```

##### CustomerInfo

```typescript
interface CustomerInfo {
  id: string
  name: string
  phone?: string
  email?: string
}
```

#### Usage Examples

##### Basic Report Generation

```javascript
import { useReports } from '../hooks/useReports'

function PaymentReportComponent() {
  const { reports } = useReports()
  
  // Generate cash sales report
  const cashReports = filterReportsByPaymentMethod(reports, 'cash')
  const cashSummary = calculatePaymentMethodSummary(reports, 'cash')
  
  // Generate card sales report
  const cardReports = filterReportsByPaymentMethod(reports, 'card')
  const cardSummary = calculatePaymentMethodSummary(reports, 'card')
  
  return (
    <div>
      <h2>Cash Sales: ${cashSummary.totalAmount} ({cashSummary.transactionCount} transactions)</h2>
      <h2>Card Sales: ${cardSummary.totalAmount} ({cardSummary.transactionCount} transactions)</h2>
    </div>
  )
}
```

#### Error Handling

##### Common Error Scenarios

```javascript
// Handle invalid payment method
function safeFilterReports(reports, method) {
  const validMethods = ['cash', 'card']
  
  if (!validMethods.includes(method)) {
    console.error(`Invalid payment method: ${method}`)
    return []
  }
  
  if (!Array.isArray(reports)) {
    console.error('Reports must be an array')
    return []
  }
  
  try {
    return filterReportsByPaymentMethod(reports, method)
  } catch (error) {
    console.error('Error filtering reports:', error)
    return []
  }
}
```

### Split Payment Handling Logic

#### Overview

Split payment handling is a critical component of the payment method reporting system. This section provides comprehensive details about how split payments are processed, filtered, calculated, and displayed across different report types.

#### Business Context

##### What is a Split Payment?

A split payment occurs when a customer pays for a single transaction using multiple payment methods. In the MGPOS system, split payments typically involve:

- **Cash + Card**: Customer pays part in cash and part with credit/debit card
- **Cash + Card + Credit**: Customer uses all three payment methods (rare)
- **Any combination**: Flexible support for various payment method combinations

##### Business Requirements

1. **Accurate Cash Flow Reporting**: Cash reports must reflect actual cash received
2. **Card Reconciliation**: Card reports must match processor settlement amounts
3. **Complete Revenue Tracking**: Combined reports must show full transaction values
4. **Audit Transparency**: Split payment details must be traceable

#### Data Structure

##### Split Payment Data Model

```javascript
{
  // Standard billing log fields
  id: string,
  receiptNo: string,
  createdAt: timestamp,
  cashierName: string,
  paymentMethod: 'split', // Indicates split payment
  total: number, // Total transaction amount
  
  // Split payment specific fields
  paymentDetails: {
    cashAmount: number,    // Amount paid in cash
    cardAmount: number,    // Amount paid by card
    creditAmount: number   // Amount paid on credit (if applicable)
  },
  
  // Standard fields
  itemCount: number,
  cart: Array<CartItem>,
  discountAmount: number,
  customer?: CustomerInfo
}
```

##### Data Validation Rules

```javascript
function validateSplitPayment(bill) {
  // Must have paymentDetails for split payments
  if (bill.paymentMethod === 'split' && !bill.paymentDetails) {
    throw new Error('Split payment requires paymentDetails')
  }
  
  // Amounts must be non-negative
  const { cashAmount = 0, cardAmount = 0, creditAmount = 0 } = bill.paymentDetails
  
  if (cashAmount < 0 || cardAmount < 0 || creditAmount < 0) {
    throw new Error('Payment amounts cannot be negative')
  }
  
  // Sum must equal total (with small tolerance for floating point)
  const sum = cashAmount + cardAmount + creditAmount
  if (Math.abs(sum - bill.total) > 0.01) {
    throw new Error(`Payment amounts (${sum}) must equal total (${bill.total})`)
  }
  
  // At least two payment methods must have amounts > 0
  const nonZeroAmounts = [cashAmount, cardAmount, creditAmount].filter(a => a > 0)
  if (nonZeroAmounts.length < 2) {
    throw new Error('Split payment must have at least two non-zero amounts')
  }
}
```

#### Filtering Logic

##### Core Filtering Algorithm

The filtering logic determines which reports include split payments and how they're counted:

```javascript
/**
 * Filters billing logs by payment method with split payment handling
 * @param {Array} reports - Array of billing log objects
 * @param {string} method - Payment method filter ('cash', 'card')
 * @returns {Array} Filtered array of billing logs
 */
function filterReportsByPaymentMethod(reports, method) {
  return reports.filter(bill => {
    switch (method) {
      case 'cash':
        return isCashTransaction(bill)
      case 'card':
        return isCardTransaction(bill)
      default:
        return true
    }
  })
}
```

##### Payment Method Detection Functions

```javascript
function isCashTransaction(bill) {
  return bill.paymentMethod === 'cash' || 
         (bill.paymentMethod === 'split' && hasCashAmount(bill))
}

function isCardTransaction(bill) {
  return bill.paymentMethod === 'card' || 
         (bill.paymentMethod === 'split' && hasCardAmount(bill))
}

function hasCashAmount(bill) {
  return bill.paymentDetails?.cashAmount > 0
}

function hasCardAmount(bill) {
  return bill.paymentDetails?.cardAmount > 0
}
```

#### Calculation Logic

##### Summary Calculation Algorithm

The summary calculation logic varies by report type to ensure accurate financial reporting:

```javascript
/**
 * Calculates summary statistics for payment method reports
 * @param {Array} reports - Array of billing log objects
 * @param {string} method - Payment method ('cash', 'card')
 * @returns {Object} Summary statistics
 */
function calculatePaymentMethodSummary(reports, method) {
  const filteredReports = filterReportsByPaymentMethod(reports, method)
  
  let totalAmount = 0
  let grossSales = 0
  let totalDiscounts = 0
  
  filteredReports.forEach(bill => {
    // Calculate gross sales from cart items
    grossSales += calculateGrossSales(bill)
    
    // Calculate total discounts
    totalDiscounts += calculateTotalDiscounts(bill)
    
    // Calculate payment method specific amount
    totalAmount += calculatePaymentAmount(bill, method)
  })
  
  return {
    transactionCount: filteredReports.length,
    grossSales,
    totalDiscounts,
    netSales: grossSales - totalDiscounts,
    totalAmount
  }
}
```

##### Payment Amount Calculation

The key difference between report types is how split payments are counted:

```javascript
/**
 * Calculates the amount to include in reports based on payment method
 * @param {Object} bill - Billing log object
 * @param {string} method - Payment method filter
 * @returns {number} Amount to include in summary
 */
function calculatePaymentAmount(bill, method) {
  if (bill.paymentMethod === 'split') {
    switch (method) {
      case 'cash':
        return bill.paymentDetails?.cashAmount || 0
      case 'card':
        return bill.paymentDetails?.cardAmount || 0
      default:
        return 0
    }
  } else {
    // Non-split payments use total amount
    return bill.total || 0
  }
}
```

#### Display Logic

##### Report Type Display Rules

Different report types handle split payment display differently:

###### 1. Cash Sales Report
- **Main Table**: Shows cash portion amount for split payments
- **Split Payment Details**: Separate section showing full split breakdown
- **Totals**: Calculated using cash portions only

###### 2. Card Sales Report
- **Main Table**: Shows card portion amount for split payments
- **Split Payment Details**: Separate section showing full split breakdown
- **Totals**: Calculated using card portions only

##### UI Implementation

###### Dynamic Column Headers

```javascript
// Column configuration varies by report type
const getTableColumns = (reportType) => {
  const baseColumns = ['Receipt #', 'Date/Time', 'Cashier', 'Payment Method', 'Items', 'Gross', 'Discount', 'Net']
  
  if (reportType === 'cash' || reportType === 'card') {
    return [...baseColumns, 'Amount'] // Shows payment method specific amount
  } else {
    return [...baseColumns, 'Amount'] // Shows full amount
  }
}
```

###### Split Payment Details Section

```javascript
// Conditionally render split payment details
{hasSplitPayments(filteredReports) && (
  <div className="split-payment-details">
    <h3>Split Payment Details</h3>
    <table>
      <thead>
        <tr>
          <th>Receipt #</th>
          <th>Date</th>
          <th>Cashier</th>
          <th>Cash Amount</th>
          <th>Card Amount</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {filteredReports
          .filter(bill => bill.paymentMethod === 'split')
          .map(bill => (
            <tr key={bill.id}>
              <td>{bill.receiptNo}</td>
              <td>{formatDate(bill.createdAt)}</td>
              <td>{bill.cashierName}</td>
              <td>{formatCurrency(bill.paymentDetails?.cashAmount || 0)}</td>
              <td>{formatCurrency(bill.paymentDetails?.cardAmount || 0)}</td>
              <td>{formatCurrency(bill.total)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}
```

#### Print Template Logic

##### Dynamic Print Content

Print templates adapt based on report type and split payment presence:

```javascript
// Print template generation
const generatePrintContent = (reportType, reports) => {
  const filteredReports = filterReportsByPaymentMethod(reports, reportType)
  const hasSplitPayments = filteredReports.some(bill => bill.paymentMethod === 'split')
  
  return `
    ${generateMainTable(reportType, filteredReports)}
    
    ${hasSplitPayments ? 
      generateSplitPaymentTable(filteredReports) : 
      ''}
  `
}
```

##### Split Payment Table Template

```javascript
const generateSplitPaymentTable = (reports) => {
  const splitPayments = reports.filter(bill => bill.paymentMethod === 'split')
  
  return `
    <div class="section-title">Split Payment Details</div>
    <table>
      <thead>
        <tr>
          <th>Receipt #</th>
          <th>Date</th>
          <th>Cashier</th>
          <th class="text-right">Cash Amount</th>
          <th class="text-right">Card Amount</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${splitPayments.map(bill => `
          <tr>
            <td>${bill.receiptNo}</td>
            <td>${formatDate(bill.createdAt)}</td>
            <td>${bill.cashierName}</td>
            <td class="text-right">${formatCurrency(bill.paymentDetails?.cashAmount || 0)}</td>
            <td class="text-right">${formatCurrency(bill.paymentDetails?.cardAmount || 0)}</td>
            <td class="text-right">${formatCurrency(bill.total)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f5f5f5; font-weight: bold; border-top: 2px solid #333;">
          <td colspan="3" style="text-align: right; padding: 8px;">TOTALS</td>
          <td style="text-align: right; padding: 8px;">
            ${formatCurrency(splitPayments.reduce((sum, bill) => sum + (bill.paymentDetails?.cashAmount || 0), 0))}
          </td>
          <td style="text-align: right; padding: 8px;">
            ${formatCurrency(splitPayments.reduce((sum, bill) => sum + (bill.paymentDetails?.cardAmount || 0), 0))}
          </td>
          <td style="text-align: right; padding: 8px;">
            ${formatCurrency(splitPayments.reduce((sum, bill) => sum + (bill.total || 0), 0))}
          </td>
        </tr>
      </tfoot>
    </table>
  `
}
```

#### Error Handling

##### Data Validation Errors

```javascript
// Handle missing payment details
function validateSplitPaymentData(bill) {
  if (bill.paymentMethod === 'split') {
    if (!bill.paymentDetails) {
      console.warn(`Split payment ${bill.receiptNo} missing payment details`)
      return false
    }
    
    if (typeof bill.paymentDetails !== 'object') {
      console.warn(`Invalid payment details structure for ${bill.receiptNo}`)
      return false
    }
    
    // Validate individual amounts
    const { cashAmount = 0, cardAmount = 0, creditAmount = 0 } = bill.paymentDetails
    
    if (cashAmount < 0 || cardAmount < 0 || creditAmount < 0) {
      console.warn(`Negative payment amount detected for ${bill.receiptNo}`)
      return false
    }
  }
  
  return true
}
```

##### Calculation Safety

```javascript
// Safe calculation with fallbacks
function safeCalculatePaymentAmount(bill, method) {
  try {
    if (bill.paymentMethod === 'split') {
      const details = bill.paymentDetails || {}
      
      switch (method) {
        case 'cash':
          return Math.max(0, details.cashAmount || 0)
        case 'card':
          return Math.max(0, details.cardAmount || 0)
        default:
          return 0
      }
    } else {
      return Math.max(0, bill.total || 0)
    }
  } catch (error) {
    console.error(`Error calculating payment amount for ${bill.receiptNo}:`, error)
    return 0
  }
}
```

#### Performance Considerations

##### Efficient Filtering

```javascript
// Memoization for expensive filtering operations
const memoizedFilter = (() => {
  const cache = new Map()
  
  return (reports, method) => {
    const key = `${reports.length}-${method}-${reports[0]?.id}`
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = filterReportsByPaymentMethod(reports, method)
    cache.set(key, result)
    
    // Clear cache after 5 minutes
    setTimeout(() => cache.delete(key), 300000)
    
    return result
  }
})()
```

##### Optimized Calculations

```javascript
// Single-pass calculation for better performance
function calculateSummaryOptimized(reports, method) {
  const filteredReports = []
  let totalAmount = 0
  let grossSales = 0
  let totalDiscounts = 0
  
  // Single loop for filtering and calculation
  for (const bill of reports) {
    let includeInFilter = false
    let paymentAmount = 0
    
    // Determine inclusion and amount in single pass
    if (method === 'cash' && isCashTransaction(bill)) {
      includeInFilter = true
      paymentAmount = bill.paymentMethod === 'split' ? 
        (bill.paymentDetails?.cashAmount || 0) : 
        (bill.total || 0)
    } else if (method === 'card' && isCardTransaction(bill)) {
      includeInFilter = true
      paymentAmount = bill.paymentMethod === 'split' ? 
        (bill.paymentDetails?.cardAmount || 0) : 
        (bill.total || 0)
    }
    
    if (includeInFilter) {
      filteredReports.push(bill)
      totalAmount += paymentAmount
      grossSales += calculateGrossSales(bill)
      totalDiscounts += calculateTotalDiscounts(bill)
    }
  }
  
  return {
    transactionCount: filteredReports.length,
    grossSales,
    totalDiscounts,
    netSales: grossSales - totalDiscounts,
    totalAmount
  }
}
```

---

## Customer Purchase History Reports

### Overview

The Customer Purchase History Reports feature allows administrators to generate comprehensive reports showing all transactions for a specific customer within a selected time period. This feature enables businesses to analyze customer purchasing patterns, track customer activity, and provide detailed purchase history to customers when needed.

### Architecture

The Customer Purchase History Reports feature extends the existing reporting system with customer-specific filtering and search capabilities:

#### Core Components

**Customer Filtering Logic**:
```javascript
// ReportsPage.jsx - Customer filtering function
const filterReportsByCustomer = (reports, customerSearch) => {
  if (!reports || !Array.isArray(reports) || !customerSearch) return []
  
  try {
    const searchTerm = customerSearch.toLowerCase().trim()
    return reports.filter(bill => {
      if (!bill || !bill.customer) return false
      
      const customerName = bill.customer.name?.toLowerCase() || ''
      const customerPhone = bill.customer.phone?.toLowerCase() || ''
      
      return customerName.includes(searchTerm) || customerPhone.includes(searchTerm)
    })
  } catch (error) {
    console.error('Error filtering reports by customer:', error)
    return []
  }
}
```

**Customer Purchase Summary Calculation**:
```javascript
// ReportsPage.jsx - Customer-specific summary calculations
const calculateCustomerPurchaseSummary = (reports, customerSearch) => {
  try {
    const filteredReports = filterReportsByCustomer(reports, customerSearch)
    let grossSales = 0
    let totalDiscounts = 0
    
    filteredReports.forEach(bill => {
      if (!bill) return
      
      try {
        grossSales += bill.cart ? bill.cart.reduce((sum, item) => {
          if (!item || !item.price || !item.qty) return sum
          return sum + (item.price * item.qty)
        }, 0) : 0
        
        // Calculate item discounts and global discounts
        let itemDiscounts = 0
        if (bill.cart && Array.isArray(bill.cart)) {
          itemDiscounts = bill.cart.reduce((sum, item) => {
            if (!item || !item.price || !item.qty) return sum
            const lineTotal = item.price * item.qty
            let itemDiscount = 0
            try {
              if (item.cartDiscount != null && item.cartDiscount !== '') {
                const val = parseFloat(item.cartDiscount) || 0
                itemDiscount = Math.min(Math.max(val, 0), lineTotal)
              } else if (item.discount?.enabled) {
                if (item.discount.type === DiscountType.PERCENTAGE) {
                  itemDiscount = lineTotal * (item.discount.value / 100)
                } else {
                  itemDiscount = Math.min(item.discount.value * item.qty, lineTotal)
                }
              }
            } catch (discountError) {
              console.warn('Error calculating item discount:', discountError)
            }
            return sum + itemDiscount
          }, 0)
        }
        
        const globalDiscount = bill.discountAmount || 0
        totalDiscounts += itemDiscounts + globalDiscount
      } catch (billError) {
        console.warn('Error processing bill in customer purchase summary:', billError)
      }
    })
    
    return {
      transactionCount: filteredReports.length,
      grossSales,
      totalDiscounts,
      netSales: grossSales - totalDiscounts
    }
  } catch (error) {
    console.error('Error in calculateCustomerPurchaseSummary:', error)
    return {
      transactionCount: 0,
      grossSales: 0,
      totalDiscounts: 0,
      netSales: 0
    }
  }
}
```

### User Interface

#### Customer Selection Input

When the Customer Purchase History report type is selected, a customer search input appears:

```javascript
// ReportsPage.jsx - Customer selection UI
{reportType === ReportType.CUSTOMER_PURCHASE_HISTORY && (
  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Customer Name or Phone
    </label>
    <input
      type="text"
      value={selectedCustomer}
      onChange={e => setSelectedCustomer(e.target.value)}
      placeholder="Enter customer name or phone number"
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
    />
  </div>
)}
```

#### Report Display

The customer purchase history report displays:

- **Summary Cards**: Gross sales, total discounts, net sales, and transaction count
- **Detailed Transaction Table**: All customer transactions with full details
- **Payment Method Indicators**: Color-coded payment method badges
- **Multi-organization Support**: Organization column for multi-org reports

### Report Features

#### Search Functionality

- **Flexible Search**: Search by customer name or phone number
- **Case-Insensitive Search**: Search is not case-sensitive
- **Partial Matching**: Supports partial name or phone number matches
- **Real-time Filtering**: Reports are filtered as customer search changes

#### Data Display

**Transaction Details Include**:
- Receipt number and date/time
- Organization (for multi-org reports)
- Cashier information
- Payment method with color coding
- Item count and pricing details
- Discount breakdowns
- Net and total amounts

#### Summary Statistics

**Calculated Metrics**:
- Total transaction count
- Gross sales (before discounts)
- Total discounts (item + global)
- Net sales (after discounts)
- Average transaction value

### Print Functionality

#### Enhanced Print Template

The customer purchase history report includes a specialized print template:

```javascript
// Print content for customer purchase history
${reportType === ReportType.CUSTOMER_PURCHASE_HISTORY ? `
<div class="section-title">Customer Purchase History Details</div>
<table>
  <thead>
    <tr>
      <th>Receipt #</th>
      <th>Date/Time</th>
      ${(hasMultiOrgAccess && selectedOrgs.length > 0) ? '<th>Organization</th>' : ''}
      <th>Cashier</th>
      <th>Payment Method</th>
      <th class="text-right">Items</th>
      <th class="text-right">Gross</th>
      <th class="text-right">Discount</th>
      <th class="text-right">Net</th>
      <th class="text-right">Total</th>
    </tr>
  </thead>
  <tbody>
    ${filterReportsByCustomer(reports, selectedCustomer).map(bill => {
      // Transaction row generation with customer-specific data
    }).join('')}
  </tbody>
  <tfoot>
    <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #333'}}>
      <!-- Customer-specific totals -->
    </tr>
  </tfoot>
</table>
` : ''}
```

#### Print Header Information

The print header includes customer-specific information:

```javascript
// Enhanced print header with customer information
<div class="header">
  <h1>Customer Purchase History Report</h1>
  <div class="org-info"><strong>Organization(s):</strong> ${orgNames}</div>
  ${reportType === ReportType.CUSTOMER_PURCHASE_HISTORY ? `<div class="report-info"><strong>Customer:</strong> ${selectedCustomer}</div>` : ''}
  <div class="report-info"><strong>Period:</strong> ${period}</div>
  <div class="report-info"><strong>Report Generated:</strong> ${reportDate} at ${reportTime}</div>
  <div class="report-info"><strong>Generated By:</strong> ${userProfile?.displayName || 'Unknown User'}</div>
</div>
```

### Logging and Audit Trail

#### Enhanced Activity Logging

The customer purchase history feature includes comprehensive logging:

```javascript
// Report generation logging with customer information
await logUserAction(
  'REPORT_GENERATE',
  `Generated ${reportType} report for ${period}${period === ReportPeriod.CUSTOM && customStart && customEnd ? ` (${customStart} to ${customEnd})` : ''}${reportType === ReportType.CUSTOMER_PURCHASE_HISTORY && selectedCustomer ? ` - Customer: ${selectedCustomer}` : ''}`,
  userProfile,
  currentOrgId,
  {
    period,
    reportType,
    orgIds: orgs,
    transactionCount: reports.length,
    summary: calculateSummary(reports),
    ...(reportType === ReportType.CUSTOMER_PURCHASE_HISTORY && { customerSearch: selectedCustomer })
  }
)
```

#### Print Logging

Print actions are logged with customer context:

```javascript
// Print logging with customer information
await logUserAction(
  'REPORT_PRINT',
  `Printed ${reportType} report for ${period}${period === ReportPeriod.CUSTOM && customStart && customEnd ? ` (${customStart} to ${customEnd})` : ''}${reportType === ReportType.CUSTOMER_PURCHASE_HISTORY && selectedCustomer ? ` - Customer: ${selectedCustomer}` : ''}`,
  userProfile,
  currentOrgId,
  {
    period,
    reportType,
    orgIds: hasMultiOrgAccess && selectedOrgs.length > 0 ? selectedOrgs : [currentOrgId],
    transactionCount: reports.length,
    summary,
    ...(reportType === ReportType.CUSTOMER_PURCHASE_HISTORY && { customerSearch: selectedCustomer })
  }
)
```

### Integration Points

#### Report Type Enumeration

Added to the existing report types:

```javascript
// src/constants/enums.js
export const ReportType = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
  CASH: 'cash',
  CARD: 'card',
  DIGITAL: 'digital',
  CREDIT: 'credit',
  CUSTOMER_PURCHASE_HISTORY: 'customer_purchase_history'
}
```

#### UI Integration

**Report Type Selection**:
- Added "Customer Purchase History" button to report type selector
- Conditional customer search input appears when selected
- Responsive design for mobile, tablet, and desktop views

**Summary Cards Integration**:
- Customer-specific summary calculations
- Dynamic summary card content based on report type
- Consistent styling with other report types

### Error Handling

#### Robust Error Management

**Data Validation**:
- Null/undefined report handling
- Customer data structure validation
- Search term sanitization

**Calculation Safety**:
- Try-catch blocks around all calculations
- Fallback values for missing data
- Console error logging for debugging

**UI Error States**:
- Graceful handling of empty results
- Error messages for invalid searches
- Loading states during data processing

### Performance Considerations

#### Efficient Filtering

**Single-Pass Processing**:
- Combined filtering and calculation where possible
- Memoization opportunities for repeated searches
- Optimized array operations

**Memory Management**:
- Efficient data structures for large datasets
- Proper cleanup of event listeners
- Optimized re-rendering patterns

### Security Considerations

#### Data Access Control

**Organization Isolation**:
- Customer data respects organization boundaries
- Multi-org support with proper data segregation
- User permission validation

**Search Security**:
- Input sanitization for search terms
- Protection against injection attacks
- Audit trail for customer data access

### Future Enhancements

#### Potential Improvements

**Advanced Search**:
- Customer ID-based exact matching
- Date range filtering within customer reports
- Export functionality for customer data

**Analytics Integration**:
- Customer purchase pattern analysis
- Frequency and recency metrics
- Customer lifetime value calculations

**UI Enhancements**:
- Customer autocomplete suggestions
- Customer profile integration
- Mobile-optimized customer search

---

## Billing Logs System

### Overview
The Billing Logs system provides comprehensive viewing, filtering, and reprinting capabilities for sales transactions within the MGPOS application. It supports real-time data synchronization and multi-organization access control.

### Core Components

#### BillingLogsPage Component
Located at `src/pages/BillingLogsPage.jsx`, this component provides the main interface for viewing and managing billing logs.

**Key Features**:
- Real-time billing log display with pagination
- Advanced filtering capabilities (date range, receipt number)
- Bill details modal with comprehensive transaction information
- Reprint functionality for same-day bills (when enabled)
- Multi-organization support with organization context display

#### useBillingLogs Hook
Located at `src/hooks/useBillingLogs.js`, this custom hook manages data fetching and state for billing logs.

**Key Functions**:
- Real-time subscription to billing logs collection
- Organization-based data isolation
- Multi-organization access detection
- Billing log creation for new sales

### Filtering System

The Billing Logs page includes a comprehensive filtering system with the following options:

#### Available Filters
1. **Start Date**: Filter bills from a specific start date
2. **End Date**: Filter bills up to a specific end date  
3. **Receipt Number**: Search by receipt number (partial matching)

#### Filter Implementation
```javascript
const filteredLogs = logs.filter(log => {
  let matches = true
  
  if (filters.startDate) {
    const logDate = new Date(log.createdAt).toDateString()
    const filterDate = new Date(filters.startDate).toDateString()
    matches = matches && logDate >= filterDate
  }
  
  if (filters.endDate) {
    const logDate = new Date(log.createdAt).toDateString()
    const filterDate = new Date(filters.endDate).toDateString()
    matches = matches && logDate <= filterDate
  }
  
  if (filters.receiptNo) {
    matches = matches && log.receiptNo.toLowerCase().includes(filters.receiptNo.toLowerCase())
  }
  
  return matches
})
```

### Reprint Functionality

#### Reprint Conditions
- **Settings Requirement**: Reprint must be enabled in organization settings (`reprintEnabled: true`)
- **Time Restriction**: Only bills created on the current day can be reprinted
- **User Permission**: Users with appropriate access can reprint bills

#### Reprint Features
- Opens print preview in new window
- Includes "REPRINT" watermark on receipt
- Captures reprint time and logs the action
- Maintains original receipt formatting and data

### Bill Details Modal

The bill details modal provides comprehensive transaction information including:

#### Header Information
- Receipt number and timestamp
- Cashier information
- Customer details (if applicable)
- Payment method and split payment details

#### Item Details
- Product names and quantities with units
- Individual item pricing
- Discount information with type and percentage
- Line totals and discounted totals

#### Summary Calculations
- Gross amount (before discounts)
- Item-wise discount breakdown
- Net amount (after discounts)
- Tax calculations (if enabled)
- Final total amount

### Recent Updates

#### Credit Purchase System Implementation (Latest Update)
- **Feature**: Complete credit purchase and customer credit management system
- **Functionality**: 
  - Credit purchases automatically update customer credit balance as negative values
  - Admin can adjust credit balances for settlements and advance payments
  - Comprehensive credit history tracking with transaction types
  - Real-time credit balance updates across the application
- **Components**:
  - `CartPanel.jsx`: Handles credit purchase checkout and balance updates
  - `CustomerManagement.jsx`: Admin interface for credit balance adjustments
  - `useCustomers.js`: Core credit balance management logic
  - `useCreditHistory.js`: Credit transaction tracking and history
- **Transaction Types**:
  - **PURCHASE**: Negative balance updates (customer owes money)
  - **PAYMENT**: Positive balance updates (customer pays off debt)
  - **ADJUSTMENT**: Manual credit adjustments by admin
- **Credit Balance Logic**:
  - Negative balance: Customer owes money to the business
  - Positive balance: Customer has advance credit/prepaid amount
  - Zero balance: No outstanding credit or debt

#### Unit Filter Removal
- **Change**: Removed unit-based filtering from Billing Logs page
- **Reason**: Unit filtering was deemed unnecessary for billing operations
- **Impact**: Simplified filtering interface and improved performance
- **Files Modified**:
  - `src/pages/BillingLogsPage.jsx`: Removed unit filter state, UI, and filtering logic
  - `src/test/BillingLogsPage.test.jsx`: Updated unit tests to reflect changes

#### Filter Grid Adjustment
- Changed from 4-column to 3-column grid layout for filters
- Improved responsive design and user experience
- Maintained all essential filtering capabilities

### Database Schema

#### BillingLogs Collection Structure
```javascript
{
  id: string,              // Document ID
  orgId: string,           // Organization ID
  receiptNo: string,       // Receipt number
  cashierId: string,       // Cashier user ID
  cashierName: string,     // Cashier display name
  cart: array,             // Array of cart items
  subtotal: number,        // Subtotal amount
  total: number,           // Total amount
  itemCount: number,       // Number of items
  paymentMethod: string,   // Payment method: 'cash', 'card', 'credit', 'split'
  paymentDetails: object,   // Split payment details
  customer: object,        // Customer information (if applicable)
  billingSettings: object, // Settings snapshot at time of sale
  createdAt: timestamp,    // Sale timestamp
  updatedAt: timestamp     // Last update timestamp
}
```

### Performance Optimizations

#### Pagination Implementation
- Loads 50 logs per page to improve initial load performance
- "Load More" functionality for progressive data loading
- Maintains filter state across pagination

#### Real-time Updates
- Uses Firestore onSnapshot for real-time data synchronization
- Efficient re-rendering with React optimization patterns
- Organization-based subscription management

### Security Considerations

#### Access Control
- Organization-based data isolation
- User role verification for reprint functionality
- Multi-organization access validation

#### Data Integrity
- Settings snapshot preservation for consistent discount calculations
- Audit trail through logging system
- Immutable transaction records

---

## Advanced Reporting System

### Overview
The Advanced Reporting system provides comprehensive business analytics and visualizations for Organization Admins and Super Admins. It features interactive dashboards, export capabilities, comparative analysis, and product performance analytics.

### Architecture

#### Components Structure
```
src/
├── pages/
│   └── AdvancedReportsPage.jsx          # Main advanced reports interface
├── hooks/
│   └── useAdvancedReports.js           # Advanced reporting data management
├── utils/
│   ├── chartUtils.js                  # Chart utility functions
│   ├── analyticsUtils.js              # Business analytics calculations
│   └── exportUtils.js                 # PDF/Excel export functionality
└── test/
    ├── AdvancedReportsPage.test.jsx   # Advanced reports component tests
    ├── chartUtils.test.js             # Chart utilities tests
    └── analyticsUtils.test.js          # Analytics utilities tests
```

#### Key Features

**Visual Dashboards**
- Interactive charts using Recharts library
- Revenue trend analysis with line charts
- Product performance with bar charts
- Category distribution with pie charts
- Payment method analysis with donut charts
- Hourly sales patterns with area charts
- Responsive design for mobile, tablet, and desktop

**Export Functionality**
- PDF export using jsPDF with custom layouts
- Excel export using SheetJS with multiple worksheets
- Chart image export capabilities
- Branded report generation with organization details

**Comparative Analysis**
- Period-over-period comparison (day/week/month/year)
- Percentage change calculations
- Trend indicators (up/down/neutral)
- Forecasting capabilities using linear regression

**Product Performance Analytics**
- Top products by revenue and profit margin
- Category-wise performance breakdown
- Customer analytics and purchasing patterns
- Payment method distribution analysis

### Data Processing

#### AnalyticsCalculator Class
```javascript
// Core analytics engine
class AnalyticsCalculator {
  constructor(data, currencySymbol, categories)  // Initialize with optional categories for mapping
  calculateRevenueMetrics(period)      // Revenue analysis
  calculateTransactionMetrics(period)  // Transaction analytics
  calculateProductPerformance()        // Product performance
  calculateCategoryPerformance()        // Category analysis with ID-to-name mapping
  calculatePaymentMethodAnalytics()     // Payment analysis
  calculateComparativeAnalysis()         // Comparative analysis
  forecastRevenue(data)               // Revenue forecasting
  mapCategoryToName(categoryId)       // Helper for category ID to name mapping
}
```

#### Chart Data Preparation
```javascript
// Data transformation for charts
prepareLineChartData(data, xKey, yKey, name)
prepareBarChartData(data, xKey, yKey)
preparePieChartData(data, nameKey, valueKey)
aggregateByPeriod(data, dateKey, valueKey, period)
```

### Export System

#### PDF Export Features
- Custom PDFExporter class with layout management
- Automatic table formatting and pagination
- Chart integration for visual reports
- Multi-worksheet support for different report types

#### Excel Export Features
- ExcelExporter class with worksheet management
- Auto-sizing columns based on content
- Summary sheets with calculated metrics
- Detailed transaction sheets with full data

### Performance Optimizations

#### Data Processing
- Efficient aggregation algorithms for large datasets
- Memoized calculations using React useMemo
- Lazy loading of chart components
- Optimized Firebase queries with proper indexing

#### UI Performance
- Responsive chart configurations
- Virtual scrolling for large data tables
- Progressive image loading for exports
- Debounced user interactions

### Security Considerations

#### Access Control
- Admin-only access enforcement through route protection
- Organization-based data isolation
- Multi-organization support with proper validation

#### Data Privacy
- No sensitive data exposure in client-side logs
- Secure export file generation
- Organization-specific data boundaries

### Testing Strategy

#### Unit Test Coverage
- Component testing with React Testing Library
- Utility function testing with Jest
- Mock implementations for all external dependencies
- Responsive design testing with viewport simulation

#### Test Categories
- Access control and authentication
- Data processing and analytics calculations
- Chart data preparation and rendering
- Export functionality and file generation
- Error handling and edge cases

### Integration Points

#### Existing System Integration
- Extends current useReports hook functionality
- Leverages existing AuthContext for permissions
- Integrates with current organization management
- Maintains consistency with existing UI patterns

#### Firebase Integration
- Uses existing Firestore structure and collections
- Compatible with current billing_logs schema
- Supports multi-organization data queries
- Real-time data synchronization

### Dependencies Added

#### New Packages
```json
{
  "recharts": "^2.12.7",           // Chart library
  "jspdf": "^2.5.1",              // PDF generation
  "xlsx": "^0.18.5",               // Excel export
  "file-saver": "^2.0.5",          // File download
  "date-fns": "^3.6.0"             // Date utilities
}
```

### Usage Examples

#### Basic Dashboard Usage
```javascript
import { useAdvancedReports } from '../hooks/useAdvancedReports'

function Dashboard() {
  const { analytics, fetchAdvancedData, getChartData } = useAdvancedReports()
  
  useEffect(() => {
    fetchAdvancedData('month', null, null, [orgId])
  }, [])
  
  const chartData = getChartData('revenue-trend', { period: 'month' })
  
  return <LineChart data={chartData.data} />
}
```

#### Export Usage
```javascript
const { exportData } = useAdvancedReports()

// Export as PDF
await exportData('pdf', 'sales-report')

// Export as Excel
await exportData('excel', 'product-performance')
```

### Future Enhancements

#### Planned Features
- Real-time dashboard updates
- Scheduled report generation and email delivery
- Advanced filtering and custom date ranges
- Drill-down capabilities for detailed analysis
- Integration with external BI tools
- Custom report builder interface

#### Performance Improvements
- Server-side aggregation for large datasets
- Caching layer for frequently accessed data
- Progressive web app features for offline access
- Advanced chart interactions and animations

---

*This technical documentation is maintained alongside with codebase and updated regularly to reflect architectural changes and new features.*