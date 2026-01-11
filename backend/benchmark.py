import asyncio
import time
from app.algos.engine import OptimizationEngine
from app.db.session import AsyncSessionLocal

async def run_benchmark():
    print("=== PERFORMANCE BENCHMARK ===")
    start_time = time.time()
    
    engine = OptimizationEngine(AsyncSessionLocal())
    
    # 1. Load Data
    t0 = time.time()
    await engine.load_data()
    t1 = time.time()
    print(f"Data loading: {t1 - t0:.2f}s")
    
    # 2. Build Conflict Graph
    t2 = time.time()
    engine.build_conflict_graph()
    t3 = time.time()
    print(f"Conflict graph building: {t3 - t2:.2f}s")
    
    # 3. Optimization
    t4 = time.time()
    engine.initial_solution()
    t5 = time.time()
    print(f"Optimization (Greedy): {t5 - t4:.2f}s")
    
    # 4. Total
    total_time = time.time() - start_time
    print(f"==============================")
    print(f"TOTAL EXECUTION TIME: {total_time:.2f}s")
    print(f"Number of Exams Scheduled: {len(engine.solution)}")
    print(f"==============================")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
