# 💸 Splitwise Expense Sharing Application (DBMS Project)

A complete full-stack expense sharing and debt simplification application. This repository contains three main components:
1. **Console-based CLI App (`main.py`)**: A standalone terminal utility that uses local JSON files to store, load, and calculate split summaries.
2. **FastAPI Backend (`backend/`)**: A robust REST API backed by a PostgreSQL database utilizing SQLAlchemy ORM and an automatic schema generator.
3. **React Native / Expo Frontend (`frontend/`)**: A modern cross-platform mobile and web client that communicates with the FastAPI backend.

---

## 🏗️ Project Architecture & Data Flow

```mermaid
graph TD
    %% CLI Path
    CLI[Console CLI main.py] -->|Saves/Loads| JSON[(Local .json Records)]
    
    %% Full-Stack Path
    subgraph Frontend [Mobile/Web Client]
        Expo[Expo / React Native App]
        ExpoRouter[Expo Router File Routing]
        Axios[Axios API Client]
        Expo --> ExpoRouter
        ExpoRouter --> Axios
    end

    subgraph Backend [REST API Engine]
        FastAPI[FastAPI Server]
        Solver[Debt Solver Algorithm]
        SQLAlchemy[SQLAlchemy ORM]
        FastAPI --> Solver
        FastAPI --> SQLAlchemy
    end

    subgraph Database [Storage Layer]
        Postgres[(PostgreSQL Database)]
    end

    Axios <-->|HTTP REST Requests| FastAPI
    SQLAlchemy <-->|Read/Write| Postgres
```

---

## ⚡ Quick Start: Running the Components

Choose one of the interfaces below to get started:

### Option A: The Console CLI Application (Quickest)
Run the project completely in your terminal without any database or web servers!
- **Features:** Supports creating new records, loading existing records from local `.json` files, recording expenses, dividing splits equally, generating summaries, and exporting final simplified debt settlements.
- **Run Command:**
  ```bash
  python main.py
  ```

### Option B: The Complete Full-Stack Web/Mobile Application
Run the robust backend REST API and connection-ready Expo frontend:
- **Backend Port:** `8000` (FastAPI + Swagger Docs)
- **Frontend App:** Expo web/native interfaces

---

## 🛡️ Component 1: CLI Application Setup & Commands

The CLI operates out of the workspace root and reads/writes `.json` database files to the same directory.

### Running the CLI
1. Open a terminal in the root directory: `d:\Dbms_project`
2. Run the application:
   ```bash
   python main.py
   ```
3. **Workflow Options:**
   - **Initialize New Record:** Enter a record name (e.g., `GoaTrip`), specify the number of participants, and key in their names.
   - **Load Existing Record:** Automatically lists all saved `.json` records in the directory to let you resume active entries.
   - **Add Expenses:** Prompts for the expense details, who paid, and splits it automatically (either among everyone or a specified subgroup).
   - **View Summary:** Displays real-time expense-wise logs, raw balances, and simplified final settlements.
   - **Export Summary:** Saves the transaction logs and settles up all balances back to zero.

---

## ⚙️ Component 2: FastAPI Backend Setup

The backend features a fully modeled relational schema in PostgreSQL, auto-generating the tables upon server startup.

### Pre-requisites & Setup
1. **Activate Virtual Environment:**
   From the root directory:
   ```powershell
   # PowerShell (Windows)
   venv\Scripts\Activate.ps1
   
   # Command Prompt (Windows)
   venv\Scripts\activate.bat
   ```
2. **Install Dependencies:**
   Navigate to the backend directory and run:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. **Database Configuration:**
   Create a `.env` file in the `backend/` folder (an example config is already set up):
   ```env
   DATABASE_URL=postgresql://postgres:yatin06@localhost:5432/dbms_project
   ```
   *Replace the credentials above with your local PostgreSQL server configuration.*

4. **Verify Connection & Auto-Create Database:**
   We have included a database utility script that tests the connection, checks credentials, and **automatically creates the PostgreSQL database (`dbms_project`)** if it doesn't already exist.
   ```bash
   python test_db.py
   ```

5. **Start the FastAPI Server:**
   Launch the development server with Hot Reloading enabled:
   ```bash
   uvicorn main:app --reload
   ```
   - **API Base URL:** `http://localhost:8000`
   - **Interactive API Documentation:** `http://127.0.0.1:8000/docs` (Swagger UI) or `http://127.0.0.1:8000/redoc`

---

## 📱 Component 3: Expo React Native Frontend Setup

The frontend app runs seamlessly on web browsers, mobile emulators, or real devices via Expo Go.

### Setup & Launch Commands
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. **Install Package Dependencies:**
   ```bash
   npm install
   ```
3. **Run on Web Browser:**
   ```bash
   npm run web
   ```
4. **Run via Expo Developer Console (for emulators or iOS/Android devices):**
   ```bash
   npx expo start
   ```
   *Scan the generated QR code on screen using your phone's camera (iOS) or the Expo Go App (Android) to test on a real device.*

### 🔗 Dynamic API Bridge Resolution
In `frontend/src/services/api.ts`, the application automatically resolves the backend address based on the target platform:
- **Web / iOS Simulator:** Binds to localhost: `http://127.0.0.1:8000/api`
- **Android Emulator:** Map-redirects to local host loopback: `http://10.0.2.2:8000/api`
- **Real Devices:** Update `LOCAL_IP` in `frontend/src/services/api.ts` to your machine's local network IP (e.g. `192.168.x.x`) to access the backend server over Wi-Fi.

---

## 🧮 Debt Simplification Algorithm

The CLI program and backend endpoints utilize a greedy **Debt Simplification Algorithm** that minimizes the total transaction count from a possible $O(N^2)$ complex matrix down to at most $N-1$ transfers.

```mermaid
flowchart TD
    A[Collect raw balance offsets for all members] --> B[Calculate NET balance for each person]
    B --> C{Is Net Balance zero?}
    C -->|Yes| D[Exempt from transaction queue]
    C -->|No| E[Split members into Debtors & Creditors]
    E --> F[Sort both lists by absolute amount descending]
    F --> G[Match largest Debtor with largest Creditor]
    G --> H[Transfer minimum of debtor-due and creditor-owed]
    H --> I[Update lists & repeat match until all settled]
```

### Example:
- **Raw offset transactions:** 
  - Alice owes Bob \$10
  - Bob owes Charlie \$10
- **Simplified settlement:**
  - Alice owes Charlie \$10 (Bob is completely bypassed, saving one bank transfer!).

---

## 📂 Workspace Folder Index

```
Dbms_project/
├── backend/                  # FastAPI Application Engine
│   ├── .env                  # Environment configurations (Port, DB URL)
│   ├── database.py           # SQLAlchemy Connection Engine
│   ├── main.py               # REST Routers & Entrypoint 
│   ├── models.py             # ORM Declarative Models (Groups, Members, Splits)
│   ├── requirements.txt      # Python Backend dependencies
│   ├── schemas.py            # Pydantic Schemas for validation
│   ├── solver.py             # Greedy Debt-Simplification Solver
│   └── test_db.py            # Database auto-creation and connection verification
├── frontend/                 # Expo Frontend Project
│   ├── src/                  # App components & routing pages
│   │   ├── app/              # File-based view routing pages
│   │   ├── components/       # Visual components 
│   │   └── services/api.ts   # Axios API client requests & IP resolution
│   ├── package.json          # Node packages & scripts
│   └── app.json              # Expo application manifest configuration
├── main.py                   # Root local CLI Terminal application
└── venv/                     # Python 3 Virtual Environment
```
