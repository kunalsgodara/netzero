# Report Flow Fix Summary

## Issues Fixed

### 1. Missing Icon Import (FIXED ✓)
- **Problem**: `Eye` icon was used but not imported in `Reports.jsx`
- **Fix**: Added `Eye` to the lucide-react imports
- **File**: `frontend/src/pages/Reports.jsx`

### 2. Backend Dependencies (NEEDS FIXING)
- **Problem**: `reportlab` and other dependencies not installed
- **Solution**: Run the following commands in your backend terminal:

```bash
cd backend
source .venv/Scripts/activate  # Git Bash
pip install -r requirements.txt
```

## How to Start Both Services

### Backend (Terminal 1 - Git Bash):
```bash
cd backend
source .venv/Scripts/activate
uvicorn app.main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Frontend (Terminal 2 - Git Bash):
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Report Generation Flow

### Frontend → Backend Flow:

1. **User clicks "New Report"** → Opens create form
2. **User fills form and clicks "Generate Report"**
   - Calls: `POST /api/v1/reports/generate`
   - Payload:
     ```json
     {
       "title": "FY2025 SECR Report",
       "type": "secr",
       "period": "Jan 2025 – Dec 2025",
       "start_date": "2025-01-01",
       "end_date": "2025-12-31"
     }
     ```

3. **Backend processes request**:
   - Aggregates emission activities in date range
   - Aggregates CBAM imports in date range
   - Calculates totals
   - Stores aggregation data in `notes` field as JSON
   - Returns report with status "generated"

4. **Frontend displays report card** with:
   - Total emissions
   - Total CBAM charges
   - PDF download button (enabled for "generated" status)
   - Export buttons (CSV/XLSX)
   - Submit button

5. **User clicks "PDF" button**:
   - Calls: `GET /api/v1/reports/{report_id}/pdf`
   - Backend generates PDF using reportlab
   - Returns PDF as streaming response
   - Frontend triggers browser download

## Debugging Steps

### 1. Check Backend is Running
Open browser: http://localhost:8000/api/health

Expected response:
```json
{
  "status": "ok",
  "app": "NetZeroWorks"
}
```

### 2. Check Frontend Proxy
Open browser console (F12) → Network tab
Click "New Report" → Check for API calls to `/api/v1/reports/generate`

### 3. Check Database Connection
Backend should show on startup:
```
[startup] Database already seeded, skipping factor seeding.
```

Or if first run:
```
[startup] Seeded X DEFRA factors.
[startup] Seeded X CBAM factors.
```

### 4. Test Report Generation Manually

Using curl or Postman:
```bash
# Get auth token first (replace with your credentials)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Generate report (replace TOKEN with actual token)
curl -X POST http://localhost:8000/api/v1/reports/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Report",
    "type": "secr",
    "period": "Test Period",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'
```

## Common Issues & Solutions

### Issue: "No module named 'reportlab'"
**Solution**: Install dependencies
```bash
pip install -r requirements.txt
```

### Issue: "Connection refused" or "Network error"
**Solution**: 
1. Check backend is running on port 8000
2. Check frontend proxy in `vite.config.js` points to correct backend URL
3. Check CORS settings in `backend/app/main.py`

### Issue: "401 Unauthorized"
**Solution**: 
1. Check you're logged in (token in localStorage)
2. Check token hasn't expired
3. Try logging out and back in

### Issue: PDF generation fails
**Solution**:
1. Check reportlab is installed: `pip list | grep reportlab`
2. Check backend logs for errors
3. Verify report has aggregation data in `notes` field

### Issue: Report shows 0.0 emissions
**Solution**:
1. Check you have emission activities in the date range
2. Check emission activities have valid factors
3. Check organization is set up correctly

## Files Modified

1. `frontend/src/pages/Reports.jsx` - Added Eye icon import
2. `backend/requirements.txt` - Removed google-genai, loosened httpx version

## Next Steps

1. Install backend dependencies
2. Start backend server
3. Start frontend server
4. Test report generation
5. If issues persist, check browser console and backend logs
