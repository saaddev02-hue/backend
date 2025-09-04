# Company Management Guide

## Overview
This guide explains how to manage companies and their domains in the Saher Flow Solutions system. Companies control which email domains are allowed for user registration.

## Prerequisites
- Admin account with valid JWT token
- API running on http://localhost:5000
- Postman or similar API testing tool

## Getting Admin Access

### Step 1: Create Admin User
First, you need to create an admin user. You can do this by:

1. **Option A: Direct Database Update (Recommended for first admin)**
   ```javascript
   // Connect to your MongoDB and run this script
   db.users.updateOne(
     { email: "your-admin-email@saherflow.com" },
     { $set: { role: "admin" } }
   )
   ```

2. **Option B: Modify User Model temporarily**
   - Temporarily change the default role to 'admin' in User.js
   - Register a new user
   - Change the default back to 'user'

### Step 2: Login to Get Admin Token
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@saherflow.com",
  "password": "YourAdminPassword123"
}
```

Save the returned token for use in subsequent requests.

## Company Management Operations

### 1. View All Companies
**Endpoint:** `GET /api/company`
**Access:** Public (shows only active companies)

```bash
GET http://localhost:5000/api/company
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "_id": "company_id",
        "name": "Saudi Aramco",
        "domains": ["aramco.com"],
        "description": "Saudi Arabian Oil Company"
      }
    ]
  }
}
```

### 2. Get Specific Company Details
**Endpoint:** `GET /api/company/:id`
**Access:** Admin only

```bash
GET http://localhost:5000/api/company/COMPANY_ID
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 3. Create New Company
**Endpoint:** `POST /api/company`
**Access:** Admin only

```bash
POST http://localhost:5000/api/company
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "name": "New Tech Company",
  "domains": ["newtech.com", "newtech.org"],
  "description": "Innovative technology solutions",
  "contactEmail": "admin@newtech.com"
}
```

**Required Fields:**
- `name`: Company name (2-100 characters, unique)
- `domains`: Array of valid domains (at least 1)

**Optional Fields:**
- `description`: Company description (max 500 characters)
- `contactEmail`: Valid email address

### 4. Update Existing Company
**Endpoint:** `PUT /api/company/:id`
**Access:** Admin only

```bash
PUT http://localhost:5000/api/company/COMPANY_ID
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Updated Company Name",
  "domains": ["updated.com", "newdomain.com"],
  "description": "Updated description",
  "contactEmail": "new-contact@company.com",
  "isActive": true
}
```

### 5. Deactivate Company
**Endpoint:** `DELETE /api/company/:id`
**Access:** Admin only

```bash
DELETE http://localhost:5000/api/company/COMPANY_ID
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 6. Check Domain Availability
**Endpoint:** `GET /api/company/check-domain/:domain`
**Access:** Public

```bash
GET http://localhost:5000/api/company/check-domain/example.com
```

## Future Company Management Steps

### Adding a New Company

1. **Prepare Company Information**
   - Company name (must be unique)
   - List of domains they use for email
   - Optional: description and contact email

2. **Create the Company**
   ```bash
   POST /api/company
   Authorization: Bearer YOUR_ADMIN_TOKEN
   
   {
     "name": "Future Corp",
     "domains": ["futurecorp.com", "future.org"],
     "description": "Future technology company",
     "contactEmail": "admin@futurecorp.com"
   }
   ```

3. **Verify Creation**
   - Check the response for success
   - Test domain validation with the new domains
   - Verify users can now register with the new domains

4. **Test Registration**
   ```bash
   POST /api/auth/register
   
   {
     "firstName": "Test",
     "lastName": "User",
     "email": "test@futurecorp.com",
     "company": "Future Corp",
     "password": "Password123"
   }
   ```

### Deactivating a Company

1. **Get Company ID**
   ```bash
   GET /api/company
   ```
   Find the company you want to deactivate and note its ID.

2. **Deactivate the Company**
   ```bash
   DELETE /api/company/COMPANY_ID
   Authorization: Bearer YOUR_ADMIN_TOKEN
   ```

3. **Verify Deactivation**
   - Company should no longer appear in public company list
   - Users should not be able to register with the company's domains
   - Existing users from that company remain active

4. **Test Domain Restriction**
   ```bash
   POST /api/auth/register
   
   {
     "email": "newuser@deactivated-domain.com",
     "password": "Password123"
   }
   ```
   This should fail with a domain restriction error.

### Reactivating a Company

1. **Find the Deactivated Company**
   ```bash
   GET /api/company/COMPANY_ID
   Authorization: Bearer YOUR_ADMIN_TOKEN
   ```

2. **Reactivate by Updating**
   ```bash
   PUT /api/company/COMPANY_ID
   Authorization: Bearer YOUR_ADMIN_TOKEN
   
   {
     "isActive": true
   }
   ```

### Updating Company Domains

1. **Add New Domains**
   ```bash
   PUT /api/company/COMPANY_ID
   Authorization: Bearer YOUR_ADMIN_TOKEN
   
   {
     "domains": ["existing.com", "new-domain.com", "another-new.org"]
   }
   ```

2. **Remove Domains**
   ```bash
   PUT /api/company/COMPANY_ID
   Authorization: Bearer YOUR_ADMIN_TOKEN
   
   {
     "domains": ["remaining-domain.com"]
   }
   ```

## Important Notes

### Security Considerations
- Only admin users can manage companies
- Domain validation prevents conflicts between companies
- Soft deletes preserve data integrity
- All operations are logged and auditable

### Domain Validation Rules
- Domains must be valid format (e.g., example.com)
- No duplicate domains across companies
- Case-insensitive matching
- Supports subdomains (user@sub.example.com matches example.com)

### Best Practices
1. **Before Adding a Company:**
   - Verify the company is legitimate
   - Confirm domain ownership
   - Check for potential domain conflicts

2. **Before Deactivating:**
   - Notify existing users if possible
   - Consider the impact on active users
   - Document the reason for deactivation

3. **Regular Maintenance:**
   - Review company list periodically
   - Remove inactive/defunct companies
   - Update contact information as needed

## Troubleshooting

### Common Issues

1. **"Company with this name already exists"**
   - Company names must be unique (case-insensitive)
   - Check existing companies first

2. **"Domain already registered"**
   - Each domain can only belong to one company
   - Check which company currently owns the domain

3. **"Access denied. Admin privileges required"**
   - Ensure you're using a valid admin token
   - Check that the user has admin role

4. **"Invalid domain format"**
   - Domains must follow standard format (domain.tld)
   - No spaces, special characters, or invalid formats

### Validation Errors
The API provides detailed validation errors for:
- Invalid domain formats
- Missing required fields
- Field length violations
- Duplicate names/domains

## Testing Workflow

1. **Setup:**
   - Login as admin to get token
   - Set token in Postman environment

2. **Create Test Company:**
   - Use the "Create New Company" request
   - Verify success response

3. **Test Domain Validation:**
   - Try registering with new domain
   - Try registering with unauthorized domain

4. **Update and Deactivate:**
   - Update company details
   - Deactivate company
   - Verify domain restrictions work

5. **Cleanup:**
   - Remove test companies if needed
   - Reset to original state

This system provides complete flexibility for managing approved companies while maintaining security and data integrity.