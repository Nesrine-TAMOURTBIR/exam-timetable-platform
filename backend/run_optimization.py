import asyncio
import time
from app.algos.engine import OptimizationEngine
from app.db.session import AsyncSessionLocal

async def main():
    print("Initializing Optimization Engine...")
    engine = OptimizationEngine(AsyncSessionLocal)
    
    start_time = time.time()
    await engine.load_data()
    load_time = time.time()
    print(f"Data Loaded in {load_time - start_time:.2f}s")
    
    engine.build_conflict_graph()
    graph_time = time.time()
    print(f"Graph Built in {graph_time - load_time:.2f}s")
    
    success = engine.initial_solution()
    solve_time = time.time()
    print(f"Solution generated in {solve_time - graph_time:.2f}s")
    print(f"Success: {success}")
    
    await engine.save_results()
    save_time = time.time()
    print(f"Results saved in {save_time - solve_time:.2f}s")
    
    total_time = save_time - start_time
    print(f"Total Execution Time: {total_time:.2f}s")

if __name__ == "__main__":
    asyncio.run(main())
