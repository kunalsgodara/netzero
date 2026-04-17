"""
Deadlines Service
Handles compliance deadline tracking and status calculation.
"""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.uk_cbam import ComplianceDeadline


def calculate_deadline_status(deadline: ComplianceDeadline, current_date: date) -> str:
    """
    Calculate the status of a deadline based on the current date.
    
    Args:
        deadline: ComplianceDeadline object
        current_date: Current date for comparison
    
    Returns:
        Status string: "complete", "overdue", "at_risk", or "upcoming"
    
    Algorithm:
        - If completed_at is set, return "complete"
        - If due_date < current_date, return "overdue"
        - If 0 <= days_until <= 7, return "at_risk"
        - Otherwise, return "upcoming"
    """
    # If already marked complete, return complete
    if deadline.completed_at is not None:
        return "complete"
    
    # Calculate days until deadline
    days_until = (deadline.due_date - current_date).days
    
    # Determine status based on days remaining
    if days_until < 0:
        return "overdue"
    elif days_until <= 7:
        return "at_risk"
    else:
        return "upcoming"


async def get_upcoming_deadlines(
    org_id: UUID,
    db: AsyncSession,
    limit: int = 100,
    include_completed: bool = False
) -> List[ComplianceDeadline]:
    """
    Get upcoming deadlines for an organisation, sorted by due date.
    
    Args:
        org_id: Organisation UUID
        db: Database session
        limit: Maximum number of deadlines to return (default 100)
        include_completed: Whether to include completed deadlines (default False)
    
    Returns:
        List of ComplianceDeadline objects sorted by due_date ascending
    
    Preconditions:
        - org_id is valid UUID
        - limit > 0 and limit <= 100
        - db session is active
    
    Postconditions:
        - Returns list of up to `limit` deadlines
        - Deadlines are sorted by due_date ascending
        - Only returns deadlines for specified org_id
        - List length <= limit
    """
    query = select(ComplianceDeadline).where(ComplianceDeadline.org_id == org_id)
    
    if not include_completed:
        query = query.where(ComplianceDeadline.status != "complete")
    
    query = query.order_by(ComplianceDeadline.due_date.asc()).limit(limit)
    
    result = await db.execute(query)
    deadlines = result.scalars().all()
    
    # Update status for each deadline based on current date
    current_date = date.today()
    for deadline in deadlines:
        new_status = calculate_deadline_status(deadline, current_date)
        if deadline.status != new_status:
            deadline.status = new_status
    
    await db.commit()
    
    return list(deadlines)


async def get_next_n_deadlines(
    org_id: UUID,
    db: AsyncSession,
    n: int = 3
) -> List[ComplianceDeadline]:
    """
    Get the next N upcoming deadlines for an organisation.
    
    Args:
        org_id: Organisation UUID
        db: Database session
        n: Number of deadlines to return (default 3)
    
    Returns:
        List of next N upcoming deadlines
    """
    return await get_upcoming_deadlines(org_id, db, limit=n, include_completed=False)


async def mark_deadline_complete(
    deadline_id: UUID,
    org_id: UUID,
    db: AsyncSession
) -> Optional[ComplianceDeadline]:
    """
    Mark a deadline as complete.
    
    Args:
        deadline_id: Deadline UUID
        org_id: Organisation UUID (for authorization check)
        db: Database session
    
    Returns:
        Updated ComplianceDeadline object or None if not found
    
    Preconditions:
        - deadline_id exists in database
        - org_id matches the deadline's org_id
    
    Postconditions:
        - Deadline status is set to "complete"
        - completed_at is set to current timestamp
        - Changes are committed to database
    """
    result = await db.execute(
        select(ComplianceDeadline).where(
            and_(
                ComplianceDeadline.id == deadline_id,
                ComplianceDeadline.org_id == org_id
            )
        )
    )
    deadline = result.scalar_one_or_none()
    
    if not deadline:
        return None
    
    # Mark as complete
    deadline.status = "complete"
    deadline.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(deadline)
    
    return deadline


async def get_deadline_by_id(
    deadline_id: UUID,
    org_id: UUID,
    db: AsyncSession
) -> Optional[ComplianceDeadline]:
    """
    Get a specific deadline by ID, ensuring it belongs to the specified org.
    
    Args:
        deadline_id: Deadline UUID
        org_id: Organisation UUID (for authorization check)
        db: Database session
    
    Returns:
        ComplianceDeadline object or None if not found
    """
    result = await db.execute(
        select(ComplianceDeadline).where(
            and_(
                ComplianceDeadline.id == deadline_id,
                ComplianceDeadline.org_id == org_id
            )
        )
    )
    return result.scalar_one_or_none()
