# Splitwise Backend (FastAPI + PostgreSQL)

This directory contains the FastAPI backend, utilizing SQLAlchemy for ORM mapping to a PostgreSQL database.

## Dependencies
- FastAPI
- Uvicorn
- SQLAlchemy
- Psycopg2-binary
- Pydantic
- Python-dotenv

## Structure
- `main.py`: FastAPI server configuration and routers.
- `database.py`: Database connection setup.
- `models.py`: SQLAlchemy database models.
- `schemas.py`: Pydantic data schemas.
- `solver.py`: Debt-simplifier logic.
