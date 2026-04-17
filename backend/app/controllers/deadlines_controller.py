"""
Deadlines Controller
API endpoints for compliance deadline management.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.deadlines import DeadlineResponse, DeadlineWithDaysRemaining, DeadlineUpdate
from app.services import deadlines_service
from datetime import date


router = APIRouter(prefix="/api/deadlines", tags=["deadlines"])


@router.get("", response_model=List[DeadlineWithDaysRemaining])
async def list_deadlines(
    include_completed: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all compliance deadlines for the user's organisation.
    
    Query Parameters:
        - include_completed: Include completed deadlines (default: False)
    
    Returns:
        List of deadlines with days_remaining calculated
    """
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to an organisation"
        )
    
    deadlines = await deadlines_service.get_upcoming_deadlines(
        org_id=current_user.org_id,
        db=db,
        limit=100,
        include_completed=include_completed
    )
    
    # Add days_remaining to each deadline
    current_date = date.today()
    result = []
    for deadline in deadlines:
        days_remaining = (deadline.due_date - current_date).days
        result.append(
            DeadlineWithDaysRemaining(
                **deadline.__dict__,
                days_remaining=days_remaining
            )
        )
    
    return result


@router.get("/next", response_model=List[DeadlineWithDaysRemaining])
async def get_next_deadlines(
    n: int = 3,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the next N upcoming deadlines for the user's organisation.
    
    Query Parameters:
        - n: Number of deadlines to return (default: 3, max: 10)
    
    Returns:
        List of next N upcoming deadlines with days_remaining
    """
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to an organisation"
        )
    
    if n > 10:
        n = 10
    
    deadlines = await deadlines_service.get_next_n_deadlines(
        org_id=current_user.org_id,
        db=db,
        n=n
    )
    
    # Add days_remaining to each deadline
    current_date = date.today()
    result = []
    for deadline in deadlines:
        days_remaining = (deadline.due_date - current_date).days
        result.append(
            DeadlineWithDaysRemaining(
                **deadline.__dict__,
                days_remaining=days_remaining
            )
        )
    
    return result


@router.put("/{deadline_id}/complete", response_model=DeadlineResponse)
async def mark_deadline_complete(
    deadline_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a compliance deadline as complete.
    
    Path Parameters:
        - deadline_id: UUID of the deadline to mark complete
    
    Returns:
        Updated deadline object
    """
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to an organisation"
        )
    
    deadline = await deadlines_service.mark_deadline_complete(
        deadline_id=deadline_id,
        org_id=current_user.org_id,
        db=db
    )
    
    if not deadline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deadline not found or access denied"
        )
    
    # TODO: Add audit log entry for deadline completion
    
    return deadline


@router.get("/{deadline_id}", response_model=DeadlineResponse)
async def get_deadline(
    deadline_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific deadline by ID.
    
    Path Parameters:
        - deadline_id: UUID of the deadline
    
    Returns:
        Deadline object
    """
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to an organisation"
        )
    
    deadline = await deadlines_service.get_deadline_by_id(
        deadline_id=deadline_id,
        org_id=current_user.org_id,
        db=db
    )
    
    if not deadline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deadline not found or access denied"
        )
    
    return deadline
