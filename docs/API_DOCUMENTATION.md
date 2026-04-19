# UK CBAM MVP - API Documentation

## Overview

This document provides comprehensive API documentation for the UK CBAM MVP completion features. All endpoints require JWT Bearer token authentication unless otherwise specified.

**Base URL:** `http://localhost:8000`

**Authentication:** Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents

1. [CSV Import Endpoints](#csv-import-endpoints)
2. [Excel Export Endpoint](#excel-export-endpoint)
3. [Compliance Deadlines Endpoints](#compliance-deadlines-endpoints)
4. [Installation Fields (Enhanced Imports)](#installation-fields-enhanced-imports)

---

## CSV Import Endpoints

### 1. Bulk CSV Import

Upload a CSV file to create multiple import records in batch.

**Endpoint:** `POST /api/imports/bulk-csv`

**Authentication:** Required

**Rate Limit:** 10 uploads per hour per user

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body Parameter:**
  - `file` (required): CSV file upload

**File Requirements:**
- Max size: 10MB
- Max rows: 1000
- Format: CSV with UTF-8 encoding
- Required columns:
  - `import_date` (YYYY-MM-DD format)
  - `product_code` (8-digit CN code)
  - `quantity_tonnes` (positive number)
  - `import_value_gbp` (positive number)
  - `country_of_origin` (string)
- Optional columns:
  - `supplier_name` (string)
  - `import_type` (standard | preferential)
  - `data_source` (default | actual_unverified | actual_verified)
  - `emissions_intensity_actual` (number, required if data_source != default)
  - `carbon_price_deduction_gbp` (number)
  - `installation_name` (string, max 255 chars)
  - `installation_id` (alphanumeric, max 100 chars)
  - `production_route` (BF-BOF | EAF-scrap | DRI | Smelting-electrolysis | Other)

**Response:** `200 OK`

```json
{
  "success_count": 45,
  "error_count": 5,
  "errors": [
    {
      "row": 3,
      "field": "product_code",
      "message": "Product not found: 99999999"
    },
    {
      "row": 7,
      "field": "emissions_intensity_actual",
      "message": "Required when data_source is not default"
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file format or too many rows
  ```json
  {
    "detail": "File must be CSV format"
  }
  ```

- `413 Payload Too Large` - File exceeds 10MB
  ```json
  {
    "detail": "File too large (max 10MB)"
  }
  ```

- `403 Forbidden` - User not associated with organisation
  ```json
  {
    "detail": "Organisation required"
  }
  ```

**Example Request (cURL):**

```bash
curl -X POST "http://localhost:8000/api/imports/bulk-csv" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@imports.csv"
```

**Example Request (JavaScript):**

```javascript
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch('/api/imports/bulk-csv', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(`Imported ${result.success_count} records`);
console.log(`Failed ${result.error_count} records`);
```

---

### 2. Download CSV Template

Download a CSV template file with correct headers and example data.

**Endpoint:** `GET /api/imports/csv-template`

**Authentication:** Not required

**Response:** `200 OK`
- **Content-Type:** `text/csv`
- **Content-Disposition:** `attachment; filename=uk_cbam_import_template.csv`

**Example Request (cURL):**

```bash
curl -X GET "http://localhost:8000/api/imports/csv-template" \
  -o template.csv
```

**Example Request (JavaScript):**

```javascript
const response = await fetch('/api/imports/csv-template');
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'uk_cbam_import_template.csv';
a.click();
```

---

## Excel Export Endpoint

### Export Imports to Excel

Generate an Excel file with import data, formula breakdowns, and summary statistics.

**Endpoint:** `GET /api/imports/export-excel`

**Authentication:** Required

**Query Parameters:**
- `year` (optional): Filter by import year (e.g., 2027)
- `sector` (optional): Filter by product sector (steel, aluminium, cement, fertiliser, hydrogen)

**Response:** `200 OK`
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition:** `attachment; filename=uk_cbam_imports_[year]_[sector].xlsx`

**Excel File Structure:**

The generated Excel file contains 3 sheets:

1. **Imports Summary**
   - Columns: Import Date, Product, CN Code, Sector, Quantity (t), Country, Supplier, Intensity Used (tCO₂e/t), Embedded Emissions (tCO₂e), UK ETS Rate (£/tCO₂e), CBAM Liability (£), Default Liability (£), Savings (£), Data Source, Import Type
   - All import records matching filters

2. **Formula Breakdown**
   - Detailed calculation steps for each import
   - Shows how CBAM liability was calculated

3. **Summary**
   - Total imports count
   - Total CBAM liability
   - Total potential savings
   - Total embedded emissions
   - Average liability per import
   - Breakdown by sector

**Error Responses:**

- `404 Not Found` - No imports found matching filters
  ```json
  {
    "detail": "No imports found"
  }
  ```

- `403 Forbidden` - User not associated with organisation
  ```json
  {
    "detail": "Organisation required"
  }
  ```

**Example Request (cURL):**

```bash
curl -X GET "http://localhost:8000/api/imports/export-excel?year=2027&sector=steel" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o imports_2027_steel.xlsx
```

**Example Request (JavaScript):**

```javascript
const params = new URLSearchParams({ year: 2027, sector: 'steel' });
const response = await fetch(`/api/imports/export-excel?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'uk_cbam_imports_2027_steel.xlsx';
a.click();
```

---

## Compliance Deadlines Endpoints

### 1. List All Deadlines

Get all compliance deadlines for the user's organisation.

**Endpoint:** `GET /api/deadlines`

**Authentication:** Required

**Rate Limit:** 100 requests per minute

**Query Parameters:**
- `include_completed` (optional, boolean): Include completed deadlines (default: false)

**Response:** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "123e4567-e89b-12d3-a456-426614174000",
    "deadline_type": "uk_cbam_registration",
    "due_date": "2026-12-31",
    "status": "upcoming",
    "completed_at": null,
    "notes": "Register with HMRC for UK CBAM",
    "created_at": "2024-01-15T10:30:00Z",
    "days_remaining": 245
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "org_id": "123e4567-e89b-12d3-a456-426614174000",
    "deadline_type": "uk_cbam_q1_2027",
    "due_date": "2027-04-30",
    "status": "at_risk",
    "completed_at": null,
    "notes": "Q1 2027 Declaration",
    "created_at": "2024-01-15T10:30:00Z",
    "days_remaining": 25
  }
]
```

**Status Values:**
- `upcoming` - More than 30 days until due date
- `at_risk` - 7-30 days until due date
- `overdue` - Past due date and not completed
- `complete` - Marked as completed

**Error Responses:**

- `403 Forbidden` - User not associated with organisation
  ```json
  {
    "detail": "User must belong to an organisation"
  }
  ```

**Example Request (cURL):**

```bash
curl -X GET "http://localhost:8000/api/deadlines?include_completed=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Get Next N Deadlines

Get the next N upcoming deadlines (default: 3, max: 10).

**Endpoint:** `GET /api/deadlines/next`

**Authentication:** Required

**Query Parameters:**
- `n` (optional, integer): Number of deadlines to return (default: 3, max: 10)

**Response:** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "123e4567-e89b-12d3-a456-426614174000",
    "deadline_type": "uk_cbam_q1_2027",
    "due_date": "2027-04-30",
    "status": "at_risk",
    "completed_at": null,
    "notes": "Q1 2027 Declaration",
    "created_at": "2024-01-15T10:30:00Z",
    "days_remaining": 25
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "org_id": "123e4567-e89b-12d3-a456-426614174000",
    "deadline_type": "uk_cbam_q2_2027",
    "due_date": "2027-07-31",
    "status": "upcoming",
    "completed_at": null,
    "notes": "Q2 2027 Declaration",
    "created_at": "2024-01-15T10:30:00Z",
    "days_remaining": 117
  }
]
```

**Example Request (cURL):**

```bash
curl -X GET "http://localhost:8000/api/deadlines/next?n=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Mark Deadline Complete

Mark a compliance deadline as complete.

**Endpoint:** `PUT /api/deadlines/{deadline_id}/complete`

**Authentication:** Required

**Path Parameters:**
- `deadline_id` (required, UUID): ID of the deadline to mark complete

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "deadline_type": "uk_cbam_q1_2027",
  "due_date": "2027-04-30",
  "status": "complete",
  "completed_at": "2027-04-28T14:30:00Z",
  "notes": "Q1 2027 Declaration",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

- `404 Not Found` - Deadline not found or access denied
  ```json
  {
    "detail": "Deadline not found or access denied"
  }
  ```

- `403 Forbidden` - User not associated with organisation
  ```json
  {
    "detail": "User must belong to an organisation"
  }
  ```

**Example Request (cURL):**

```bash
curl -X PUT "http://localhost:8000/api/deadlines/550e8400-e29b-41d4-a716-446655440000/complete" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request (JavaScript):**

```javascript
const response = await fetch(`/api/deadlines/${deadlineId}/complete`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const updatedDeadline = await response.json();
```

---

### 4. Get Deadline by ID

Get a specific deadline by its ID.

**Endpoint:** `GET /api/deadlines/{deadline_id}`

**Authentication:** Required

**Path Parameters:**
- `deadline_id` (required, UUID): ID of the deadline

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "deadline_type": "uk_cbam_registration",
  "due_date": "2026-12-31",
  "status": "upcoming",
  "completed_at": null,
  "notes": "Register with HMRC for UK CBAM",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

- `404 Not Found` - Deadline not found or access denied
  ```json
  {
    "detail": "Deadline not found or access denied"
  }
  ```

---

## Installation Fields (Enhanced Imports)

The existing import endpoints have been enhanced to support installation-level data capture.

### Enhanced Fields in Import Endpoints

The following endpoints now accept installation fields:

- `POST /api/imports` - Create import
- `PUT /api/imports/{import_id}` - Update import

**New Optional Fields:**

```json
{
  "installation_name": "Sheffield Steel Works",
  "installation_id": "UK12345",
  "production_route": "BF-BOF"
}
```

**Field Specifications:**

- `installation_name` (optional, string)
  - Max length: 255 characters
  - Description: Name of the production facility

- `installation_id` (optional, string)
  - Max length: 100 characters
  - Pattern: Alphanumeric only
  - Description: Unique identifier for the installation

- `production_route` (optional, enum)
  - Allowed values: `BF-BOF`, `EAF-scrap`, `DRI`, `Smelting-electrolysis`, `Other`
  - Description: Production method used at the installation

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/imports" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "123e4567-e89b-12d3-a456-426614174000",
    "import_date": "2027-01-15",
    "quantity_tonnes": 50.5,
    "import_value_gbp": 12500,
    "country_of_origin": "China",
    "import_type": "standard",
    "data_source": "default",
    "installation_name": "Shanghai Steel Plant",
    "installation_id": "CN98765",
    "production_route": "BF-BOF"
  }'
```

**Response includes installation fields:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "import_date": "2027-01-15",
  "quantity_tonnes": 50.5,
  "import_value_gbp": 12500,
  "country_of_origin": "China",
  "installation_name": "Shanghai Steel Plant",
  "installation_id": "CN98765",
  "production_route": "BF-BOF",
  "cbam_liability_gbp": 1234.56,
  "created_at": "2027-01-15T10:30:00Z"
}
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized** - Missing or invalid JWT token
```json
{
  "detail": "Not authenticated"
}
```

**403 Forbidden** - User lacks permission
```json
{
  "detail": "Organisation required"
}
```

**422 Validation Error** - Invalid request data
```json
{
  "detail": [
    {
      "loc": ["body", "quantity_tonnes"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

**500 Internal Server Error** - Server error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

The following endpoints have rate limits:

- `POST /api/imports/bulk-csv`: 10 uploads per hour per user
- `GET /api/deadlines/*`: 100 requests per minute per user

When rate limit is exceeded, the API returns:

**429 Too Many Requests**
```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

---

## Security Considerations

### Formula Injection Prevention

All CSV and Excel operations automatically sanitize cell values to prevent formula injection attacks. Values starting with `=`, `+`, `-`, or `@` are prefixed with a single quote.

### Cross-Organization Access Prevention

All endpoints enforce organization-level access control. Users can only access data belonging to their organization.

### SQL Injection Prevention

All database queries use parameterized queries via SQLAlchemy ORM to prevent SQL injection attacks.

---

## Testing the API

### Using Swagger UI

Interactive API documentation is available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Authentication for Testing

1. Register or login to get JWT token
2. Click "Authorize" button in Swagger UI
3. Enter: `Bearer YOUR_JWT_TOKEN`
4. Test endpoints interactively

---

## Support

For issues or questions:
- Check error messages for specific guidance
- Review validation requirements
- Contact development team for assistance

---

**Last Updated:** January 2025  
**API Version:** 1.0.0
