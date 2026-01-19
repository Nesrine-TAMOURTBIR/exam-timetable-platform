"""Add status column to timetable_entries

Revision ID: 177f8d68926b
Revises: 14f5eeb2547a
Create Date: 2026-01-18 15:25:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '177f8d68926b'
down_revision = '14f5eeb2547a'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('timetable_entries', sa.Column('status', sa.String(), nullable=True, server_default='DRAFT'))

def downgrade():
    op.drop_column('timetable_entries', 'status')
