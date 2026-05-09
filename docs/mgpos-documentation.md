# MGPOS - User Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Main Features](#main-features)
5. [Point of Sale (POS) Operations](#point-of-sale-pos-operations)
6. [Product Management](#product-management)
7. [Category Management](#category-management)
8. [Customer Management](#customer-management)
9. [Settings and Configuration](#settings-and-configuration)
10. [Reports and Analytics](#reports-and-analytics)
11. [User Management](#user-management)
12. [Organization Management](#organization-management)
13. [Payment Method Reports](#payment-method-reports)
14. [Troubleshooting](#troubleshooting)
15. [Best Practices](#best-practices)

---

## System Overview

MGPOS is a comprehensive Point of Sale (POS) system designed for multi-organization retail management. Built with modern web technologies, it provides real-time inventory tracking, sales processing, and business analytics through an intuitive web interface.

### Key Features
- **Multi-Organization Support**: Manage multiple retail organizations from a single system
- **Real-time Inventory**: Track products, categories, and stock levels in real-time
- **Sales Processing**: Complete POS functionality with cart management and payment processing
- **User Management**: Role-based access control with multiple permission levels
- **Reporting**: Comprehensive sales, inventory, and billing reports
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Valid user credentials

### First-Time Login
1. Open your web browser and navigate to the MGPOS URL
2. Enter your username and password
3. Select your organization (if applicable)
4. Click "Sign In"

### Navigation
- **Top Navigation Bar**: Access main sections and organization selector
- **Side Menu**: Quick access to POS, Settings, Reports, and other features
- **Breadcrumb Navigation**: Track your current location within the system

---

## User Roles and Permissions

### Super Admin
- **Access**: All organizations and system features
- **Permissions**: 
  - Create and manage organizations
  - Manage all users across organizations
  - Access system-wide reports and logs
  - Configure global settings
  - View and manage billing logs

### Admin
- **Access**: Their assigned organization
- **Permissions**:
  - Manage users within their organization
  - Configure organization settings
  - Access organization reports
  - Manage products and categories
  - View logs and billing information

### Regular User
- **Access**: Basic POS functions
- **Permissions**:
  - Process sales transactions
  - View product inventory
  - Access basic reports
  - Manage their profile

---

## Main Features

### 1. Point of Sale (POS)
- **Product Selection**: Browse and add products to cart
- **Cart Management**: Add, modify, and remove items
- **Payment Processing**: Complete transactions with multiple payment methods
- **Receipt Generation**: Generate and print receipts
- **Miscellaneous Items**: Add custom items not in inventory

### 2. Product Management
- **Product Catalog**: Add, edit, and delete products
- **Inventory Tracking**: Monitor stock levels in real-time
- **Pricing Management**: Set and update product prices
- **Unit Management**: Handle different units of measure
- **Category Organization**: Group products by categories

### 3. Customer Management
- **Customer Database**: Maintain comprehensive customer profiles with contact information
- **Credit Account Management**: Track and manage customer credit balances and purchases
- **Purchase History**: View complete purchase history for each customer
- **Customer Search**: Quickly find customers by name, phone, or email
- **Credit Purchases**: Enable credit sales with automatic balance tracking
- **Customer Analytics**: Generate reports on customer purchasing patterns and credit usage

### 4. User Management
- **User Accounts**: Create and manage user profiles
- **Role Assignment**: Assign appropriate roles and permissions
- **Password Management**: Secure password policies and changes
- **Access Control**: Control user access to features

### 4. Reporting
- **Sales Reports**: Daily, weekly, and monthly sales analytics
- **Inventory Reports**: Stock levels and movement tracking
- **User Activity**: Track user actions and system usage
- **Financial Reports**: Revenue and billing analytics

---

## Point of Sale (POS) Operations

### Starting a Sale
1. Navigate to the POS page from the main menu
2. Select your organization (if you're a Super Admin)
3. Browse products using the search bar or category filters
4. Click on products to add them to your cart

### Cart Management
- **Adding Items**: Click on any product to add it to the cart
- **Modifying Quantities**: Use the +/- buttons or enter quantities manually
- **Removing Items**: Click the trash icon to remove items
- **Applying Discounts**: Enter discount amounts or percentages
- **Adding Notes**: Add special notes for specific items

### Customer Selection (Optional)
For better customer relationship management:
1. Click **"Add Customer"** button in the cart
2. Search for existing customer by name, phone, or email
3. Select customer from search results
4. Or click **"Create New Customer"** to add a new customer
5. Customer information will be linked to the sale

### Payment Processing
1. Review your cart items and total amount
2. Select payment method:
   - **Cash**: Traditional cash payment
   - **Card**: Credit/debit card payment
   - **Digital**: Digital wallet or online payment methods
   - **Credit**: Credit purchase (requires customer selection and feature enablement)
   - **Split**: Partial cash and partial card payment
3. For cash payments:
   - Enter the amount given by the customer (optional - defaults to total amount)
   - System will automatically calculate and display:
     - **Total Due**: The exact amount required
     - **Remaining**: Amount still needed if underpayment
     - **Balance Returned**: Change to be given back if overpayment (shown in green)
4. For split payments:
   - Enter cash amount
   - Enter card amount
   - System will show total paid, remaining balance, or change
5. For credit purchases:
   - Customer selection is mandatory
   - Credit balance will be automatically updated
6. Click **"Complete Sale"** to finalize the transaction
7. Print or email the receipt as needed

### Payment Amount Display Features

#### Cash Payment Enhancements
- **Amount Given Field**: Enter the exact amount received from customer
- **Real-time Calculations**: See remaining balance or change instantly
- **Visual Indicators**: 
  - Amber text for remaining amount (underpayment)
  - Green text for balance returned (overpayment)
  - Automatic validation to prevent insufficient payments

#### Receipt and Bill Information
- **Amount Given**: Shows exactly how much money the customer provided
- **Balance Returned**: Displays change calculated for the transaction
- **Payment Breakdown**: Clear separation of payment method details
- **Printed Receipts**: Includes amount given and balance returned on physical receipts

#### Bill History and Reports
- **Transaction Details**: View amount given and balance returned in bill history
- **Reprint Functionality**: Reprinted bills include complete payment information
- **Report Integration**: Payment amount data available in detailed reports

### Payment Method Features
- **Digital Payments**: Support for digital wallets and online payment methods
- **Credit Purchases**: Available when enabled in organization settings
- **Customer Linking**: Credit purchases require customer selection
- **Split Payments**: Support for partial cash and card combinations
- **Receipt Information**: Receipts show payment method and customer details

### Miscellaneous Items
For items not in the inventory:
1. Click "Add Miscellaneous Item" button
2. Enter item name, price, and quantity
3. Add to cart and proceed with normal checkout

### Cart Features
- **Mobile Cart View**: Optimized cart display for mobile devices
- **Real-time Updates**: Cart updates instantly as items are added/removed
- **Tax Calculation**: Automatic tax calculation based on settings
- **Subtotal Display**: Clear breakdown of costs

---

## Product Management

### Adding New Products
1. Go to Settings → Products tab
2. Click "Add New Product" button
3. Fill in product details:
   - **Product Name**: Descriptive name for the product
   - **Category**: Select appropriate category
   - **Price**: Set selling price
   - **Cost**: Enter cost price (for profit calculations)
   - **Unit of Measure**: Select from predefined units
   - **Stock Quantity**: Initial inventory count
   - **Description**: Optional product description
4. Click "Save Product" to add to inventory

### Editing Products
1. Navigate to Settings → Products tab
2. Find the product you want to edit
3. Click the edit icon (pencil) next to the product
4. Modify the required fields
5. Click "Update Product" to save changes

### Deleting Products
1. Go to Settings → Products tab
2. Locate the product to delete
3. Click the delete icon (trash)
4. Confirm the deletion in the popup dialog

### Product Search and Filter
- **Search**: Use the search bar to find products by name
- **Category Filter**: Filter products by specific categories
- **Stock Filter**: View in-stock or out-of-stock items
- **Sort Options**: Sort by name, price, or stock quantity

### Bulk Operations
- **Import Products**: Import product lists from CSV files
- **Export Products**: Export product data for backup or analysis
- **Bulk Updates**: Update multiple products simultaneously

---

## Category Management

### Creating Categories
1. Navigate to Settings → Categories tab
2. Click "Add New Category"
3. Enter category details:
   - **Category Name**: Clear, descriptive name
   - **Description**: Optional category description
   - **Parent Category**: For sub-category organization
4. Save the category

### Managing Categories
- **Edit Categories**: Modify category names and descriptions
- **Delete Categories**: Remove unused categories
- **Reorder Categories**: Change category display order
- **Category Products**: View all products in each category

### Category Features
- **Hierarchical Structure**: Create parent and sub-categories
- **Product Count**: See number of products in each category
- **Color Coding**: Visual distinction between categories
- **Quick Access**: Filter products by category in POS

---

## Customer Management

### Overview
Customer Management allows you to maintain a comprehensive database of your customers, track their purchase history, and manage credit accounts. This feature is particularly useful for businesses that offer credit purchases or want to build customer relationships.

### Accessing Customer Management
1. Navigate to the **Customers** section in the top navigation bar
2. Only admin users can access customer management features
3. The customer list displays all registered customers with their contact information and credit status

### Adding New Customers
1. Click the **"Add Customer"** button in the Customer Management page
2. Fill in the customer information:
   - **Name** (required): Customer's full name
   - **Phone**: Contact phone number
   - **Email**: Email address for notifications
   - **Address**: Physical address
3. Click **"Create Customer"** to save

### Searching Customers
- Use the search bar to find customers by name, phone, or email
- Results update in real-time as you type
- Customer credit balances are displayed with color coding:
  - Green: Positive credit balance (customer has credit)
  - Red: Negative credit balance (customer owes money)

### Managing Customer Information
#### Editing Customer Details
1. Click the edit icon (pencil) next to any customer
2. Update the customer information as needed
3. Click **"Update"** to save changes

#### Updating Credit Balance
1. Click the credit icon (dollar sign) next to any customer
2. Enter the amount to adjust:
   - Positive numbers: Add credit to customer account
   - Negative numbers: Subtract credit (customer payment)
3. Add a description for the credit adjustment (optional)
4. Click **"Update Balance"** to save

#### Viewing Credit History
1. Click the credit history icon (document) next to any customer
2. The Credit History modal displays:
   - **Current Balance**: Customer's current credit status
   - **Total Payments**: Sum of all payments made by customer
   - **Total Purchases**: Sum of all credit purchases
   - **Transaction Count**: Number of credit transactions
3. **Transaction List** shows:
   - **Transaction Type**: Purchase, Payment, or Adjustment
   - **Amount**: Transaction amount with + or - indicator
   - **Description**: Details of the transaction
   - **Date & Time**: When the transaction occurred
   - **Running Balance**: Balance after each transaction
   - **User**: Who performed the transaction
4. **Color Coding**:
   - Green: Payments (positive balance impact)
   - Red: Purchases (negative balance impact)
   - Yellow: Manual adjustments
5. Click **"Close"** to exit the credit history view

#### Deleting Customers
1. Click the delete icon (trash) next to any customer
2. Confirm the deletion in the popup dialog
3. **Note**: Customers with outstanding credit balances cannot be deleted

### Customer Information Display
Each customer card shows:
- **Name and Contact**: Basic contact information
- **Credit Balance**: Current credit status with color coding and organization's currency symbol
- **Purchase Statistics**: 
  - Total number of purchases
  - Total purchase amount with organization's currency symbol

### Currency Display
- All monetary values (credit balances, purchase totals) display using your organization's configured currency symbol
- Currency symbol is automatically set based on your organization settings
- Supported currencies include: USD ($), EUR (€), GBP (£), JPY (¥), INR (₹), LKR (Rs), CAD (CA$), AUD (A$), SGD (S$), MYR (RM)
- Credit balance updates show the appropriate currency symbol in confirmation messages

### Credit Purchases Integration
When credit purchases are enabled in organization settings:
- Customers can be linked to sales transactions
- Credit purchases automatically update customer balances as negative values
- Customer selection is required for credit sales
- Purchase history is tracked for each customer

#### Credit Purchase Process
1. **Enable Credit Purchases**: Admin must enable credit purchases in Organization Settings
2. **Select Customer**: Choose a customer from the customer search in the cart
3. **Choose Credit Payment**: Select "Credit" as the payment method
4. **Complete Sale**: The system automatically:
   - Processes the sale transaction
   - Updates customer credit balance (negative value)
   - Records the purchase in customer's credit history
   - Generates receipt with credit payment details

#### Credit Balance Management
- **Negative Balance**: Customer owes money to the business (from credit purchases)
- **Positive Balance**: Customer has prepaid credit or advance payments
- **Zero Balance**: No outstanding credit or debt

#### Settlement Process
When customers make payments to settle their credit:
1. Go to Customer Management
2. Find the customer with outstanding balance
3. Click the credit adjustment icon (dollar sign)
4. Enter positive amount to add credit (payment received)
5. Add description (e.g., "Payment for outstanding balance")
6. Click "Update Balance"

#### Advance Payments
For customers who pay in advance:
1. Follow the same credit adjustment process
2. Enter positive amount to add credit
3. Description should indicate "Advance payment"
4. Customer's balance will show as positive (credit available)

### Best Practices
- **Regular Updates**: Keep customer information current for better service
- **Credit Management**: Review credit balances regularly and follow up on outstanding amounts
- **Data Quality**: Ensure accurate contact information for customer communications
- **Privacy**: Respect customer privacy and data protection regulations

---

## Settings and Configuration

### General Settings
1. Go to Settings → General tab
2. Configure the following:
   - **Business Name**: Your organization name
   - **Currency**: Select local currency
   - **Tax Rate**: Set applicable tax percentage
   - **Contact Information**: Business contact details
   - **Business Hours**: Operating hours
   - **Receipt Header/Footer**: Custom receipt text

### Organization Settings
- **Organization Details**: Name, address, contact information
- **Tax Configuration**: Tax rates and rules
- **Currency Settings**: Local currency and formatting
- **Receipt Customization**: Header, footer, and logo settings

### System Preferences
- **Theme Selection**: Choose color scheme and appearance
- **Language Settings**: Select preferred language
- **Time Zone**: Set local time zone
- **Date Format**: Choose date display format

### Discount Configuration
MGPOS supports flexible discount options to meet various business needs:

#### Discount Types
1. **Global Discount**: Apply a single discount percentage to all items
2. **Category Discount**: Set different discounts for each product category
3. **Item Discount**: Configure individual discounts per product

#### Setting Up Category-wise Discounts
1. Go to Settings → Billing tab
2. Select "Category Discount" from Discount Type options
3. Go to Settings → Master Data → Categories tab
4. Configure discounts for each category:
   - Toggle the discount switch for each category
   - Choose discount type (percentage or fixed amount)
   - Enter the discount value
5. Discounts are automatically applied to items in those categories

#### Global Discount Setup
1. Go to Settings → Billing tab
2. Select "Global Discount" from Discount Type options
3. Enter the discount percentage to apply to all items

#### Item Discount Setup
1. Go to Settings → Products tab
2. Edit individual products
3. Configure discount settings in the product form
4. Set discount type (percentage or fixed amount) and value

#### Additional Discount Features
- **Cart Discount Override**: Allow custom discounts directly in the cart
- **Bill Reprint**: Enable reprinting bills from today
- **Miscellaneous Items**: Add one-off items at checkout

### Activity Logging Settings

Organization administrators and super administrators can control whether user actions and system events are logged for audit purposes.

#### Accessing Logging Settings
1. Go to Settings → Billing tab
2. Scroll down to the "Activity Logging" section
3. Toggle the logging switch to enable or disable activity logging

#### Logging Behavior
- **When Enabled**: All user actions, system events, and administrative operations are recorded in the system logs
- **When Disabled**: No activity logs are written to the database for the organization
- **Default State**: Logging is disabled by default for new organizations
- **Super Admin Context**: Super admin operations respect organization logging settings when performed within an organization context
- **System-Level Logs**: Truly system-wide operations (like login screen changes) are always logged

#### What Gets Logged
When logging is enabled, the following activities are recorded:
- User login and logout events
- Product additions, updates, and deletions
- Category management operations
- Sales transactions and billing activities
- Settings changes
- User account management
- System errors and warnings

#### Privacy and Performance Considerations
- **Data Privacy**: Consider privacy implications when enabling logging
- **Storage Impact**: Logs consume database storage over time
- **Performance**: Minimal performance impact when logging is enabled
- **Audit Trail**: Essential for security investigations and compliance

#### Super Admin Logging Behavior
Super administrators have two types of operations that are handled differently:

**Organization-Context Operations** (respect organization settings):
- Creating, updating, or deleting users within specific organizations
- Modifying organization settings and configurations
- Refreshing user lists for specific organizations
- Any action performed while working within a specific organization

**System-Level Operations** (always logged):
- Login screen changes and system-wide UI updates
- Global system configuration changes
- System error reporting
- Operations that affect the entire system

**Example Scenarios**:
- If logging is disabled for Organization A, super admin actions within Organization A will not be logged
- System-wide changes (like login screen updates) will always be logged regardless of organization settings
- Super admin can still view all logs across all organizations, but creation of new logs respects organization settings

#### Access to Logs
- **Organization Admins**: Can view logs for their organization
- **Super Admins**: Can view logs for all organizations
- **Regular Users**: No access to system logs

### Security Settings
- **Password Policies**: Minimum length and complexity requirements
- **Session Timeout**: Auto-logout duration
- **Access Logs**: Track user login attempts
- **Two-Factor Authentication**: Enhanced security options

---

## Reports and Analytics

### Accessing Reports
1. Go to Reports section from the main menu
2. Select the type of report you want to view
3. Set date range and filters
4. **For Super Admins & Multi-Org Admins**: Select organizations (optional - you can select multiple organizations or leave empty to use current selected organization)
5. Generate and view the report

### Multi-Organization Reporting (Super Admin & Multi-Org Admin Feature)
Super administrators and organization administrators with access to multiple organizations can generate reports across multiple organizations:

#### Organization Selection
- **Single Organization**: Leave the organization selector empty to use the currently selected organization from the navigation bar
- **Multiple Organizations**: Click on organization names in the selector to select multiple organizations
- **Visual Feedback**: Selected organizations appear highlighted in green
- **Selection Display**: Shows "Selected: [Organization Names]" when multiple organizations are chosen

#### Report Generation
- **Combined Data**: Reports aggregate data from all selected organizations
- **Organization Breakdown**: Detailed reports show which organization each transaction belongs to
- **Unified Analytics**: Summary statistics combine data across all selected organizations

#### Access Levels
- **Super Admins**: Can generate reports for any organization in the system
- **Multi-Org Admins**: Can generate reports only for organizations they have admin access to
- **Single-Org Admins**: Can only generate reports for their assigned organization

#### Best Practices
- Use specific date ranges when generating multi-organization reports to manage data volume
- Consider using summary reports for large date ranges across multiple organizations
- Verify organization selections before generating large reports
- Multi-org admins will only see organizations they have access to in the selector

### Report Types

#### Sales Reports
- **Daily Sales**: Sales breakdown by day
- **Weekly Summary**: Weekly sales trends
- **Monthly Analytics**: Monthly performance metrics
- **Product Sales**: Best-selling products
- **Category Performance**: Sales by category

#### Inventory Reports
- **Stock Levels**: Current inventory status
- **Low Stock Alert**: Products needing reorder
- **Stock Movement**: Inventory changes over time
- **Valuation Report**: Total inventory value

#### User Activity Reports
- **Login History**: User access patterns
- **Transaction History**: User sales activity
- **Performance Metrics**: Individual user statistics
- **Access Logs**: System access records

#### Financial Reports
- **Revenue Summary**: Total revenue breakdown
- **Profit Analysis**: Cost vs. selling price analysis
- **Tax Reports**: Tax collection and remittance
- **Payment Methods**: Payment type distribution
- **Discount Analysis**: Detailed discount breakdown and impact

#### Enhanced Discount Reporting
The system now provides comprehensive discount information across all reports, showing exactly how discounts are applied to each transaction.

**Discount Information Available**
- **Item-wise Details**: See which items received discounts and the exact amount/percentage
- **Discount Types**: Identify if discounts are custom, item-level, category-based, or global
- **Discount Descriptions**: Human-readable descriptions (e.g., "Item: 10%", "Category (electronics): 15%")
- **Total Impact**: View the combined effect of all discounts on each transaction

**Where to Find Discount Information**
- **Billing Reports**: Each bill shows detailed discount breakdown in the modal view
- **Sales Reports**: Detailed reports include a "Discount Details" column
- **Receipt Printing**: Both printed and on-screen receipts show discount breakdown
- **Bill Details Modal**: Click "View" on any bill to see comprehensive discount information

**Understanding Discount Types**
- **Custom**: User-entered currency discount applied to specific items
- **Item**: Individual item discounts configured in product settings
- **Category**: Category-wide discounts applied to all items in a category
- **Global**: Cart-wide percentage discounts applied to the entire purchase

**Report Examples**
```
Discount Details Column in Detailed Reports:
- Laptop(Item: 10%), Keyboard(Custom: 15.00 (15.0%))
- Mouse(Category (electronics): 15%)
- Global: 10%
```

**Benefits for Business Owners**
- **Transparency**: Clear visibility into how discounts affect sales
- **Audit Trail**: Complete record of discount applications for accounting
- **Performance Analysis**: Understand which discounts drive sales
- **Customer Insights**: See discount patterns and customer behavior

### Scheduled Reports
- **Automated Report Generation**: Set up recurring reports
- **Email Notifications**: Receive reports via email
- **Customizable Frequency**: Choose report frequency (daily, weekly, monthly)

---

## Advanced Reporting and Analytics
## User Management

### Creating New Users
1. Go to Settings → Users tab
2. Click "Add New User"
3. Enter user information:
   - **Username**: Unique login identifier
   - **Full Name**: User's complete name
   - **Email Address**: Contact email
   - **Phone Number**: Contact phone
   - **Role**: Assign appropriate role (Admin/Regular User)
4. Set initial password
5. Assign organization access (if applicable)
6. Save the user account

### Managing User Accounts
- **Edit User Information**: Update personal details
- **Change Roles**: Modify user permissions
- **Reset Passwords**: Secure password reset process
- **Deactivate Users**: Disable user accounts
- **Delete Users**: Remove user accounts permanently

### User Profile Management
- **Personal Information**: Update name, email, phone
- **Password Change**: Secure password updates
- **Organization Access**: Manage organization assignments
- **Activity History**: View user action logs

### Access Control
- **Role-Based Permissions**: Different access levels
- **Organization Restrictions**: Limit access to specific organizations
- **Feature Access**: Control access to specific features
- **Time-Based Access**: Schedule-based access restrictions

---

## Organization Management

### Creating Organizations (Super Admin Only)
1. Navigate to Super Admin → Organizations
2. Click "Create New Organization"
3. Enter organization details:
   - **Organization Name**: Official business name
   - **Business Type**: Retail, restaurant, service, etc.
   - **Address**: Physical location
   - **Contact Information**: Phone and email
   - **Tax ID**: Business tax identifier
4. Configure organization settings
5. Assign initial admin user
6. Save the organization

### Managing Organizations
- **Edit Organization Details**: Update business information
- **Configure Settings**: Organization-specific preferences
- **Manage Users**: Assign users to organizations
- **View Statistics**: Organization performance metrics
- **Delete Organizations**: Remove inactive organizations

### Organization Features
- **Multi-Branch Support**: Manage multiple locations
- **Independent Inventory**: Separate product catalogs
- **Dedicated Reports**: Organization-specific analytics
- **Custom Branding**: Organization-specific themes

---

## Troubleshooting

### Common Issues and Solutions

#### Login Problems
- **Issue**: Cannot log in with correct credentials
- **Solution**: 
  - Check username and password spelling
  - Ensure Caps Lock is off
  - Contact admin to reset password
  - Verify account is active

#### Product Not Found
- **Issue**: Product doesn't appear in search
- **Solution**:
  - Check product spelling
  - Verify product is active
  - Ensure correct category is selected
  - Check stock availability

#### Cart Issues
- **Issue**: Items not adding to cart
- **Solution**:
  - Refresh the page
  - Check internet connection
  - Clear browser cache
  - Try a different browser

#### Report Generation Errors
- **Issue**: Reports not loading
- **Solution**:
  - Check date range selection
  - Verify user permissions
  - Ensure data exists for selected period
  - Contact admin if issue persists

#### Performance Issues
- **Issue**: System running slowly
- **Solution**:
  - Check internet speed
  - Close other browser tabs
  - Clear browser cache
  - Restart browser

### Error Messages
- **"Invalid Credentials"**: Username or password incorrect
- **"Access Denied"**: Insufficient permissions
- **"Product Not Found"**: Product doesn't exist or is inactive
- **"Insufficient Stock"**: Product out of inventory
- **"Session Expired"**: Login again to continue

### Getting Help
1. **Check User Guide**: Refer to this documentation
2. **Contact Admin**: Reach out to your system administrator
3. **Support Ticket**: Submit a support request
4. **FAQ Section**: Check frequently asked questions

---

## System Enums and Constants

### Overview
MGPOS uses centralized enums and constants to maintain consistency throughout the application. These enums replace hard-coded strings and provide type safety for various system operations.

### Discount Enums

#### Discount Types
- **PERCENTAGE**: Percentage-based discounts (e.g., 10% off)
- **FIXED**: Fixed amount discounts (e.g., $5 off)
- **CURRENCY**: Currency-based discounts for cart items

#### Discount Modes
- **GLOBAL**: Single discount applied to entire cart
- **ITEM**: Individual item discounts
- **CATEGORY**: Category-specific discounts

#### Discount Sources
- **ITEM**: Discount applied at individual product level
- **CATEGORY**: Discount applied based on product category
- **CUSTOM**: User-entered custom discount
- **GLOBAL**: Cart-wide discount

### Payment Methods
- **CASH**: Traditional cash payments
- **CARD**: Credit/debit card payments
- **SPLIT**: Combination of cash and card payments
- **DIGITAL**: Digital wallet and online payment methods
- **CREDIT**: Credit purchases (requires customer selection)

### Report Types
- **SUMMARY**: Summary reports with aggregated data
- **DETAILED**: Detailed reports with individual transaction data
- **CASH**: Cash payment method reports
- **CARD**: Card payment method reports
- **DIGITAL**: Digital payment method reports
- **CREDIT**: Credit payment method reports

### Report Periods
- **TODAY**: Current day reports
- **YESTERDAY**: Previous day reports
- **THIS_WEEK**: Current week reports
- **LAST_WEEK**: Previous week reports
- **THIS_MONTH**: Current month reports
- **LAST_MONTH**: Previous month reports
- **THIS_YEAR**: Current year reports
- **LAST_YEAR**: Previous year reports
- **CUSTOM**: Custom date range reports

### User Roles
- **ADMIN**: Organization administrator with full access
- **CASHIER**: Regular user with POS access
- **MANAGER**: Manager with elevated permissions
- **SUPER_ADMIN**: System-wide administrator

### Transaction Types
- **SALES**: Sales transactions
- **PURCHASE**: Purchase transactions
- **RETURN**: Return/refund transactions

### Tax Status
- **ENABLED**: Tax calculation is enabled
- **DISABLED**: Tax calculation is disabled

### Currency Types
- **DEFAULT**: Default currency (USD)
- **LOCAL**: Local currency configuration

### Logging System Enums

#### Log Levels
- **INFO**: Informational messages
- **WARNING**: Warning messages
- **ERROR**: Error messages
- **SUCCESS**: Success messages

#### Log Types
The system tracks various types of activities:

**User Actions**
- USER_LOGIN: User login events
- USER_LOGOUT: User logout events
- USER_SIGNUP: New user registration
- USER_PASSWORD_CHANGE: Password updates
- USER_CREATE: User account creation
- USER_UPDATE: User profile updates
- USER_DELETE: User account deletion
- USER_ROLE_CHANGE: Role modifications

**Master Data Operations**
- MASTER_DATA_CREATE: Master data creation
- MASTER_DATA_UPDATE: Master data updates
- MASTER_DATA_DELETE: Master data deletion

**Product Operations**
- PRODUCT_CREATE: Product addition
- PRODUCT_UPDATE: Product modifications
- PRODUCT_DELETE: Product removal

**Category Operations**
- CATEGORY_CREATE: Category addition
- CATEGORY_UPDATE: Category modifications
- CATEGORY_DELETE: Category removal

**Customer Operations**
- CUSTOMER_CREATE: Customer registration
- CUSTOMER_UPDATE: Customer information updates
- CUSTOMER_DELETE: Customer account deletion

**Billing/Sales Operations**
- SALE_CREATE: New sales transaction
- SALE_UPDATE: Sales transaction modifications
- SALE_DELETE: Sales transaction deletion
- SALE_VOID: Voided sales
- BILL_REPRINT: Bill reprint operations

**Organization Operations**
- ORG_CREATE: Organization creation
- ORG_UPDATE: Organization updates
- ORG_DELETE: Organization deletion

**Settings Operations**
- SETTINGS_UPDATE: Configuration changes

**System Operations**
- SYSTEM_ERROR: System errors
- SYSTEM_WARNING: System warnings
- DATA_IMPORT: Data import operations
- DATA_EXPORT: Data export operations

**UI Operations**
- TOAST_NOTIFICATION: User notifications
- UI_REFRESH: Interface refresh events

**Reporting Operations**
- REPORT_GENERATE: Report generation
- REPORT_PRINT: Report printing
- REPORT_VIEW: Report viewing

### Default Values
The system uses these default values for various operations:
- Default discount type: PERCENTAGE
- Default discount mode: GLOBAL
- Default payment method: CASH
- Default report type: SUMMARY
- Default report period: TODAY
- Default user role: CASHIER

### Validation Functions
The system includes validation functions for all enums to ensure data integrity:
- `isValidDiscountType()`
- `isValidDiscountMode()`
- `isValidPaymentMethod()`
- `isValidReportType()`
- `isValidReportPeriod()`
- `isValidUserRole()`

---

## Best Practices

### Daily Operations
- **Start of Day**: Verify system is working correctly
- **During Shift**: Regularly save sales data
- **End of Day**: Review daily sales and close registers
- **Inventory Checks**: Verify stock levels regularly

### Security Best Practices
- **Password Security**: Use strong, unique passwords
- **Log Out**: Always log out when finished
- **Shared Devices**: Don't save passwords on shared computers
- **Regular Updates**: Keep passwords updated regularly

### Data Management
- **Regular Backups**: Ensure data is backed up regularly
- **Data Validation**: Verify data accuracy before entry
- **Report Reviews**: Regularly review reports for anomalies
- **Documentation**: Keep records of important changes

### Customer Service
- **Accuracy**: Double-check order details
- **Speed**: Process transactions efficiently
- **Communication**: Clearly explain any issues
- **Professionalism**: Maintain professional demeanor

### System Maintenance
- **Regular Updates**: Keep system updated
- **Performance Monitoring**: Watch for system issues
- **User Training**: Regularly train new users
- **Feedback Collection**: Gather user feedback for improvements

---

## Quick Reference

### Keyboard Shortcuts
- **Ctrl + S**: Save current form
- **Ctrl + F**: Search products
- **Esc**: Close modal windows
- **Enter**: Confirm actions
- **Tab**: Navigate between fields

### Common Workflows
1. **Complete Sale**: Select Products → Add to Cart → Process Payment → Print Receipt
2. **Add Product**: Settings → Products → Add New → Fill Details → Save
3. **Generate Report**: Reports → Select Type → Set Date Range → Generate → Export
4. **Manage User**: Settings → Users → Add/Edit → Fill Details → Save

### Contact Information
- **System Administrator**: [Admin Contact]
- **Technical Support**: [Support Email/Phone]
- **Training Resources**: [Training Portal Link]

---

## Payment Method Reports

### Overview

The Payment Method Reports feature provides comprehensive financial analysis capabilities for businesses to track and analyze sales performance across different payment methods. This feature enables business owners, managers, and financial analysts to gain insights into cash flow, payment preferences, and revenue distribution.

### Business Value

#### Key Benefits

1. **Financial Transparency**
   - Clear separation of cash vs card sales for better cash flow management
   - Detailed breakdown of split payment transactions
   - Accurate tracking of payment method preferences

2. **Operational Efficiency**
   - Streamlined reporting process with intuitive interface
   - Real-time data analysis for quick decision-making
   - Export capabilities for external accounting systems

3. **Strategic Planning**
   - Payment method trend analysis for business planning
   - Cash flow forecasting based on payment patterns
   - Staff performance analysis by payment method handling

4. **Compliance & Audit**
   - Complete audit trail for all payment transactions
   - Detailed reporting for financial compliance requirements
   - Split payment transparency for accounting accuracy

### Report Types

#### 1. Cash Sales Report

**Purpose**: Track all cash-based transactions including cash portions from split payments.

**Business Use Cases**:
- Daily cash reconciliation
- Cash flow forecasting
- Bank deposit planning
- Cash handling staff performance analysis

**Data Included**:
- Pure cash transactions
- Cash portions from split payments
- Transaction timestamps and cashier details
- Gross sales, discounts, and net sales figures

**Key Metrics**:
- Total cash amount collected
- Number of cash transactions
- Average cash transaction value
- Cash vs split payment breakdown

#### 2. Card Sales Report

**Purpose**: Monitor all card-based transactions including card portions from split payments.

**Business Use Cases**:
- Payment processor fee analysis
- Card payment trend tracking
- Electronic payment reconciliation
- Staff training for card handling

**Data Included**:
- Pure card transactions
- Card portions from split payments
- Transaction timestamps and cashier details
- Complete sales and discount information

**Key Metrics**:
- Total card amount processed
- Number of card transactions
- Average card transaction value
- Card vs split payment breakdown

#### 3. Digital Sales Report

**Purpose**: Track all digital payment transactions including digital wallets and online payment methods.

**Business Use Cases**:
- Digital payment trend analysis
- Online payment processor reconciliation
- Customer payment preference tracking
- Digital payment fee management

**Data Included**:
- Pure digital payment transactions
- Transaction timestamps and cashier details
- Complete sales and discount information
- Digital payment method details

**Key Metrics**:
- Total digital payment amount processed
- Number of digital payment transactions
- Average digital transaction value
- Digital payment adoption rate

### Split Payment Handling

#### Business Logic

Split payments are intelligently distributed across reports to provide accurate financial insights:

1. **Cash Report**: Includes cash portion of split payments
2. **Card Report**: Includes card portion of split payments

#### Example Scenario

A customer pays $125 split as $75 cash and $50 card:

- **Cash Sales Report**: Shows $75 contribution from this transaction
- **Card Sales Report**: Shows $50 contribution from this transaction
- **Split Payment Details**: Shows complete breakdown for transparency

#### Accounting Benefits

- **Accurate Cash Flow**: Cash reports reflect actual cash received
- **Precise Card Reconciliation**: Card reports match processor statements
- **Complete Revenue Tracking**: Individual reports show payment-specific totals
- **Audit Compliance**: Split payment details provide full transparency

### User Interface Features

#### Report Generation

1. **Period Selection**: Choose from predefined periods (Today, This Week, This Month, This Year) or custom date ranges
2. **Organization Filtering**: Multi-organization support for consolidated or individual reporting
3. **Real-time Processing**: Instant report generation with current data

#### Report Display

1. **Summary Cards**: Key metrics displayed prominently (Gross Sales, Discounts, Net Sales, Transactions)
2. **Detailed Tables**: Complete transaction listings with filtering and sorting, including:
   - Receipt numbers and timestamps
   - Cashier information
   - **Payment Method** column showing cash, card, digital, credit, or split payments
   - Item counts and financial details
3. **Split Payment Details**: Separate section for split payment breakdowns
4. **Print Functionality**: Professional printed reports with complete payment method information

#### Export Capabilities

1. **Print-Ready Format**: Optimized layouts for physical printing
2. **Complete Data**: All transaction details included in exports
3. **Professional Appearance**: Company branding and formatting maintained

### Business Scenarios

#### Scenario 1: Daily Cash Reconciliation

**Situation**: Store manager needs to reconcile daily cash receipts.

**Solution**: 
1. Generate Cash Sales Report for "Today"
2. Review total cash amount collected
3. Cross-reference with cash drawer count
4. Use split payment details to verify mixed payments

**Outcome**: Accurate cash reconciliation with full audit trail

#### Scenario 2: Payment Processor Reconciliation

**Situation**: Finance department needs to reconcile card payments with processor statements.

**Solution**:
1. Generate Card Sales Report for the billing period
2. Export total card amount processed
3. Match against processor settlement amounts
4. Investigate discrepancies using detailed transaction data

**Outcome**: Precise card payment reconciliation and fee analysis

#### Scenario 3: Monthly Financial Reporting

**Situation**: Executive team needs comprehensive payment analysis for monthly review.

**Solution**:
1. Generate all available report types for "This Month"
2. Analyze payment method trends and patterns
3. Review split payment impact on cash flow
4. Create presentation materials with key insights

**Outcome**: Complete payment method analysis for strategic decision-making

#### Scenario 4: Staff Performance Analysis

**Situation**: Management needs to evaluate cashier performance by payment method.

**Solution**:
1. Generate detailed reports with cashier breakdowns
2. Analyze payment method handling efficiency
3. Identify training needs for specific payment types
4. Monitor split payment handling accuracy

**Outcome**: Data-driven staff performance evaluation and targeted training

### Security & Access Control

#### User Permissions

1. **Admin Access**: Full access to all payment method reports
2. **Manager Access**: Reports for assigned organizations only
3. **Super Admin Access**: Multi-organization consolidated reporting

#### Data Protection

1. **Sensitive Information**: Customer details protected in reports
2. **Audit Logging**: All report generation actions logged
3. **Access Control**: Role-based access to reporting features

### Integration Capabilities

#### Accounting Systems

1. **Export Formats**: Data structured for easy import
2. **Period Mapping**: Aligns with standard accounting periods
3. **Category Classification**: Payment method categorization for accounting

#### External Systems

1. **API Access**: Report data available via API (future enhancement)
2. **Webhook Support**: Automated report generation (future enhancement)
3. **Third-party Integration**: Compatible with popular accounting software

### Performance Considerations

#### Report Generation Speed

1. **Optimized Queries**: Efficient database access for large datasets
2. **Caching**: Frequently accessed data cached for performance
3. **Background Processing**: Large reports processed asynchronously

#### Scalability

1. **Multi-organization**: Supports enterprise-level data volumes
2. **Historical Data**: Access to complete transaction history
3. **Concurrent Users**: Multiple users can generate reports simultaneously

### Future Enhancements

#### Planned Features

1. **Automated Scheduling**: Scheduled report generation and delivery
2. **Advanced Analytics**: Payment trend forecasting and insights
3. **Mobile Access**: Mobile-optimized report viewing
4. **Custom Reporting**: User-defined report configurations

#### Business Intelligence

1. **Trend Analysis**: Payment method preference trends over time
2. **Predictive Analytics**: Cash flow forecasting based on patterns
3. **Benchmarking**: Industry comparison capabilities
4. **Alert System**: Anomalies and threshold notifications

### Training & Support

#### User Training

1. **Report Generation**: Step-by-step guide for creating reports
2. **Data Interpretation**: Understanding report metrics and insights
3. **Troubleshooting**: Common issues and solutions
4. **Best Practices**: Optimizing report usage for business value

#### Support Resources

1. **Documentation**: Comprehensive user guides and reference materials
2. **Video Tutorials**: Visual walkthroughs of key features
3. **Help Desk**: Technical support for report issues
4. **Community Forum**: User community for best practice sharing

### Compliance & Legal

#### Financial Reporting Standards

1. **GAAP Compliance**: Aligns with standard accounting practices
2. **Audit Requirements**: Complete audit trail maintenance
3. **Tax Reporting**: Supports tax preparation requirements
4. **Regulatory Compliance**: Meets financial industry standards

#### Data Retention

1. **Historical Data**: Complete transaction history maintained
2. **Archive Policies**: Configurable data retention periods
3. **Backup Procedures**: Regular data backup and recovery
4. **Data Integrity**: Ensures accuracy and consistency of reported data

---

#### Conclusion

The Payment Method Reports feature provides businesses with powerful tools for financial analysis, cash flow management, and strategic decision-making. By offering comprehensive reporting across cash, card, and split payments, organizations can gain complete visibility into their payment ecosystem while maintaining accuracy, compliance, and operational efficiency.

This documentation serves as a comprehensive guide for business users to understand, implement, and maximize the value of the payment method reporting functionality within their organization.

---

*This documentation is regularly updated to reflect system changes and improvements. Last updated: [Current Date]*