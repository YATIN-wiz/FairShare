import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to sys.path so we can import backend as a module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import DATABASE_URL, Base, engine
from backend.models import Group, Member, Expense, ExpenseSplit, Settlement

def try_create_db():
    # If the URL contains "dbms_project", let's connect to "postgres" database first
    # to create the target database if it doesn't exist
    if "dbms_project" in DATABASE_URL:
        admin_url = DATABASE_URL.replace("/dbms_project", "/postgres")
        print(f"Target database 'dbms_project' not found. Connecting to admin database '{admin_url.split('@')[1]}'...")
        try:
            admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
            with admin_engine.connect() as conn:
                # Check if db exists
                result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname='dbms_project'"))
                if not result.scalar():
                    print("Creating database 'dbms_project'...")
                    conn.execute(text("CREATE DATABASE dbms_project"))
                    print("Database 'dbms_project' created successfully!")
                    return True
        except Exception as e:
            print(f"Failed to auto-create database: {e}")
    return False

def test_connection():
    print("Attempting to connect to the PostgreSQL database...")
    try:
        # First check if the tables can be created
        Base.metadata.create_all(bind=engine)
        print("Success! Database connection established and tables verified.")
    except Exception as e:
        error_msg = str(e)
        if "database \"dbms_project\" does not exist" in error_msg:
            # Try to auto-create the database
            if try_create_db():
                # Retry connection
                try:
                    Base.metadata.create_all(bind=engine)
                    print("Success! Database connection established and tables verified (after auto-creating the DB).")
                    return
                except Exception as retry_err:
                    print(f"\n[ERROR] Connection failed on retry: {retry_err}")
            else:
                print("\n[ERROR] Database creation failed or was bypassed.")
        else:
            print("\n[ERROR] Database connection failed!")
            print(f"Error Details: {e}")
            print("\nPlease make sure that:")
            print("1. PostgreSQL is installed and running.")
            print("2. Your credentials in 'backend/.env' match your local PostgreSQL setup.")

if __name__ == "__main__":
    test_connection()
