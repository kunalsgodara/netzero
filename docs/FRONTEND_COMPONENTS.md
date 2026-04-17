# UK CBAM MVP - Frontend Component Documentation

## Overview

This document provides comprehensive documentation for the new frontend pages and components added in the UK CBAM MVP completion. All components are built with React, styled with Tailwind CSS, and use React Query for data fetching.

---

## Table of Contents

1. [Pages](#pages)
   - [UKCBAMCalculator](#ukcbamcalculator)
   - [UKCBAMProducts](#ukcbamproducts)
2. [Components](#components)
   - [CSVUploadModal](#csvuploadmodal)
   - [DeadlineWidget (Enhanced)](#deadlinewidget-enhanced)
3. [Installation Fields](#installation-fields)
4. [Usage Examples](#usage-examples)

---

## Pages

### UKCBAMCalculator

**Location:** `frontend/src/pages/UKCBAMCalculator.jsx`

**Purpose:** Provides a standalone calculator for estimating UK CBAM liability without creating import records. Useful for procurement managers evaluating supplier costs during negotiations.

#### Features

- **3-Step Wizard Interface:**
  1. Product Selection - Search and select from UK CBAM products
  2. Import Details - Enter quantity, value, country, and import type
  3. Emissions Data & Calculation - Configure data source and view live calculations

- **Real-time Calculation:** CBAM liability updates instantly as user enters data
- **Formula Breakdown:** Shows step-by-step calculation details
- **Savings Callout:** Highlights potential savings when using actual emissions data
- **Save as Import:** Option to convert calculation into a permanent import record
- **Calculate Another:** Quick reset to start a new calculation

#### Props

None - This is a standalone page component.

#### State Management

```javascript
const [step, setStep] = useState(1);  // Current wizard step (1-3)
const [searchTerm, setSearchTerm] = useState("");  // Product search query
const [form, setForm] = useState({
  product_id: "",
  import_date: "",
  import_value_gbp: "",
  quantity_tonnes: "",
  country_of_origin: "",
  import_type: "standard",
  data_source: "default",
  emissions_intensity_actual: "",
  carbon_price_deduction_gbp: "0",
});
```

#### Data Fetching

- **Products:** Fetches all UK CBAM products via `cbamApi.getProducts()`
- **ETS Price:** Fetches current UK ETS rate via `cbamApi.getCurrentETSPrice()`
- **Cache:** Products cached for 10 minutes, ETS price for 5 minutes

#### Calculation Logic

The calculator uses the same formula as import record creation:

```javascript
const calculation = useMemo(() => {
  const qty = parseFloat(form.quantity_tonnes) || 0;
  const intensity = form.data_source !== "default" 
    ? parseFloat(form.emissions_intensity_actual)
    : parseFloat(selectedProduct.default_intensity);
  const rate = parseFloat(etsPrice.price_gbp);
  const deduction = parseFloat(form.carbon_price_deduction_gbp) || 0;
  
  const embedded = qty * intensity;
  const net = Math.max(0, embedded - (deduction / rate));
  const liability = form.import_type === "returned_goods" ? 0 : net * rate;
  
  return { embedded, liability, saving: defaultLiability - liability };
}, [form, selectedProduct, etsPrice]);
```

#### Navigation

- **From:** Dashboard, ImportsListPage, Main Navigation
- **To:** CBAMManager (on save or cancel), UKCBAMProducts (via link)

#### Example Usage

```jsx
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate("/calculator")}>
      Quick Calculator
    </button>
  );
}
```

#### Validation

- **Step 1:** Requires product selection
- **Step 2:** Requires quantity, country, and import value
- **Step 3:** If data_source != "default", requires emissions_intensity_actual

#### Accessibility

- Keyboard navigation supported
- Form inputs have proper labels
- Error states clearly indicated
- Progress indicator shows current step

---

### UKCBAMProducts

**Location:** `frontend/src/pages/UKCBAMProducts.jsx`

**Purpose:** Reference page displaying all UK CBAM products with their default emission factors, CN codes, and regulatory details.

#### Features

- **Product Listing:** Displays all products from uk_cbam_products table
- **Search:** Filter by CN code, product name, or sector
- **Sector Filter:** Dropdown to filter by specific sector
- **Sortable Columns:** Click column headers to sort
- **Product Detail Modal:** Click row to view full product details
- **CSV Export:** Export filtered products to CSV file
- **Statistics Dashboard:** Shows total products, filtered results, sectors, and products with indirect emissions

#### Props

None - This is a standalone page component.

#### State Management

```javascript
const [searchTerm, setSearchTerm] = useState("");  // Search query
const [sectorFilter, setSectorFilter] = useState("");  // Selected sector
const [sortBy, setSortBy] = useState("commodity_code");  // Sort field
const [sortOrder, setSortOrder] = useState("asc");  // Sort direction
const [selectedProduct, setSelectedProduct] = useState(null);  // Modal product
```

#### Data Fetching

- **Products:** Fetches all products via `cbamApi.getProducts()`
- **Cache:** Products cached for 10 minutes
- **Client-side Filtering:** All filtering and sorting done in browser

#### Filtering & Sorting

```javascript
const filteredProducts = useMemo(() => {
  let filtered = products;
  
  // Search filter
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      p.commodity_code.includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q)
    );
  }
  
  // Sector filter
  if (sectorFilter) {
    filtered = filtered.filter(p => p.sector === sectorFilter);
  }
  
  // Sorting
  filtered = [...filtered].sort((a, b) => {
    const aVal = sortBy === "default_intensity" 
      ? parseFloat(a[sortBy]) 
      : a[sortBy];
    const bVal = sortBy === "default_intensity" 
      ? parseFloat(b[sortBy]) 
      : b[sortBy];
    return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });
  
  return filtered;
}, [products, searchTerm, sectorFilter, sortBy, sortOrder]);
```

#### CSV Export

```javascript
const handleExportCSV = () => {
  const headers = ["CN Code", "Description", "Sector", ...];
  const rows = filteredProducts.map(p => [
    p.commodity_code,
    p.description,
    p.sector,
    ...
  ]);
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
  ].join("\n");
  
  // Trigger download
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `uk-cbam-products-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
};
```

#### Product Detail Modal

Displays when user clicks a product row:

- Full product description
- Sector and product type
- Default emission intensity (large display)
- Includes indirect emissions (Yes/No)
- Valid from date
- Notes (if available)
- Regulatory information

#### Navigation

- **From:** Main Navigation, AddImportPage, Calculator
- **To:** None (reference page)

#### Example Usage

```jsx
import { useNavigate } from "react-router-dom";

function AddImportPage() {
  const navigate = useNavigate();
  
  return (
    <div>
      <p>Need help finding a product?</p>
      <button onClick={() => navigate("/products")}>
        View Products Reference
      </button>
    </div>
  );
}
```

#### Accessibility

- Table rows are keyboard navigable
- Sort indicators visible
- Modal can be closed with Escape key
- Search input has proper label

---

## Components

### CSVUploadModal

**Location:** `frontend/src/components/cbam/CSVUploadModal.jsx`

**Purpose:** Modal component for bulk CSV import of import records. Provides file upload, preview, validation, and error reporting.

#### Props

```typescript
interface CSVUploadModalProps {
  isOpen: boolean;           // Controls modal visibility
  onClose: () => void;       // Callback when modal closes
  onUploadSuccess?: () => void;  // Callback after successful upload
}
```

#### Features

- **Drag & Drop:** File dropzone with react-dropzone
- **Template Download:** Link to download CSV template
- **File Validation:** Checks file size (10MB limit) and format
- **Preview Table:** Shows first 10 rows of CSV data
- **Upload Progress:** Loading indicator during upload
- **Error Display:** Shows row-level errors with details
- **Success Feedback:** Confirmation message with import counts

#### State Management

```javascript
const [file, setFile] = useState(null);  // Selected CSV file
const [preview, setPreview] = useState([]);  // Parsed preview data
const [isUploading, setIsUploading] = useState(false);  // Upload state
const [uploadResult, setUploadResult] = useState(null);  // API response
const [errors, setErrors] = useState([]);  // Validation errors
```

#### File Upload Flow

1. **File Selection:** User drags/drops or clicks to select CSV file
2. **Validation:** Check file size and format
3. **Preview:** Parse first 10 rows with PapaParse
4. **Upload:** Send to `POST /api/imports/bulk-csv`
5. **Result:** Display success count and errors
6. **Auto-close:** If no errors, close modal after 2 seconds

#### CSV Parsing

```javascript
Papa.parse(csvFile, {
  header: true,
  preview: 10,
  complete: (results) => {
    setPreview(results.data);
  },
  error: (error) => {
    setErrors([{ message: `CSV parsing error: ${error.message}` }]);
  },
});
```

#### Upload Implementation

```javascript
const handleUpload = async () => {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = localStorage.getItem("access_token");
  const response = await fetch("/api/imports/bulk-csv", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  
  const result = await response.json();
  setUploadResult(result);
  
  if (result.error_count === 0) {
    setTimeout(() => {
      onUploadSuccess?.();
      handleClose();
    }, 2000);
  } else {
    setErrors(result.errors || []);
  }
};
```

#### Error Display

Errors are displayed with:
- Row number (if applicable)
- Field name (if applicable)
- Error message

```jsx
{errors.map((err, idx) => (
  <div key={idx} className="error-item">
    {err.row && <span>Row {err.row}:</span>}
    {err.field && <span>{err.field} -</span>}
    <span>{err.message}</span>
  </div>
))}
```

#### Example Usage

```jsx
import CSVUploadModal from "@/components/cbam/CSVUploadModal";
import { useState } from "react";

function ImportsListPage() {
  const [showCSVModal, setShowCSVModal] = useState(false);
  const queryClient = useQueryClient();
  
  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["cbam-imports"] });
    toast.success("Imports uploaded successfully");
  };
  
  return (
    <>
      <button onClick={() => setShowCSVModal(true)}>
        Bulk Import CSV
      </button>
      
      <CSVUploadModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
```

#### Validation Rules

- **File Size:** Maximum 10MB
- **File Format:** Must be .csv
- **Row Count:** Maximum 1000 rows (enforced by API)
- **Required Columns:** import_date, product_code, quantity_tonnes, import_value_gbp, country_of_origin

#### Accessibility

- Modal can be closed with X button or Cancel button
- File input is keyboard accessible
- Error messages are clearly labeled
- Upload button disabled when no file selected

---

### DeadlineWidget (Enhanced)

**Location:** `frontend/src/components/cbam/DeadlineWidget.jsx`

**Purpose:** Dashboard widget displaying upcoming compliance deadlines with color-coded urgency indicators.

#### Props

```typescript
interface DeadlineWidgetProps {
  deadlines?: Deadline[];  // Optional: pass deadlines directly
  onViewAll?: () => void;  // Callback for "View All" link
}
```

#### Features

- **Next 3 Deadlines:** Shows upcoming deadlines ordered by due date
- **Color Coding:**
  - 🟢 Green: More than 30 days away
  - 🟡 Amber: 7-30 days away
  - 🔴 Red: Less than 7 days or overdue
- **Days Remaining:** Calculates and displays days until deadline
- **Deadline Type:** Shows readable deadline name
- **View All Link:** Navigate to full deadlines page

#### Data Fetching

```javascript
const { data: deadlines } = useQuery({
  queryKey: ["deadlines-next"],
  queryFn: () => cbamApi.getNextDeadlines(3),
  staleTime: 60 * 1000,  // 1 minute cache
  refetchInterval: 5 * 60 * 1000,  // Refetch every 5 minutes
});
```

#### Color Coding Logic

```javascript
const getUrgencyColor = (daysUntil) => {
  if (daysUntil < 0) return "red";      // Overdue
  if (daysUntil <= 7) return "red";     // Critical
  if (daysUntil <= 30) return "amber";  // At risk
  return "green";                        // Upcoming
};
```

#### Deadline Display

```jsx
{deadlines.map(d => (
  <div 
    key={d.id} 
    className={`border-l-4 border-${getUrgencyColor(d.days_remaining)}-500`}
  >
    <p className="font-medium">{formatDeadlineType(d.deadline_type)}</p>
    <p className="text-sm text-muted-foreground">
      {formatDate(d.due_date)} ({d.days_remaining} days)
    </p>
  </div>
))}
```

#### Example Usage

```jsx
import DeadlineWidget from "@/components/cbam/DeadlineWidget";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="dashboard-grid">
      <DeadlineWidget 
        onViewAll={() => navigate("/deadlines")}
      />
    </div>
  );
}
```

#### Deadline Type Formatting

```javascript
const formatDeadlineType = (type) => {
  const formats = {
    "uk_cbam_registration": "UK CBAM Registration",
    "uk_cbam_q1_2027": "Q1 2027 Declaration",
    "uk_cbam_q2_2027": "Q2 2027 Declaration",
    // ... etc
  };
  return formats[type] || type;
};
```

#### Empty State

When no deadlines are available:

```jsx
<div className="text-center p-6">
  <p className="text-muted-foreground">No upcoming deadlines</p>
</div>
```

#### Accessibility

- Color coding supplemented with text (days remaining)
- Keyboard navigable links
- Clear visual hierarchy

---

## Installation Fields

### Enhanced Import Forms

Installation fields have been added to import creation and editing forms.

#### New Fields

```typescript
interface InstallationFields {
  installation_name?: string;      // Max 255 chars
  installation_id?: string;        // Alphanumeric, max 100 chars
  production_route?: ProductionRoute;  // Enum
}

type ProductionRoute = 
  | "BF-BOF" 
  | "EAF-scrap" 
  | "DRI" 
  | "Smelting-electrolysis" 
  | "Other";
```

#### Form Implementation

**AddImportPage.jsx - Step 2 Enhancement:**

```jsx
<div className="space-y-4">
  <h3 className="text-sm font-medium text-muted-foreground">
    Installation Details (Optional)
  </h3>
  
  <div>
    <label className="text-xs font-medium text-muted-foreground">
      Installation Name
    </label>
    <input
      type="text"
      maxLength={255}
      value={form.installation_name || ""}
      onChange={(e) => update("installation_name", e.target.value)}
      placeholder="e.g. Sheffield Steel Works"
      className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border"
    />
  </div>
  
  <div>
    <label className="text-xs font-medium text-muted-foreground">
      Installation ID
    </label>
    <input
      type="text"
      maxLength={100}
      pattern="[A-Za-z0-9]+"
      value={form.installation_id || ""}
      onChange={(e) => update("installation_id", e.target.value)}
      placeholder="e.g. UK12345"
      className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border"
    />
    <p className="text-xs text-muted-foreground mt-1">
      Alphanumeric characters only
    </p>
  </div>
  
  <div>
    <label className="text-xs font-medium text-muted-foreground">
      Production Route
    </label>
    <select
      value={form.production_route || ""}
      onChange={(e) => update("production_route", e.target.value)}
      className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border"
    >
      <option value="">Select production route...</option>
      <option value="BF-BOF">BF-BOF (Blast Furnace - Basic Oxygen Furnace)</option>
      <option value="EAF-scrap">EAF-scrap (Electric Arc Furnace)</option>
      <option value="DRI">DRI (Direct Reduced Iron)</option>
      <option value="Smelting-electrolysis">Smelting-electrolysis</option>
      <option value="Other">Other</option>
    </select>
  </div>
</div>
```

#### Display in Import Detail

**ImportDetailPage.jsx Enhancement:**

```jsx
{import.installation_name && (
  <div className="bg-card border border-border rounded-xl p-4">
    <h3 className="text-sm font-medium text-muted-foreground mb-3">
      Installation Details
    </h3>
    <div className="space-y-2">
      <div>
        <p className="text-xs text-muted-foreground">Installation Name</p>
        <p className="text-sm text-foreground">{import.installation_name}</p>
      </div>
      {import.installation_id && (
        <div>
          <p className="text-xs text-muted-foreground">Installation ID</p>
          <p className="text-sm font-mono text-foreground">
            {import.installation_id}
          </p>
        </div>
      )}
      {import.production_route && (
        <div>
          <p className="text-xs text-muted-foreground">Production Route</p>
          <p className="text-sm text-foreground">{import.production_route}</p>
        </div>
      )}
    </div>
  </div>
)}
```

#### Validation

```javascript
const validateInstallationFields = (form) => {
  const errors = {};
  
  // Installation name length
  if (form.installation_name && form.installation_name.length > 255) {
    errors.installation_name = "Maximum 255 characters";
  }
  
  // Installation ID format
  if (form.installation_id) {
    if (form.installation_id.length > 100) {
      errors.installation_id = "Maximum 100 characters";
    }
    if (!/^[A-Za-z0-9]+$/.test(form.installation_id)) {
      errors.installation_id = "Alphanumeric characters only";
    }
  }
  
  // Production route enum
  const validRoutes = ["BF-BOF", "EAF-scrap", "DRI", "Smelting-electrolysis", "Other"];
  if (form.production_route && !validRoutes.includes(form.production_route)) {
    errors.production_route = "Invalid production route";
  }
  
  return errors;
};
```

---

## Usage Examples

### Complete Import Flow with CSV Upload

```jsx
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CSVUploadModal from "@/components/cbam/CSVUploadModal";
import { toast } from "sonner";

function ImportsListPage() {
  const [showCSVModal, setShowCSVModal] = useState(false);
  const queryClient = useQueryClient();
  
  const handleUploadSuccess = () => {
    // Refresh imports list
    queryClient.invalidateQueries({ queryKey: ["cbam-imports"] });
    
    // Show success message
    toast.success("Imports uploaded successfully");
    
    // Close modal
    setShowCSVModal(false);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1>Imports</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCSVModal(true)}>
            Bulk Import CSV
          </button>
          <button onClick={() => navigate("/imports/new")}>
            Add Import
          </button>
        </div>
      </div>
      
      {/* Imports table */}
      
      <CSVUploadModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
```

### Calculator to Import Conversion

```jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cbamApi } from "@/services/cbamApiService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function UKCBAMCalculator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const saveAsImportMutation = useMutation({
    mutationFn: (formData) => cbamApi.createImport(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbam-imports"] });
      toast.success("Import record created successfully");
      navigate("/CBAMManager");
    },
    onError: (error) => {
      toast.error(`Failed to create import: ${error.message}`);
    },
  });
  
  const handleSaveAsImport = () => {
    const payload = {
      product_id: form.product_id,
      import_date: form.import_date,
      quantity_tonnes: parseFloat(form.quantity_tonnes),
      import_value_gbp: parseFloat(form.import_value_gbp),
      country_of_origin: form.country_of_origin,
      import_type: form.import_type,
      data_source: form.data_source,
      emissions_intensity_actual: form.data_source !== "default" 
        ? parseFloat(form.emissions_intensity_actual) 
        : null,
      carbon_price_deduction_gbp: parseFloat(form.carbon_price_deduction_gbp) || 0,
    };
    
    saveAsImportMutation.mutate(payload);
  };
  
  return (
    <div>
      {/* Calculator UI */}
      
      <button 
        onClick={handleSaveAsImport}
        disabled={saveAsImportMutation.isPending}
      >
        {saveAsImportMutation.isPending ? "Saving..." : "Save as Import"}
      </button>
    </div>
  );
}
```

### Dashboard with Deadline Widget

```jsx
import DeadlineWidget from "@/components/cbam/DeadlineWidget";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="dashboard-grid">
      {/* Other dashboard widgets */}
      
      <DeadlineWidget 
        onViewAll={() => navigate("/deadlines")}
      />
      
      {/* Quick actions */}
      <div className="quick-actions">
        <button onClick={() => navigate("/calculator")}>
          Quick Calculator
        </button>
        <button onClick={() => navigate("/products")}>
          Products Reference
        </button>
      </div>
    </div>
  );
}
```

---

## Styling Guidelines

All components follow the established design system:

### Colors

- **Primary:** Emerald (emerald-500, emerald-400)
- **Background:** bg-background, bg-card
- **Border:** border-border
- **Text:** text-foreground, text-muted-foreground
- **Success:** emerald-500
- **Warning:** amber-500
- **Error:** red-500

### Typography

- **Headings:** font-bold, text-xl/2xl
- **Body:** text-sm, text-foreground
- **Labels:** text-xs, text-muted-foreground, uppercase, tracking-wider
- **Monospace:** font-mono (for codes, numbers)

### Spacing

- **Padding:** p-4, p-6 (cards and containers)
- **Gap:** gap-2, gap-4 (flex/grid spacing)
- **Margin:** mt-1, mt-2, mt-4 (vertical spacing)

### Borders

- **Radius:** rounded-lg, rounded-xl (cards and inputs)
- **Width:** border (1px), border-2 (emphasis)
- **Color:** border-border (default), border-emerald-500 (active)

---

## Testing

### Component Testing

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import CSVUploadModal from "@/components/cbam/CSVUploadModal";

test("renders CSV upload modal", () => {
  render(
    <CSVUploadModal 
      isOpen={true} 
      onClose={() => {}} 
    />
  );
  
  expect(screen.getByText("Bulk Import CSV")).toBeInTheDocument();
  expect(screen.getByText("Download Template")).toBeInTheDocument();
});

test("validates file size", async () => {
  const { getByText } = render(
    <CSVUploadModal isOpen={true} onClose={() => {}} />
  );
  
  // Create large file (>10MB)
  const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.csv");
  
  // Simulate file drop
  // ... test implementation
  
  expect(getByText(/File size exceeds 10MB/)).toBeInTheDocument();
});
```

### Integration Testing

```javascript
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UKCBAMCalculator from "@/pages/UKCBAMCalculator";

test("calculator performs real-time calculation", async () => {
  const queryClient = new QueryClient();
  
  render(
    <QueryClientProvider client={queryClient}>
      <UKCBAMCalculator />
    </QueryClientProvider>
  );
  
  // Select product
  // Enter quantity
  // Verify calculation updates
  
  await waitFor(() => {
    expect(screen.getByText(/CBAM Liability/)).toBeInTheDocument();
  });
});
```

---

## Performance Considerations

### Data Fetching

- **React Query Caching:** Products cached for 10 minutes, ETS price for 5 minutes
- **Stale-While-Revalidate:** Users see cached data while fresh data loads
- **Refetch on Focus:** Deadlines refetch when user returns to tab

### Client-Side Filtering

- **Memoization:** Use `useMemo` for expensive filtering/sorting operations
- **Debouncing:** Search inputs debounced to reduce re-renders
- **Virtual Scrolling:** Consider for large product lists (>1000 items)

### Bundle Size

- **Code Splitting:** Pages lazy-loaded with React.lazy()
- **Tree Shaking:** Import only needed components from libraries
- **Dependencies:** PapaParse and react-dropzone add ~50KB gzipped

---

## Browser Support

- **Modern Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Features Used:**
  - CSS Grid and Flexbox
  - ES6+ JavaScript
  - Fetch API
  - File API
  - Blob API

---

## Accessibility (A11y)

### Keyboard Navigation

- All interactive elements keyboard accessible
- Tab order follows visual flow
- Focus indicators visible

### Screen Readers

- Semantic HTML elements used
- ARIA labels where needed
- Form inputs properly labeled

### Color Contrast

- Text meets WCAG AA standards
- Color not sole indicator (supplemented with text/icons)

---

## Support

For component issues or questions:
- Check prop types and required props
- Review example usage
- Verify data fetching setup
- Contact development team

---

**Last Updated:** January 2025  
**Component Library Version:** 1.0.0
