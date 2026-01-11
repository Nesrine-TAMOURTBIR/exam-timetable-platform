"""update_roles_and_timetable_status

Revision ID: 6fc4d1f2a3b4
Revises: 5ebf4c9a2b1d
Create Date: 2026-01-11 23:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '6fc4d1f2a3b4'
down_revision: Union[str, Sequence[str], None] = '5ebf4c9a2b1d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add status column to timetable_entries
    op.add_column('timetable_entries', sa.Column('status', sa.String(), nullable=True, server_default='DRAFT'))

def downgrade() -> None:
    op.drop_column('timetable_entries', 'status')
    # Removing enum value is complex in PG, skipping for now as it's a downgrade
