"""add_installation_fields

Revision ID: 20260415_202003
Revises: 63314358988d
Create Date: 2026-04-15 20:20:03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260415_202003'
down_revision: Union[str, None] = '63314358988d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add installation_name, installation_id, and production_route columns to imports table."""
    op.add_column('imports', sa.Column('installation_name', sa.String(length=255), nullable=True))
    op.add_column('imports', sa.Column('installation_id', sa.String(length=100), nullable=True))
    op.add_column('imports', sa.Column('production_route', sa.String(length=50), nullable=True))


def downgrade() -> None:
    """Remove installation fields from imports table."""
    op.drop_column('imports', 'production_route')
    op.drop_column('imports', 'installation_id')
    op.drop_column('imports', 'installation_name')
