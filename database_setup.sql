-- ==========================================================
-- EXAM TIMETABLE PLATFORM - DATABASE SETUP SCRIPT
-- ==========================================================
-- This script contains the structure, constraints, and 
-- procedures as per the project requirements.

-- 1. TABLES CREATION
-- ----------------------------------------------------------

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE
);

CREATE TABLE professors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    professor_id INTEGER REFERENCES professors(id)
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE(student_id, module_id)
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    room_type VARCHAR(50) -- e.g., 'Amphi', 'Salle'
);

CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    duration_minutes INTEGER DEFAULT 90
);

CREATE TABLE timetable_entries (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    supervisor_id INTEGER REFERENCES professors(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    CONSTRAINT chk_end_after_start CHECK (end_time > start_time)
);

-- 2. INDEXES (Performance & Optimization)
-- ----------------------------------------------------------

CREATE INDEX ix_enrollments_student ON enrollments(student_id);
CREATE INDEX ix_enrollments_module ON enrollments(module_id);
CREATE INDEX ix_timetable_start ON timetable_entries(start_time);
CREATE INDEX ix_timetable_supervisor ON timetable_entries(supervisor_id);

-- Partial Index for Upcoming Exams (as specified)
CREATE INDEX ix_timetable_upcoming ON timetable_entries(start_time) 
WHERE start_time >= CURRENT_DATE;

-- 3. STORED PROCEDURES (PL/pgSQL)
-- ----------------------------------------------------------

-- Comprehensive Validation Procedure
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

-- Room Occupancy Statistics
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

-- Supervision Equality Distribution Check
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

-- ==========================================================
-- END OF SCRIPT
-- ==========================================================
