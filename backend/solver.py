from decimal import Decimal
from uuid import UUID
from typing import Dict, List, Tuple
from schemas import DebtSimplified

def simplify_debts(member_balances: Dict[UUID, Tuple[str, Decimal]]) -> List[DebtSimplified]:
    """
    Implements the greedy debt-simplification algorithm to minimize transaction count.
    
    Args:
        member_balances: Dictionary mapping member_id to a tuple of (member_name, net_balance).
                         Positive balance means they are owed (creditor).
                         Negative balance means they owe (debtor).
                         
    Returns:
        A list of simplified transactions (DebtSimplified) representing who owes whom.
    """
    debtors = []  # List of [member_id, name, absolute_debt]
    creditors = []  # List of [member_id, name, credit]

    for member_id, (name, balance) in member_balances.items():
        if balance < Decimal("-0.01"):
            # Debtors have negative balances, convert to absolute debt
            debtors.append([member_id, name, -balance])
        elif balance > Decimal("0.01"):
            creditors.append([member_id, name, balance])

    # Sort in descending order of amounts
    debtors.sort(key=lambda x: x[2], reverse=True)
    creditors.sort(key=lambda x: x[2], reverse=True)

    simplified_transactions: List[DebtSimplified] = []
    i, j = 0, 0

    while i < len(debtors) and j < len(creditors):
        debtor_id, debtor_name, debt_amt = debtors[i]
        creditor_id, creditor_name, cred_amt = creditors[j]

        # Settle the minimum of the two amounts
        settle_amt = min(debt_amt, cred_amt)
        
        # Round to 2 decimal places to prevent float precision issues
        settle_amt = settle_amt.quantize(Decimal("0.01"))
        
        if settle_amt > Decimal("0.00"):
            simplified_transactions.append(
                DebtSimplified(
                    debtor_id=debtor_id,
                    debtor_name=debtor_name,
                    creditor_id=creditor_id,
                    creditor_name=creditor_name,
                    amount=settle_amt
                )
            )

        # Update remaining amounts
        debtors[i][2] -= settle_amt
        creditors[j][2] -= settle_amt

        # Move pointers if balance is settled
        if debtors[i][2] < Decimal("0.01"):
            i += 1
        if creditors[j][2] < Decimal("0.01"):
            j += 1

    return simplified_transactions
