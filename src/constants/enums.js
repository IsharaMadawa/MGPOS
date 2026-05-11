/**
 * Application Enums and Constants
 * Centralized enum definitions to replace hard-coded strings throughout the codebase
 */

// Discount Types
export const DiscountType = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  CURRENCY: 'currency'
}

// Discount Modes
export const DiscountMode = {
  GLOBAL: 'global',
  ITEM: 'item',
  CATEGORY: 'category'
}

// Payment Methods
export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  SPLIT: 'split',
  DIGITAL: 'digital',
  CREDIT: 'credit'
}

// Report Types
export const ReportType = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
  CASH: 'cash',
  CARD: 'card',
  DIGITAL: 'digital',
  CREDIT: 'credit',
  CUSTOMER_PURCHASE_HISTORY: 'customer_purchase_history'
}

// Report Periods
export const ReportPeriod = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom'
}

// Discount Sources
export const DiscountSource = {
  ITEM: 'item',
  CATEGORY: 'category',
  CUSTOM: 'custom',
  GLOBAL: 'global'
}

// Transaction Types
export const TransactionType = {
  SALES: 'sales',
  PURCHASE: 'purchase',
  RETURN: 'return'
}

// User Roles
export const UserRole = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  MANAGER: 'manager',
  SUPER_ADMIN: 'super_admin'
}

// Tax Status
export const TaxStatus = {
  ENABLED: 'enabled',
  DISABLED: 'disabled'
}

// Currency Types
export const CurrencyType = {
  DEFAULT: 'USD',
  LOCAL: 'local'
}

// Helper functions for enum validation
export const isValidDiscountType = (type) => Object.values(DiscountType).includes(type)
export const isValidDiscountMode = (mode) => Object.values(DiscountMode).includes(mode)
export const isValidPaymentMethod = (method) => Object.values(PaymentMethod).includes(method)
export const isValidReportType = (type) => Object.values(ReportType).includes(type)
export const isValidReportPeriod = (period) => Object.values(ReportPeriod).includes(period)
export const isValidUserRole = (role) => Object.values(UserRole).includes(role)

// Default values
export const DEFAULT_DISCOUNT_TYPE = DiscountType.PERCENTAGE
export const DEFAULT_DISCOUNT_MODE = DiscountMode.GLOBAL
export const DEFAULT_PAYMENT_METHOD = PaymentMethod.CASH
export const DEFAULT_REPORT_TYPE = ReportType.SUMMARY
export const DEFAULT_REPORT_PERIOD = ReportPeriod.TODAY
export const DEFAULT_USER_ROLE = UserRole.CASHIER
