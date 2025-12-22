from typing import List, Dict, Set
import asyncio
from sqlalchemy import select, func
import sqlalchemy as sa
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.models.all_models import Student, Exam, Room, Professor, Enrollment, TimetableEntry, Module
from app.db.session import AsyncSessionLocal

class OptimizationEngine:
    def __init__(self, db_session):
        self.db = db_session
        self.exams: List[Exam] = []
        self.rooms: List[Room] = []
        self.profs: List[Professor] = []
        self.enrollments: Dict[int, Set[int]] = {} # exam_id -> set of student_ids
        self.conflicts: Dict[int, Set[int]] = {} # exam_id -> set of conflicting exam_ids
        
        # Solution state
        # exam_id -> (room_id, time_slot, supervisor_id)
        self.solution = {} 

    async def load_data(self):
        """Load all necessary data into memory"""
        print("Loading data for optimization...")
        async with self.db as session:
            # Load Exams with relationships
            result = await session.execute(
                select(Exam).options(
                    selectinload(Exam.module).selectinload(Module.program)
                )
            )
            self.exams = result.scalars().all()
            print(f"Loaded {len(self.exams)} exams")

            # Load Rooms
            result = await session.execute(select(Room))
            self.rooms = result.scalars().all()
            
            # Load Profs
            result = await session.execute(select(Professor))
            self.profs = result.scalars().all()

            # Load Enrollments (optimization: raw query for speed)
            print("Loading enrollments map...")
            query = """
                SELECT e.id as exam_id, en.student_id 
                FROM exams e
                JOIN modules m ON e.module_id = m.id
                JOIN enrollments en ON m.id = en.module_id
            """
            result = await session.execute(sa.text(query))
            rows = result.fetchall()
            
            self.enrollments = {}
            for exam_id, student_id in rows:
                if exam_id not in self.enrollments:
                    self.enrollments[exam_id] = set()
                self.enrollments[exam_id].add(student_id)
            print(f"Loaded enrollments for {len(self.enrollments)} exams")

    def build_conflict_graph(self):
        """Construct the graph where edges represent students taking both exams"""
        print("Building conflict graph...")
        # Dictionary exam_id -> set of conflicting exam_ids
        # Two exams conflict if they share at least one student
        
        # Inverted index: student_id -> list of exam_ids
        student_exams = {}
        for exam_id, students in self.enrollments.items():
            self.conflicts[exam_id] = set() # Init
            for sid in students:
                if sid not in student_exams:
                    student_exams[sid] = []
                student_exams[sid].append(exam_id)
        
        # Build edges
        for sid, e_ids in student_exams.items():
            # For each pair in e_ids, they conflict
            for i in range(len(e_ids)):
                for j in range(i + 1, len(e_ids)):
                    u, v = e_ids[i], e_ids[j]
                    self.conflicts[u].add(v)
                    self.conflicts[v].add(u)
        
        print("Conflict graph built.")

    def initial_solution(self):
        """Greedy constructive heuristic"""
        print("Starting Greedy Initial Solution...")
        # Sort exams by degree (number of conflicts) descending
        sorted_exams = sorted(self.exams, key=lambda e: len(self.conflicts.get(e.id, [])), reverse=True)
        
        # Configuration
        DAYS = 14
        SLOTS_PER_DAY = 4
        slots = [(d, s) for d in range(DAYS) for s in range(SLOTS_PER_DAY)]
        
        # State tracking
        # (day, slot, room_id) -> exam_id
        room_usage = {} 
        # (day, slot, prof_id) -> exam_id
        prof_usage = {} 
        # (day, prof_id) -> count
        prof_daily_counts = {} 
        
        unassigned = []
        
        total_exams = len(sorted_exams)
        for idx, exam in enumerate(sorted_exams):
            assigned = False
            needed_capacity = len(self.enrollments.get(exam.id, []))
            
            # Find first valid slot/room/prof
            for day, slot in slots:
                # 1. Check conflict with neighbors (Student Daily Limit)
                conflict_found = False
                neighbors = self.conflicts.get(exam.id, [])
                for neighbor_id in neighbors:
                    if neighbor_id in self.solution:
                        n_day, n_slot, _, _ = self.solution[neighbor_id]
                        # Constraint: Student max 1 exam per day
                        if n_day == day: # Same day conflict!
                            conflict_found = True
                            break
                if conflict_found: continue

                # 2. Try to find a room (Capacity & Availability)
                valid_room = None
                # Optimization: Sort rooms by capacity (Best Fit) to save large rooms
                # Filter rooms >= capacity
                candidate_rooms = sorted([r for r in self.rooms if r.capacity >= needed_capacity], key=lambda r: r.capacity)
                
                for room in candidate_rooms:
                    if (day, slot, room.id) not in room_usage:
                        valid_room = room
                        break
                if not valid_room: continue

                # 3. Try to find a supervisor
                valid_prof = None
                
                # Heuristic: Sort profs to prefer own department
                exam_dept_id = exam.module.program.department_id if exam.module and exam.module.program else -1
                
                # Filter valid profs first to avoid sorting everyone
                candidates = []
                for prof in self.profs:
                    daily_count = prof_daily_counts.get((day, prof.id), 0)
                    if daily_count >= 3: continue
                    if (day, slot, prof.id) in prof_usage: continue
                    candidates.append(prof)
                
                # Sort: First those in same dept, then others
                candidates.sort(key=lambda p: 0 if p.department_id == exam_dept_id else 1)
                
                if candidates:
                    valid_prof = candidates[0]
                
                if valid_prof:
                    # Assign
                    self.solution[exam.id] = (day, slot, valid_room.id, valid_prof.id)
                    room_usage[(day, slot, valid_room.id)] = exam.id
                    prof_usage[(day, slot, valid_prof.id)] = exam.id
                    prof_daily_counts[(day, valid_prof.id)] = prof_daily_counts.get((day, valid_prof.id), 0) + 1
                    assigned = True
                    break
            
            if not assigned:
                unassigned.append(exam.id)
            
            if idx % 100 == 0:
                print(f"Assigning exams: {idx}/{total_exams}...")

        print(f"Initial solution complete. Unassigned: {len(unassigned)}/{total_exams}")
        return len(unassigned) == 0

    def optimize(self):
        """
        Since Greedy already handles hard constraints, this step would maximize soft constraints.
        For now, we rely on the heuristic inside initial_solution (e.g. Dept priority).
        """
        pass

    async def save_results(self):
        """Bulk insert timetable entries"""
        print("Saving results to database...")
        entries = []
        
        # Start Date: June 1st 2026
        start_date = datetime(2026, 6, 1, 8, 30)
        
        # Slot definitions (Offsets in minutes from 8:30)
        slot_offsets = [0, 120, 300, 420]
        
        for exam_id, (day, slot_idx, room_id, prof_id) in self.solution.items():
            current_day = start_date + timedelta(days=day)
            slot_time = current_day + timedelta(minutes=slot_offsets[slot_idx])
            end_time = slot_time + timedelta(minutes=90)
            
            entries.append({
                "exam_id": exam_id,
                "room_id": room_id,
                "supervisor_id": prof_id,
                "start_time": slot_time,
                "end_time": end_time
            })
        
        if not entries:
            print("No entries to save.")
            return

        async with self.db as session:
            await session.execute(sa.text("TRUNCATE TABLE timetable_entries RESTART IDENTITY CASCADE"))
            stmt = sa.insert(TimetableEntry)
            await session.execute(stmt, entries)
            await session.commit()
            print(f"Saved {len(entries)} timetable entries.")

    async def run(self):
        await self.load_data()
        self.build_conflict_graph()
        self.initial_solution()
        self.optimize()
        await self.save_results()
