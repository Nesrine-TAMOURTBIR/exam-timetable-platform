from sqlalchemy import create_engine, inspect

db_url = "postgresql://exam_db_7br4_user:ntSPKYfZplyNAqdc46pmQoGVxz7vdrHc@dpg-d5f46fali9vc73dbgpkg-a.frankfurt-postgres.render.com/exam_db_7br4"
engine = create_engine(db_url)

def inspect_users():
    inspector = inspect(engine)
    columns = inspector.get_columns('users')
    col_names = [c['name'] for c in columns]
    print(f"Columns: {', '.join(col_names)}")

if __name__ == "__main__":
    inspect_users()
