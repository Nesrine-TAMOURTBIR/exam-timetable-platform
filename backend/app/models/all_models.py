from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class UserRole(enum.Enum):
    ADMIN = "admin"
    DEAN = "dean"
    HEAD_OF_DEPT = "head"
    PROFESSOR = "professor"
    STUDENT = "student"

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    programs = relationship("Program", back_populates="department")
    professors = relationship("Professor", back_populates="department")

class Program(Base):
    __tablename__ = "programs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    department = relationship("Department", back_populates="programs")
    students = relationship("Student", back_populates="program")
    modules = relationship("Module", back_populates="program")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String) # Stored as string, using Enum logic in app
    is_active = Column(Boolean, default=True)
    
    # Polymorphic relationships could be used, but simple 1-to-1 links are easier
    student_profile = relationship("Student", back_populates="user", uselist=False)
    professor_profile = relationship("Professor", back_populates="user", uselist=False)

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    program_id = Column(Integer, ForeignKey("programs.id"))
    
    user = relationship("User", back_populates="student_profile")
    program = relationship("Program", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student")

class Professor(Base):
    __tablename__ = "professors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    user = relationship("User", back_populates="professor_profile")
    department = relationship("Department", back_populates="professors")
    modules = relationship("Module", back_populates="professor")
    # Supervising exams
    exams = relationship("TimetableEntry", back_populates="supervisor")

class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"))
    professor_id = Column(Integer, ForeignKey("professors.id")) # Supervisor of the course
    
    program = relationship("Program", back_populates="modules")
    professor = relationship("Professor", back_populates="modules")
    enrollments = relationship("Enrollment", back_populates="module")
    exam = relationship("Exam", back_populates="module", uselist=False)

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    module_id = Column(Integer, ForeignKey("modules.id"))
    
    student = relationship("Student", back_populates="enrollments")
    module = relationship("Module", back_populates="enrollments")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    capacity = Column(Integer)
    # type? Lab/Amphi

class Exam(Base):
    __tablename__ = "exams"
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"))
    duration_minutes = Column(Integer, default=90)
    
    module = relationship("Module", back_populates="exam")
    timetable_entry = relationship("TimetableEntry", back_populates="exam", uselist=False)

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), unique=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    supervisor_id = Column(Integer, ForeignKey("professors.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    
    exam = relationship("Exam", back_populates="timetable_entry")
    room = relationship("Room")
    supervisor = relationship("Professor", back_populates="exams")
