"""advanced_db_optimizations

Revision ID: 5ebf4c9a2b1d
Revises: 482bd16f04da
Create Date: 2026-01-11 22:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5ebf4c9a2b1d'
down_revision: Union[str, Sequence[str], None] = '482bd16f04da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Partial Index for upcoming exams (optimization for active queries)
    # We use a literal date for the partial index logic or just a general 'greater than' logic
    op.execute("CREATE INDEX ix_timetable_upcoming ON timetable_entries (start_time) WHERE start_time >= '2026-01-01'")

    # 2. Enhanced PL/pgSQL Procedure for Stats (Occupancy Rate)
    op.execute("""
    CREATE OR REPLACE FUNCTION get_room_occupancy_stats() 
    RETURNS TABLE(room_id INT, room_name VARCHAR, avg_occupancy_rate NUMERIC) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            r.id, 
            r.name,
            AVG(CAST(en_counts.cnt AS NUMERIC) / r.capacity * 100)::NUMERIC as avg_rate
        FROM rooms r
        JOIN timetable_entries t ON r.id = t.room_id
        JOIN exams e ON t.exam_id = e.id
        JOIN (SELECT module_id, COUNT(*) as cnt FROM enrollments GROUP BY module_id) en_counts ON e.module_id = en_counts.module_id
        GROUP BY r.id, r.name;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # 3. Add procedure for supervision equality check
    op.execute("""
    CREATE OR REPLACE FUNCTION check_supervision_equality() 
    RETURNS TABLE(professor_id INT, email VARCHAR, supervision_count BIGINT) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            p.id, 
            u.email,
            COUNT(t.id) as supervision_count
        FROM professors p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN timetable_entries t ON p.id = t.supervisor_id
        GROUP BY p.id, u.email
        ORDER BY supervision_count DESC;
    END;
    $$ LANGUAGE plpgsql;
    """)

def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS check_supervision_equality()")
    op.execute("DROP FUNCTION IF EXISTS get_room_occupancy_stats()")
    op.execute("DROP INDEX IF EXISTS ix_timetable_upcoming")
