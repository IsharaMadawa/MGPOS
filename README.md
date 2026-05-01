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
16. [Troubleshooting for Developers](#troubleshooting-for-developers)
17. [Future Development Roadmap](#future-development-roadmap)

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
│   │   ├── useLogs.js
│   │   ├── useOrganizations.js
│   │   ├── useProducts.js
│   │   ├── useReports.js
│   │   └── useSettings.js
│   ├── pages/                 # Page components
│   │   ├── BillingLogsPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── LogsPage.jsx
│   │   ├── POSPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── SuperAdminPage.jsx
│   │   └── SuperAdminPageNew.jsx
│   ├── utils/                 # Utility functions
│   │   ├── logger.js          # Logging utilities
│   │   ├── migratePasswords.js
│   │   └── passwordUtils.js
│   ├── App.jsx               # Main application component
│   ├── App.css               # Global styles
│   ├── firebase.js           # Firebase configuration
│   ├── index.css             # Base styles
│   └── main.jsx              # Application entry point
├── scripts/                  # Utility scripts
│   ├── createSuperAdmin.js
│   ├── createSuperAdminNode.js
│   ├── migratePasswords.js
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

#### Sales Collection
```javascript
{
  id: string,            // Sale ID
  orgId: string,         // Organization ID
  userId: string,        // User who made the sale
  items: array,          // Array of sale items
  subtotal: number,      // Subtotal before tax
  tax: number,           // Tax amount
  total: number,         // Total amount
  paymentMethod: string, // Payment method
  paymentStatus: string, // Payment status
  createdAt: timestamp,  // Sale timestamp
  updatedAt: timestamp   // Last update timestamp
}
```

#### Settings Collection
```javascript
{
  id: string,            // Settings ID (usually orgId)
  orgId: string,         // Organization ID
  businessName: string,  // Business name
  currency: string,      // Currency code
  taxRate: number,       // Default tax rate
  address: string,       // Business address
  phone: string,         // Business phone
  email: string,         // Business email
  receiptHeader: string, // Receipt header text
  receiptFooter: string, // Receipt footer text
  masterCategories: array, // Master categories list
  unitsOfMeasure: array,  // Units of measure list
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
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PRODUCT_ADDED: 'product_added',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  SALE_COMPLETED: 'sale_completed',
  // ... more log types
}

export const logUserAction = async (orgId, userId, action, details) => {
  try {
    await addDoc(collection(db, 'logs'), {
      orgId,
      userId,
      action,
      details,
      timestamp: serverTimestamp(),
      ipAddress: await getClientIP(),
      userAgent: navigator.userAgent
    })
  } catch (error) {
    console.error('Error logging user action:', error)
  }
}
```

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
```

---

## Development Guidelines

### Code Style
- **ESLint Configuration**: Consistent code formatting
- **Prettier Integration**: Automatic code formatting
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

*This technical documentation is maintained alongside the codebase and updated regularly to reflect architectural changes and new features.*
