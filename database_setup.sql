-- Exam Timetable Platform - Database Setup Script
-- Schema + Demo Data

CREATE TABLE departments (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL);
CREATE TABLE programs (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, department_id INTEGER REFERENCES departments(id));
CREATE TABLE users (
    id SERIAL PRIMARY KEY, 
    email VARCHAR(255) UNIQUE NOT NULL, 
    hashed_password VARCHAR(255) NOT NULL, 
    full_name VARCHAR(255), 
    role VARCHAR(50),
    department_id INTEGER,
    program_id INTEGER
);
CREATE TABLE professors (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), department_id INTEGER REFERENCES departments(id));
CREATE TABLE students (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), program_id INTEGER REFERENCES programs(id));
CREATE TABLE rooms (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, capacity INTEGER NOT NULL);
CREATE TABLE modules (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, program_id INTEGER REFERENCES programs(id));
CREATE TABLE exams (id SERIAL PRIMARY KEY, module_id INTEGER REFERENCES modules(id), duration_minutes INTEGER DEFAULT 90);
CREATE TABLE timetable_entries (
    id SERIAL PRIMARY KEY, 
    exam_id INTEGER REFERENCES exams(id), 
    room_id INTEGER REFERENCES rooms(id), 
    supervisor_id INTEGER REFERENCES professors(id), 
    start_time TIMESTAMP NOT NULL, 
    end_time TIMESTAMP NOT NULL, 
    status VARCHAR(50) DEFAULT 'DRAFT'
);

-- Demo Data
INSERT INTO departments (id, name) VALUES (1, 'Department of Include');
INSERT INTO programs (id, name, department_id) VALUES (1, 'Computer Science', 1);
-- Password is 'secret'
INSERT INTO users (email, hashed_password, full_name, role, department_id) VALUES 
('admin@example.com', '$2b$04$v9Q4fCjBk6lC8n/oF0GKOu8PqYisre8J9z5yC0n9f5X5X/0z2z2z.', 'System Admin', 'admin', NULL),
('head@example.com', '$2b$04$v9Q4fCjBk6lC8n/oF0GKOu8PqYisre8J9z5yC0n9f5X5X/0z2z2z.', 'HOD Jordan', 'head', 1),
('dean@example.com', '$2b$04$v9Q4fCjBk6lC8n/oF0GKOu8PqYisre8J9z5yC0n9f5X5X/0z2z2z.', 'Dean Smith', 'dean', NULL);
INSERT INTO professors (user_id, department_id) VALUES (2, 1);
