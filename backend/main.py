from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from decimal import Decimal

from database import engine, Base, get_db
import models, schemas
from solver import simplify_debts

# Create Database tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Splitwise DBMS API",
    description="Backend API for Splitwise Expense Sharing with PostgreSQL integration",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to Splitwise DBMS Backend API!"}


# ----------------------------------------------------
# GROUP ENDPOINTS
# ----------------------------------------------------

@app.post("/api/groups", response_model=schemas.GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    db_group = models.Group(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group


@app.get("/api/groups", response_model=List[schemas.GroupResponse])
def get_groups(db: Session = Depends(get_db)):
    return db.query(models.Group).all()


@app.get("/api/groups/{group_id}", response_model=schemas.GroupResponse)
def get_group(group_id: UUID, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group


@app.delete("/api/groups/{group_id}")
def delete_group(group_id: UUID, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db.delete(db_group)
    db.commit()
    return {"message": "Group successfully deleted"}



# ----------------------------------------------------
# MEMBER ENDPOINTS
# ----------------------------------------------------

@app.post("/api/groups/{group_id}/members", response_model=List[schemas.MemberResponse], status_code=status.HTTP_201_CREATED)
def add_members(group_id: UUID, members: List[schemas.MemberCreate], db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    added_members = []
    for member in members:
        username_key = member.name.strip().lower()
        if not username_key:
            continue
            
        # Check if member already exists in the group to avoid duplicates
        existing = db.query(models.Member).filter(
            models.Member.group_id == group_id,
            models.Member.username_key == username_key
        ).first()

        if not existing:
            new_member = models.Member(
                group_id=group_id,
                name=member.name.strip(),
                username_key=username_key
            )
            db.add(new_member)
            added_members.append(new_member)
            
    db.commit()
    
    # Return all members of the group
    return db.query(models.Member).filter(models.Member.group_id == group_id).all()


@app.get("/api/groups/{group_id}/members", response_model=List[schemas.MemberResponse])
def get_members(group_id: UUID, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return db.query(models.Member).filter(models.Member.group_id == group_id).all()


# ----------------------------------------------------
# EXPENSE ENDPOINTS
# ----------------------------------------------------

@app.post("/api/groups/{group_id}/expenses", response_model=schemas.ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(group_id: UUID, expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Validate payer
    payer = db.query(models.Member).filter(models.Member.id == expense.payer_id, models.Member.group_id == group_id).first()
    if not payer:
        raise HTTPException(status_code=400, detail="Invalid payer_id for this group")

    if not expense.split_member_ids:
        raise HTTPException(status_code=400, detail="Must split with at least one person")

    # Validate split members
    for mid in expense.split_member_ids:
        exists = db.query(models.Member).filter(models.Member.id == mid, models.Member.group_id == group_id).first()
        if not exists:
            raise HTTPException(status_code=400, detail=f"Member ID {mid} not found in this group")

    # Create primary expense
    db_expense = models.Expense(
        group_id=group_id,
        description=expense.description,
        amount=expense.amount,
        payer_id=expense.payer_id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    # Calculate splits equally
    # Splitting amount equally among list of selected participants
    split_count = len(expense.split_member_ids)
    split_share = expense.amount / Decimal(split_count)
    
    # Round split share to 2 decimal places
    split_share = split_share.quantize(Decimal("0.01"))

    # Add split entries to database
    for mid in expense.split_member_ids:
        db_split = models.ExpenseSplit(
            expense_id=db_expense.id,
            member_id=mid,
            amount=split_share
        )
        db.add(db_split)

    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.get("/api/groups/{group_id}/expenses", response_model=List[schemas.ExpenseResponse])
def get_expenses(group_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Expense).filter(models.Expense.group_id == group_id).order_by(models.Expense.created_at.desc()).all()


@app.get("/api/groups/{group_id}/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def get_expense(group_id: UUID, expense_id: UUID, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.group_id == group_id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense


@app.put("/api/groups/{group_id}/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(group_id: UUID, expense_id: UUID, expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.group_id == group_id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Validate payer
    payer = db.query(models.Member).filter(models.Member.id == expense.payer_id, models.Member.group_id == group_id).first()
    if not payer:
        raise HTTPException(status_code=400, detail="Invalid payer_id for this group")

    if not expense.split_member_ids:
        raise HTTPException(status_code=400, detail="Must split with at least one person")

    # Validate split members
    for mid in expense.split_member_ids:
        exists = db.query(models.Member).filter(models.Member.id == mid, models.Member.group_id == group_id).first()
        if not exists:
            raise HTTPException(status_code=400, detail=f"Member ID {mid} not found in this group")

    # Update primary expense details
    db_expense.description = expense.description
    db_expense.amount = expense.amount
    db_expense.payer_id = expense.payer_id
    
    # Remove existing split entries
    db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense_id).delete(synchronize_session=False)

    # Calculate splits equally
    split_count = len(expense.split_member_ids)
    split_share = expense.amount / Decimal(split_count)
    
    # Round split share to 2 decimal places
    split_share = split_share.quantize(Decimal("0.01"))

    # Add new split entries
    for mid in expense.split_member_ids:
        db_split = models.ExpenseSplit(
            expense_id=db_expense.id,
            member_id=mid,
            amount=split_share
        )
        db.add(db_split)

    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.delete("/api/groups/{group_id}/expenses/{expense_id}")
def delete_expense(group_id: UUID, expense_id: UUID, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.group_id == group_id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense successfully deleted"}



# ----------------------------------------------------
# SETTLEMENT ENDPOINTS
# ----------------------------------------------------

@app.post("/api/groups/{group_id}/settlements", response_model=schemas.SettlementResponse, status_code=status.HTTP_201_CREATED)
def record_settlement(group_id: UUID, settlement: schemas.SettlementCreate, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Validate members
    debtor = db.query(models.Member).filter(models.Member.id == settlement.debtor_id, models.Member.group_id == group_id).first()
    creditor = db.query(models.Member).filter(models.Member.id == settlement.creditor_id, models.Member.group_id == group_id).first()
    
    if not debtor or not creditor:
        raise HTTPException(status_code=400, detail="Invalid debtor or creditor ID")

    db_settlement = models.Settlement(
        group_id=group_id,
        debtor_id=settlement.debtor_id,
        creditor_id=settlement.creditor_id,
        amount=settlement.amount
    )
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement


# ----------------------------------------------------
# ANALYTICS & DEBT SOLVER ENDPOINTS
# ----------------------------------------------------

@app.get("/api/groups/{group_id}/balances", response_model=List[schemas.MemberBalance])
def get_balances(group_id: UUID, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    balances = []

    for member in members:
        # 1. Total amount this member paid for expenses
        total_paid = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
            models.Expense.payer_id == member.id,
            models.Expense.group_id == group_id
        ).scalar() or Decimal("0.0")

        # 2. Total amount this member owes from expense splits
        total_owed = db.query(func.coalesce(func.sum(models.ExpenseSplit.amount), 0)).join(
            models.Expense
        ).filter(
            models.ExpenseSplit.member_id == member.id,
            models.Expense.group_id == group_id
        ).scalar() or Decimal("0.0")

        # 3. Settlements paid by this member (reducing their net debt)
        settlements_paid = db.query(func.coalesce(func.sum(models.Settlement.amount), 0)).filter(
            models.Settlement.debtor_id == member.id,
            models.Settlement.group_id == group_id
        ).scalar() or Decimal("0.0")

        # 4. Settlements received by this member (reducing their net credit)
        settlements_received = db.query(func.coalesce(func.sum(models.Settlement.amount), 0)).filter(
            models.Settlement.creditor_id == member.id,
            models.Settlement.group_id == group_id
        ).scalar() or Decimal("0.0")

        # Net balance calculation:
        # Net Balance = Paid Expenses - Owed Splits + Settlements Paid - Settlements Received
        net_balance = total_paid - total_owed + settlements_paid - settlements_received

        balances.append(
            schemas.MemberBalance(
                member_id=member.id,
                name=member.name,
                total_paid=total_paid,
                total_owed=total_owed,
                net_balance=net_balance
            )
        )

    return balances


@app.get("/api/groups/{group_id}/summary", response_model=schemas.GroupSummary)
def get_group_summary(group_id: UUID, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Get total group spending
    total_spending = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).filter(
        models.Expense.group_id == group_id
    ).scalar() or Decimal("0.0")

    # Get member balances
    balances = get_balances(group_id, db)

    # Solve / simplify debts
    member_balances_dict = {}
    for bal in balances:
        member_balances_dict[bal.member_id] = (bal.name, bal.net_balance)

    simplified_debts = simplify_debts(member_balances_dict)

    return schemas.GroupSummary(
        group_id=group_id,
        group_name=db_group.name,
        total_spending=total_spending,
        balances=balances,
        simplified_debts=simplified_debts
    )


@app.post("/api/groups/{group_id}/reset")
def reset_group_balances(group_id: UUID, db: Session = Depends(get_db)):
    """
    Clears all expense, split and settlement history associated with a group,
    resetting all debts back to zero. Same as the "Settle and Settle Balances" clear behavior in main.py.
    """
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Delete all settlements in group
    db.query(models.Settlement).filter(models.Settlement.group_id == group_id).delete(synchronize_session=False)

    # Delete all expenses in group (which cascades and deletes expense_splits as well)
    db.query(models.Expense).filter(models.Expense.group_id == group_id).delete(synchronize_session=False)

    db.commit()
    return {"message": "All expenses, splits, and settlements have been successfully cleared and balances reset."}
