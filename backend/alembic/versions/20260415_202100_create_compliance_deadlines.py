"""create_compliance_deadlines

Revision ID: 20260415_202100
Revises: 20260415_202003
Create Date: 2026-04-15 20:21:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '20260415_202100'
down_revision: Union[str, None] = '20260415_202003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create compliance_deadlines table for tracking UK CBAM regulatory deadlines."""
    op.create_table(
        'compliance_deadlines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('deadline_type', sa.String(length=50), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='upcoming'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create index on (org_id, due_date) for efficient deadline queries
    op.create_index('idx_deadlines_org_date', 'compliance_deadlines', ['org_id', 'due_date'])


def downgrade() -> None:
    """Drop compliance_deadlines table and index."""
    op.drop_index('idx_deadlines_org_date', table_name='compliance_deadlines')
    op.drop_table('compliance_deadlines')
