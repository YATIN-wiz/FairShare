from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

# Base config to support SQLAlchemy model reading
class TunedModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Group Schemas
class GroupCreate(BaseModel):
    name: str

class GroupResponse(TunedModel):
    id: UUID
    name: str
    created_at: datetime


# Member Schemas
class MemberCreate(BaseModel):
    name: str

class MemberResponse(TunedModel):
    id: UUID
    group_id: UUID
    name: str
    username_key: str


# Expense Split Schemas
class ExpenseSplitResponse(TunedModel):
    id: UUID
    member_id: UUID
    amount: Decimal


# Expense Schemas
class ExpenseCreate(BaseModel):
    description: str
    amount: Decimal
    payer_id: UUID
    split_member_ids: List[UUID]  # List of members sharing the cost

class ExpenseResponse(TunedModel):
    id: UUID
    group_id: UUID
    description: str
    amount: Decimal
    payer_id: UUID
    created_at: datetime
    splits: List[ExpenseSplitResponse]


# Settlement Schemas
class SettlementCreate(BaseModel):
    debtor_id: UUID
    creditor_id: UUID
    amount: Decimal

class SettlementResponse(TunedModel):
    id: UUID
    group_id: UUID
    debtor_id: UUID
    creditor_id: UUID
    amount: Decimal
    created_at: datetime


# Balance and Debt Analytics Schemas
class MemberBalance(TunedModel):
    member_id: UUID
    name: str
    total_paid: Decimal
    total_owed: Decimal
    net_balance: Decimal

class DebtSimplified(BaseModel):
    debtor_id: UUID
    debtor_name: str
    creditor_id: UUID
    creditor_name: str
    amount: Decimal

class GroupSummary(BaseModel):
    group_id: UUID
    group_name: str
    total_spending: Decimal
    balances: List[MemberBalance]
    simplified_debts: List[DebtSimplified]
