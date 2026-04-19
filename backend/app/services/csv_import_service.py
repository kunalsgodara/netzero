"""
CSV Import Service
Handles bulk CSV import of CBAM imports with validation and error tracking.
"""
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import List, Dict, Optional, Tuple
from uuid import UUID
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.models.uk_cbam import Import, UKCBAMProduct, Supplier
from app.models.user import User
from app.services.calculator import calculate_cbam_liability
from app.services.ets_price_service import get_current_ets_price


class BulkImportError(BaseModel):
    """Error details for a failed CSV row."""
    row: int
    field: str
    message: str


class BulkImportResult(BaseModel):
    """Result of bulk CSV import operation."""
    success_count: int
    error_count: int
    errors: List[BulkImportError]


def sanitize_csv_value(value: str) -> str:
    """
    Prevent CSV injection attacks by prefixing dangerous characters.
    
    Args:
        value: Cell value from CSV
    
    Returns:
        Sanitized value with single quote prefix if needed
    
    Formula injection prevention: If value starts with =, +, -, or @,
    prefix with single quote to prevent formula execution.
    """
    if value and isinstance(value, str) and len(value) > 0:
        if value[0] in ('=', '+', '-', '@'):
            return "'" + value
    return value


async def find_or_create_supplier(
    supplier_name: str,
    org_id: UUID,
    db: AsyncSession
) -> Supplier:
    """
    Find existing supplier by name or create new one.
    
    Args:
        supplier_name: Supplier name from CSV
        org_id: Organisation UUID
        db: Database session
    
    Returns:
        Supplier object (existing or newly created)
    """
    # Try to find existing supplier
    result = await db.execute(
        select(Supplier).where(
            Supplier.org_id == org_id,
            Supplier.name == supplier_name
        )
    )
    supplier = result.scalar_one_or_none()
    
    if supplier:
        return supplier
    
    # Create new supplier
    supplier = Supplier(
        org_id=org_id,
        name=supplier_name
    )
    db.add(supplier)
    await db.flush()  # Get ID without committing
    
    return supplier


async def validate_and_create_import(
    row: pd.Series,
    row_index: int,
    org_id: UUID,
    user_id: UUID,
    products_cache: Dict[str, UKCBAMProduct],
    uk_ets_rate: Decimal,
    db: AsyncSession
) -> Tuple[Optional[Import], Optional[BulkImportError]]:
    """
    Validate a CSV row and create Import record if valid.
    
    Args:
        row: Pandas Series representing CSV row
        row_index: Row number (for error reporting)
        org_id: Organisation UUID
        user_id: User UUID
        products_cache: Dict mapping commodity_code to UKCBAMProduct
        uk_ets_rate: Current UK ETS rate
        db: Database session
    
    Returns:
        Tuple of (Import object or None, BulkImportError or None)
    """
    try:
        # Validate required fields
        required_fields = ['import_date', 'product_code', 'quantity_tonnes', 
                          'import_value_gbp', 'country_of_origin']
        for field in required_fields:
            if field not in row or pd.isna(row[field]):
                return None, BulkImportError(
                    row=row_index,
                    field=field,
                    message=f"Missing required field: {field}"
                )
        
        # Sanitize string values
        country_of_origin = sanitize_csv_value(str(row['country_of_origin']))
        
        # Lookup product
        product_code = str(row['product_code']).strip()
        product = products_cache.get(product_code)
        if not product:
            return None, BulkImportError(
                row=row_index,
                field='product_code',
                message=f"Product not found: {product_code}"
            )
        
        # Parse date
        try:
            if isinstance(row['import_date'], str):
                import_date = datetime.strptime(row['import_date'], '%Y-%m-%d').date()
            else:
                import_date = pd.to_datetime(row['import_date']).date()
        except Exception as e:
            return None, BulkImportError(
                row=row_index,
                field='import_date',
                message=f"Invalid date format (use YYYY-MM-DD): {str(e)}"
            )
        
        # Parse numeric fields
        try:
            quantity_tonnes = Decimal(str(row['quantity_tonnes']))
            import_value_gbp = Decimal(str(row['import_value_gbp']))
        except Exception as e:
            return None, BulkImportError(
                row=row_index,
                field='quantity_tonnes/import_value_gbp',
                message=f"Invalid numeric value: {str(e)}"
            )
        
        # Validate non-negative
        if quantity_tonnes < 0 or import_value_gbp < 0:
            return None, BulkImportError(
                row=row_index,
                field='quantity_tonnes/import_value_gbp',
                message="Quantity and value must be non-negative"
            )
        
        # Parse optional fields
        data_source = str(row.get('data_source', 'default')).strip()
        import_type = str(row.get('import_type', 'standard')).strip()
        
        emissions_intensity_actual = None
        if 'emissions_intensity_actual' in row and not pd.isna(row['emissions_intensity_actual']):
            try:
                emissions_intensity_actual = Decimal(str(row['emissions_intensity_actual']))
            except (ValueError, ArithmeticError):
                pass
        
        # Validate data_source and emissions_intensity_actual consistency
        if data_source != 'default' and emissions_intensity_actual is None:
            return None, BulkImportError(
                row=row_index,
                field='emissions_intensity_actual',
                message=f"emissions_intensity_actual required when data_source is '{data_source}'"
            )
        
        # Find or create supplier
        supplier = None
        if 'supplier_name' in row and not pd.isna(row['supplier_name']):
            supplier_name = sanitize_csv_value(str(row['supplier_name']))
            supplier = await find_or_create_supplier(supplier_name, org_id, db)
        
        # Calculate CBAM liability
        carbon_price_deduction_gbp = Decimal('0')
        if 'carbon_price_deduction_gbp' in row and not pd.isna(row['carbon_price_deduction_gbp']):
            try:
                carbon_price_deduction_gbp = Decimal(str(row['carbon_price_deduction_gbp']))
            except (ValueError, ArithmeticError):
                pass
        
        calc_result = calculate_cbam_liability(
            quantity_tonnes=quantity_tonnes,
            data_source=data_source,
            import_type=import_type,
            emissions_intensity_default=product.default_intensity,
            emissions_intensity_actual=emissions_intensity_actual,
            carbon_price_deduction_gbp=carbon_price_deduction_gbp,
            uk_ets_rate=uk_ets_rate
        )
        
        # Parse installation fields
        installation_name = None
        installation_id = None
        production_route = None
        
        if 'installation_name' in row and not pd.isna(row['installation_name']):
            installation_name = sanitize_csv_value(str(row['installation_name']))[:255]
        
        if 'installation_id' in row and not pd.isna(row['installation_id']):
            installation_id = sanitize_csv_value(str(row['installation_id']))[:100]
        
        if 'production_route' in row and not pd.isna(row['production_route']):
            production_route = str(row['production_route']).strip()
            valid_routes = ["BF-BOF", "EAF-scrap", "DRI", "Smelting-electrolysis", "Other"]
            if production_route not in valid_routes:
                production_route = None
        
        # Create Import record
        import_record = Import(
            org_id=org_id,
            product_id=product.id,
            supplier_id=supplier.id if supplier else None,
            import_date=import_date,
            quantity_tonnes=quantity_tonnes,
            import_value_gbp=import_value_gbp,
            country_of_origin=country_of_origin,
            import_type=import_type,
            data_source=data_source,
            emissions_intensity_actual=emissions_intensity_actual,
            emissions_intensity_default=calc_result.emissions_intensity_default,
            uk_ets_rate_used=calc_result.uk_ets_rate_used,
            embedded_emissions_tco2e=calc_result.embedded_emissions_tco2e,
            cbam_liability_gbp=calc_result.cbam_liability_gbp,
            cbam_liability_default_gbp=calc_result.cbam_liability_default_gbp,
            potential_saving_gbp=calc_result.potential_saving_gbp,
            carbon_price_deduction_gbp=carbon_price_deduction_gbp,
            installation_name=installation_name,
            installation_id=installation_id,
            production_route=production_route,
            created_by=user_id
        )
        
        return import_record, None
        
    except Exception as e:
        return None, BulkImportError(
            row=row_index,
            field='general',
            message=f"Unexpected error: {str(e)}"
        )


async def process_bulk_csv_import(
    file_content: bytes,
    org_id: UUID,
    user: User,
    db: AsyncSession
) -> BulkImportResult:
    """
    Process bulk CSV import of CBAM imports.
    
    Args:
        file_content: CSV file content as bytes
        org_id: Organisation UUID
        user: User object
        db: Database session
    
    Returns:
        BulkImportResult with success/error counts and error details
    
    Algorithm:
        1. Parse CSV with pandas
        2. Validate row count (<= 1000)
        3. Load products into cache
        4. Get current UK ETS rate
        5. For each row:
           - Validate required fields
           - Lookup product
           - Find or create supplier
           - Calculate CBAM liability
           - Create Import record
        6. Commit all successful imports
        7. Return result summary
    
    Preconditions:
        - file_content is valid CSV format
        - org_id exists in database
        - user has permission for org_id
        - CSV has header row
        - Row count <= 1000
    
    Postconditions:
        - All valid rows are inserted as Import records
        - Invalid rows are reported in errors array
        - Transaction is committed
        - success_count + error_count = total rows in CSV
    """
    success_count = 0
    error_count = 0
    errors: List[BulkImportError] = []
    
    try:
        # Parse CSV
        df = pd.read_csv(BytesIO(file_content))
        
        # Validate row count
        if len(df) > 1000:
            return BulkImportResult(
                success_count=0,
                error_count=len(df),
                errors=[BulkImportError(
                    row=0,
                    field='file',
                    message='Max 1000 rows per upload'
                )]
            )
        
        # Load all products into cache
        result = await db.execute(select(UKCBAMProduct))
        products = result.scalars().all()
        products_cache = {p.commodity_code: p for p in products}
        
        # Get current UK ETS rate
        ets_price = await get_current_ets_price(db)
        uk_ets_rate = ets_price.price_gbp if ets_price else Decimal('50.00')
        
        # Process each row
        for idx, row in df.iterrows():
            row_number = idx + 2  # +2 because: 0-indexed + header row
            
            import_record, error = await validate_and_create_import(
                row=row,
                row_index=row_number,
                org_id=org_id,
                user_id=user.id,
                products_cache=products_cache,
                uk_ets_rate=uk_ets_rate,
                db=db
            )
            
            if import_record:
                db.add(import_record)
                success_count += 1
            else:
                errors.append(error)
                error_count += 1
        
        # Commit all successful imports
        if success_count > 0:
            await db.commit()
        
        return BulkImportResult(
            success_count=success_count,
            error_count=error_count,
            errors=errors
        )
        
    except Exception as e:
        await db.rollback()
        return BulkImportResult(
            success_count=0,
            error_count=0,
            errors=[BulkImportError(
                row=0,
                field='file',
                message=f'Failed to parse CSV: {str(e)}'
            )]
        )


def generate_csv_template() -> str:
    """
    Generate CSV template with correct headers.
    
    Returns:
        CSV template string with headers
    """
    headers = [
        'import_date',
        'product_code',
        'quantity_tonnes',
        'import_value_gbp',
        'country_of_origin',
        'supplier_name',
        'import_type',
        'data_source',
        'emissions_intensity_actual',
        'carbon_price_deduction_gbp',
        'installation_name',
        'installation_id',
        'production_route'
    ]
    
    # Add example row
    example = [
        '2027-01-15',
        '72071100',
        '50.5',
        '12500',
        'China',
        'Supplier A',
        'standard',
        'default',
        '',
        '0',
        'Beijing Steel Plant',
        'CN-BJ-001',
        'BF-BOF'
    ]
    
    return ','.join(headers) + '\n' + ','.join(example)
