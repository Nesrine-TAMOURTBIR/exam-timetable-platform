"""Add_indexes_and_stored_procedures

Revision ID: 482bd16f04da
Revises: 14f5eeb2547a
Create Date: 2025-12-22 12:49:18.710066

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '482bd16f04da'
down_revision: Union[str, Sequence[str], None] = '14f5eeb2547a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create Indexes for Foreign Keys (Performance)
    op.create_index('ix_enrollments_student_id', 'enrollments', ['student_id'])
    op.create_index('ix_enrollments_module_id', 'enrollments', ['module_id'])
    op.create_index('ix_timetable_exam_id', 'timetable_entries', ['exam_id'])
    op.create_index('ix_timetable_room_id', 'timetable_entries', ['room_id'])
    op.create_index('ix_timetable_supervisor_id', 'timetable_entries', ['supervisor_id'])
    op.create_index('ix_timetable_start_time', 'timetable_entries', ['start_time'])

    # PL/pgSQL Function for Conflict Detection
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_timetable() 
    RETURNS TABLE(conflict_type TEXT, details TEXT) AS $$
    BEGIN
        -- 1. Student Daily Limit (Max 1 exam per day)
        RETURN QUERY
        SELECT 'Student Daily Limit'::TEXT, 'Student ' || s.id || ' has multiple exams on ' || t.start_time::DATE
        FROM timetable_entries t
        JOIN exams e ON t.exam_id = e.id
        JOIN modules m ON e.module_id = m.id
        JOIN enrollments en ON m.id = en.module_id
        JOIN students s ON en.student_id = s.id
        GROUP BY s.id, t.start_time::DATE
        HAVING COUNT(*) > 1;

        -- 2. Room Capacity
        RETURN QUERY
        SELECT 'Room Capacity'::TEXT, 'Room ' || t.room_id || ' exceeded at ' || t.start_time
        FROM timetable_entries t
        JOIN exams e ON t.exam_id = e.id
        JOIN modules m ON e.module_id = m.id
        JOIN rooms r ON t.room_id = r.id
        JOIN (SELECT module_id, COUNT(*) as cnt FROM enrollments GROUP BY module_id) en_counts ON m.id = en_counts.module_id
        WHERE en_counts.cnt > r.capacity;

        -- 3. Professor Daily Limit (Max 3 exams per day)
        RETURN QUERY
        SELECT 'Supervisor Limit'::TEXT, 'Professor ' || t.supervisor_id || ' has >3 exams on ' || t.start_time::DATE
        FROM timetable_entries t
        GROUP BY t.supervisor_id, t.start_time::DATE
        HAVING COUNT(*) > 3;
    END;
    $$ LANGUAGE plpgsql;
    """)


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS validate_timetable()")
    op.drop_index('ix_timetable_start_time', table_name='timetable_entries')
    op.drop_index('ix_timetable_supervisor_id', table_name='timetable_entries')
    op.drop_index('ix_timetable_room_id', table_name='timetable_entries')
    op.drop_index('ix_timetable_exam_id', table_name='timetable_entries')
    op.drop_index('ix_enrollments_module_id', table_name='enrollments')
    op.drop_index('ix_enrollments_student_id', table_name='enrollments')
