# Postman Collection Setup

## Quick Start

1. **Import Collection**
   - Open Postman
   - Click "Import" 
   - Select `Company_Management_API.postman_collection.json`

2. **Set Environment Variables**
   - Create new environment in Postman
   - Add variables:
     - `base_url`: `http://localhost:5000`
     - `admin_token`: (will be auto-populated after login)
     - `company_id`: (will be auto-populated after creating company)

3. **Get Admin Access**
   - First create an admin user (see Company Management Guide)
   - Run "Admin Login" request
   - Token will be automatically saved

4. **Test Company Operations**
   - Run requests in order:
     1. Get All Companies
     2. Create New Company
     3. Update Company
     4. Test Registration
     5. Deactivate Company

## Collection Structure

### Authentication
- **Admin Login**: Get admin token for protected endpoints

### Company Management
- **Get All Companies**: View all active companies (public)
- **Get Company by ID**: Get specific company details (admin)
- **Create New Company**: Add new approved company (admin)
- **Update Company**: Modify company details (admin)
- **Deactivate Company**: Soft delete company (admin)
- **Check Domain Availability**: Verify if domain is approved (public)

### Test Registration
- **Register User with Approved Domain**: Test successful registration
- **Register User with Unapproved Domain**: Test domain restriction

### Validation Tests
- **Missing Required Fields**: Test validation errors
- **Invalid Domain Format**: Test domain format validation
- **Duplicate Name**: Test unique name constraint

## Expected Responses

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if any
}
```

## Testing Tips

1. **Run in Order**: Some requests depend on previous ones
2. **Check Auto-Variables**: Token and IDs are saved automatically
3. **Verify Responses**: Check success/error status in each response
4. **Test Edge Cases**: Try invalid data to test validation
5. **Clean Up**: Remove test companies after testing

## Common Test Scenarios

1. **Happy Path**: Create → Update → Test Registration → Deactivate
2. **Validation**: Test all validation rules with invalid data
3. **Security**: Test endpoints without admin token
4. **Domain Conflicts**: Try creating companies with duplicate domains
5. **Registration Flow**: Test user registration with various domains