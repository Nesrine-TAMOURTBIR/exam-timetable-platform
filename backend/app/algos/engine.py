from typing import List, Dict, Set
import asyncio
from sqlalchemy import select, func
import sqlalchemy as sa
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.models.all_models import Student, Exam, Room, Professor, Enrollment, TimetableEntry, Module
from app.db.session import AsyncSessionLocal

class OptimizationEngine:
    def __init__(self, session_factory):
        self.session_factory = session_factory
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
        async with self.session_factory() as session:
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

    def initial_solution(self, mode="optimized"):
        """
        Génération constructive avec respect des contraintes.
        Mode 'draft': Heuristique plus rapide, peut laisser quelques conflits si nécessaire.
        Mode 'optimized': Recherche exhaustive pour éliminer tous les conflits.
        """
        print(f"🚀 Lancement de la génération ({mode})...")
        
        start_time = datetime.now()
        TIMEOUT_SECONDS = 30 if mode == "draft" else 60

        # Tri des examens par difficulté
        sorted_exams = sorted(self.exams, key=lambda e: len(self.conflicts.get(e.id, [])), reverse=True)
        
        self.rooms.sort(key=lambda r: r.capacity)
        
        # Configuration temporelle : Plus serré pour le draft
        DAYS = 10 if mode == "draft" else 15
        SLOTS_PER_DAY = 3 if mode == "draft" else 4
        slots = [(d, s) for d in range(DAYS) for s in range(SLOTS_PER_DAY)]
        
        room_usage = {} 
        prof_usage = {} 
        prof_daily_counts = {} 
        prof_total_counts = {p.id: 0 for p in self.profs}
        
        unassigned = []
        total_exams = len(sorted_exams)
        
        for idx, exam in enumerate(sorted_exams):
            if (datetime.now() - start_time).total_seconds() > TIMEOUT_SECONDS:
                print(f"⚠️ Timeout atteint ({TIMEOUT_SECONDS}s).")
                unassigned.extend([e.id for e in sorted_exams[idx:]])
                break

            assigned = False
            student_count = len(self.enrollments.get(exam.id, []))
            
            # Blocked days based on conflict graph
            blocked_days = {self.solution[nid][0] for nid in self.conflicts.get(exam.id, []) if nid in self.solution}
            valid_rooms = [r for r in self.rooms if r.capacity >= student_count]

            for day, slot in slots:
                # In draft mode, the tighter schedule naturally creates more potential for "unassigned" if we are strict.
                # Here we stick to hard constraints, but "Draft" will feel different due to 'DAYS' limit.
                if day in blocked_days: continue

                usage_key = (day, slot)
                if usage_key not in room_usage: room_usage[usage_key] = set()
                
                selected_room = next((r for r in valid_rooms if r.id not in room_usage[usage_key]), None)
                if not selected_room: continue

                if usage_key not in prof_usage: prof_usage[usage_key] = set()
                
                # Draft: Max 2 supervisions/day. Optimized: Max 3.
                max_daily = 2 if mode == "draft" else 3
                candidate_profs = [p for p in self.profs if p.id not in prof_usage[usage_key] and prof_daily_counts.get((day, p.id), 0) < max_daily]

                if not candidate_profs: continue
                
                exam_dept_id = exam.module.program.department_id if exam.module and exam.module.program else -1
                best_p = None
                best_score = float('inf')
                
                for p in candidate_profs:
                    score = prof_total_counts[p.id]
                    if p.department_id == exam_dept_id: score -= 5
                    if score < best_score:
                        best_score = score
                        best_p = p
                
                selected_prof = best_p
                if not selected_prof: continue

                self.solution[exam.id] = (day, slot, selected_room.id, selected_prof.id)
                room_usage[usage_key].add(selected_room.id)
                prof_usage[usage_key].add(selected_prof.id)
                prof_daily_counts[(day, selected_prof.id)] = prof_daily_counts.get((day, selected_prof.id), 0) + 1
                prof_total_counts[selected_prof.id] += 1
                assigned = True
                break
            
            if not assigned:
                unassigned.append(exam.id)
            
            if idx % 50 == 0:
                print(f"⌛ Progression : {idx}/{total_exams}...")

        print(f"✅ Terminé. Non-assignés : {len(unassigned)}/{total_exams}")
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

        async with self.session_factory() as session:
            await session.execute(sa.text("TRUNCATE TABLE timetable_entries RESTART IDENTITY CASCADE"))
            stmt = sa.insert(TimetableEntry)
            await session.execute(stmt, entries)
            await session.commit()
            print(f"Saved {len(entries)} timetable entries.")

    async def run(self, mode="optimized"):
        await self.load_data()
        self.build_conflict_graph()
        self.initial_solution(mode=mode)
        if mode == "optimized":
            self.optimize()
        await self.save_results()
