import os
import subprocess
import sys

def run_command(command):
    print(f"Running command: {command}")
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        print(line, end='')
    process.wait()
    if process.returncode != 0:
        print(f"Command failed with return code {process.returncode}")
        # We don't necessarily want to exit if seeding fails (maybe data already exists)
    return process.returncode

def main():
    print("="*60)
    print("BOOTSTRAP: Initializing Application Database")
    print("="*60)

    # 1. Set PYTHONPATH to include current directory
    os.environ["PYTHONPATH"] = os.getcwd() + os.pathsep + os.environ.get("PYTHONPATH", "")

    # 2. Run Alembic Migrations
    print("\n[1/2] Running database migrations...")
    run_command("python -m alembic upgrade head")

    # 3. Create Demo Users (Seeding)
    print("\n[2/2] Seeding demo users...")
    run_command("python create_demo_users.py")

    print("\n" + "="*60)
    print("BOOTSTRAP COMPLETE: Starting Server")
    print("="*60)

    # 4. Start Uvicorn
    port = os.environ.get("PORT", "8000")
    run_command(f"uvicorn app.main:app --host 0.0.0.0 --port {port}")

if __name__ == "__main__":
    main()
