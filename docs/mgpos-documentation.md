# MGPOS - User Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Main Features](#main-features)
5. [Point of Sale (POS) Operations](#point-of-sale-pos-operations)
6. [Product Management](#product-management)
7. [Category Management](#category-management)
8. [Settings and Configuration](#settings-and-configuration)
9. [Reports and Analytics](#reports-and-analytics)
10. [User Management](#user-management)
11. [Organization Management](#organization-management)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)

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

### 3. User Management
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

### Payment Processing
1. Review your cart items and total amount
2. Select payment method (Cash, Card, or other)
3. Enter payment amount (for cash payments)
4. Click "Complete Sale" to finalize the transaction
5. Print or email the receipt as needed

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
4. Generate and view the report

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

### Report Features
- **Date Range Selection**: Flexible time periods
- **Export Options**: Download as PDF, Excel, or CSV
- **Print Functionality**: Direct printing capability
- **Scheduled Reports**: Automated report generation
- **Real-time Data**: Live report updates

---

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

*This documentation is regularly updated to reflect system changes and improvements. Last updated: [Current Date]*