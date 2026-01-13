
-- Database Setup Script (Clean Version)
-- Optimized for PostgreSQL

-- 1. Create Tables
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE professors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    department_id INTEGER REFERENCES departments(id),
    specialization VARCHAR(255)
);

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    program_id INTEGER REFERENCES programs(id),
    promo VARCHAR(50)
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    building VARCHAR(100)
);

CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    program_id INTEGER REFERENCES programs(id)
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    module_id INTEGER REFERENCES modules(id)
);

CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id)
);

CREATE TABLE timetable_entries (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id),
    room_id INTEGER REFERENCES rooms(id),
    supervisor_id INTEGER REFERENCES professors(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT'
);

-- 2. Constraints & Indexes
CREATE INDEX idx_student_daily ON timetable_entries (start_time::DATE);
CREATE INDEX idx_room_availability ON timetable_entries (room_id, start_time);
CREATE INDEX idx_prof_availability ON timetable_entries (supervisor_id, start_time);
