import json
import os
def validInput(message):
    while True:
        try:
            value = int(input(message))
            if value > 0:
                return value
            else:
                print("Please enter a positive integer.")
        except ValueError:
            print("Invalid input. Please enter a positive integer.")

def validAmount(message):
    while True:
        try:
            value = float(input(message))
            if value > 0:
                return value
            else:
                print("Please enter a positive number.")
        except ValueError:
            print("Invalid input. Please enter a positive number.")

def people(n):
    originalNames = {}
    peo = []
    p1 = {}
    for i in range(n):
        name = input('Enter name: ')
        name1 = name.lower()
        peo.append(name1)
        originalNames[name1] = name
        p1[name1] = {}
    print('\n')
    return peo, p1, originalNames

def dataSheet(peo, p1):
    for person in peo:
        for other in peo:
            if person != other:
                p1[person][other] = 0.0
    return p1

def collect_expenses(peo, p1, originalNames, expSheet, expense_name):
    while True:
        expname = input('\nEnter the name of the expense (Press enter to return to menu): ').strip()
        if expname == '':
            break

        expamt = validAmount('Enter the expense amount: ')

        while True:
            payer = input('Enter the payer\'s name: ').lower()
            if payer in peo:
                break
            else:
                print("Invalid payer name. Please try again.")

        expSheet[expname] = {'amount': expamt, 'payer': payer, 'split_details': []}
        if expname not in expense_name:
            expense_name.append(expname)

        split_people = []
        if len(peo) != 2:
            print(f'\nSplitting expense "{expname}" of amount {expamt:.2f}')
            print(f'Payer is {originalNames[payer]}')
            split_opt = input(
                'Enter \'all\' to split among everyone (or) press enter to split among specific people: ').lower().strip()
        else:
            split_opt = 'all'

        if split_opt == 'all' or len(peo) == 2:
            split_people = peo[:]
            part = expamt / len(split_people)
            split_people.remove(payer)
        else:
            while True:
                while True:
                    person = input(
                        'Enter a person to split the expense with (Press enter to finish/move to next person): ').lower().strip()
                    if person == '':
                        break
                    elif person not in peo:
                        print(f"{person} is not in the participant list.")
                    elif person == payer:
                        print(f"{person} is the payer and cannot be added to the split list.")
                    elif person in split_people:
                        print(f"{person} has already been added.")
                    else:
                        split_people.append(person)

                    if len(split_people) == len(peo) - 1:
                        print('All participants have been added.')
                        break

                if not split_people:
                    print('You must add at least one person to split the expense with. Please try again:')
                else:
                    break

            part = expamt / (len(split_people) + 1)

        for person in split_people:
            p1[payer][person] += part
            p1[person][payer] -= part
            expSheet[expname]['split_details'].append({'name': person, 'amount': part})
            print(f"{originalNames[person]} owes {originalNames[payer]} {part:.2f}")
        print('\n' + '-' * 30 + '\n')

    return expSheet, expense_name, p1

def expense_summary(expSheet, originalNames, p1, peo):
    total_spending = sum(details['amount'] for details in expSheet.values())

    summary = '\n==================================================\n'
    summary += '               FULL EXPENSE SUMMARY               \n'
    summary += '==================================================\n'
    summary += f'TOTAL GROUP SPENDING: {total_spending:.2f}\n'
    summary += '==================================================\n'

    summary += '\n1) EXPENSE-WISE DETAILS:\n'
    summary += '-' * 50 + '\n'
    for exp, details in expSheet.items():
        summary += f'Expense: {exp}\n'
        summary += f"Amount: {details['amount']:.2f}\n"
        summary += f"Paid by: {originalNames[details['payer']]}\n"

        if len(details['split_details']) == len(originalNames) - 1:
            summary += 'Split among: All\n'
        else:
            summary += 'Split Among: '
            split_names = [originalNames[split['name']] for split in details['split_details']]
            summary += f"{originalNames[details['payer']]}," + ', '.join(split_names) + '\n'

        for split in details['split_details']:
            summary += f"    {originalNames[split['name']]} owes {originalNames[details['payer']]}: {split['amount']:.2f}\n"
        summary += '-' * 50 + '\n'

    summary += '\n2) RAW BALANCES :\n'
    summary += '-' * 50 + '\n'
    done = set()
    raw_settlements_made = False
    for person in peo:
        for other in peo:
            if person != other and (person, other) not in done:
                if p1[person][other] > 0.01:
                    summary += f"{originalNames[other]} owes {originalNames[person]} {p1[person][other]:.2f}\n"
                    raw_settlements_made = True
                elif p1[other][person] > 0.01:
                    summary += f"{originalNames[person]} owes {originalNames[other]} {p1[other][person]:.2f}\n"
                    raw_settlements_made = True
                done.add((person, other))
                done.add((other, person))
    if not raw_settlements_made:
        summary += "No debts to settle.\n"

    summary += '\n3) FINAL SIMPLIFIED BALANCES:\n'
    summary += '-' * 50 + '\n'

    net_balances = {person: 0.0 for person in peo}
    for person in peo:
        for other in peo:
            if person != other:
                net_balances[person] += p1[person][other]

    debtors = []
    creditors = []
    for person, balance in net_balances.items():
        if balance < -0.01:
            debtors.append([person, -balance])
        elif balance > 0.01:
            creditors.append([person, balance])

    debtors.sort(key=lambda x: x[1], reverse=True)
    creditors.sort(key=lambda x: x[1], reverse=True)

    settlements_made = False
    i, j = 0, 0

    while i < len(debtors) and j < len(creditors):
        debtor_name, debt_amt = debtors[i]
        creditor_name, cred_amt = creditors[j]

        settle_amt = min(debt_amt, cred_amt)
        summary += f"{originalNames[debtor_name]} owes {originalNames[creditor_name]} {settle_amt:.2f}\n"
        settlements_made = True

        debtors[i][1] -= settle_amt
        creditors[j][1] -= settle_amt

        if debtors[i][1] < 0.01:
            i += 1
        if creditors[j][1] < 0.01:
            j += 1

    if not settlements_made:
        summary += "All balances are settled. No outstanding debts remain.\n"

    summary += '==================================================\n'
    return summary

def saveToFile(final_report, default_filename):
    print("\n--- Exporting Summary ---")
    filepath = input('Enter the folder path to save the file (Press Enter to save in current folder): ').strip().strip(
        '\"').strip('\'')

    filename = f"{default_filename}_Summary.txt"

    if filepath:
        fullpath = os.path.join(filepath, filename)
    else:
        fullpath = filename

    try:
        final_path = os.path.abspath(fullpath)
        with open(final_path, 'w', encoding='utf-8') as f:
            f.write(final_report)
        print(f"\nSuccess: Summary exported to {final_path}")
    except Exception as e:
        print(f"\nError: An error occurred while saving the file: {e}")

def save_data(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Data successfully saved to {filename}")

def load_data(filename):
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    else:
        print("Error: File not found.")
        return None

try:
    print("1. Initialize New Record")
    print("2. Load Existing Record")
    choice = input("Enter choice (1/2): ").strip()

    if choice == '1':
        filename = input("Enter a name for this record file (e.g., GoaTrip): ").strip()
        if not filename.endswith('.json'):
            filename += '.json'

        n = validInput('Enter the number of people: ')
        if n <= 1:
            raise ValueError("Number of people must be a positive integer greater than 1.")

        peo, p1, originalNames = people(n)
        p1 = dataSheet(peo, p1)
        expSheet = {}
        expense_name = []

    elif choice == '2':
        json_files = [f for f in os.listdir('.') if f.endswith('.json')]

        if not json_files:
            print("\nNo saved records (.json files) found in the current directory.")
            exit()

        print("\nAvailable Records:")
        for idx, file in enumerate(json_files, 1):
            print(f"{idx}. {file.replace('.json', '')}")

        while True:
            try:
                file_choice = int(input("\nEnter the number of the record to load: "))
                if 1 <= file_choice <= len(json_files):
                    filename = json_files[file_choice - 1]
                    break
                else:
                    print("Invalid selection. Please enter a valid number from the provided list.")
            except ValueError:
                print("Invalid input. Please enter a numerical value.")

        data = load_data(filename)
        if data is None:
            exit()

        peo = data['peo']
        p1 = data['p1']
        originalNames = data['originalNames']
        expSheet = data['expSheet']
        expense_name = data['expense_name']
        print(f"\nSuccessfully loaded {filename.replace('.json', '')}.")

    else:
        print("Invalid choice.")
        exit()

    while True:
        print("\n--- MAIN MENU ---")
        print("1. Add Expenses")
        print("2. View Summary")
        print("3. Export Summary & Settle Balances")
        print("4. Save and Exit")
        opt = input("Enter choice: ").strip()

        if opt == '1':
            expSheet, expense_name, p1 = collect_expenses(peo, p1, originalNames, expSheet, expense_name)
        elif opt == '2':
            if expense_name:
                report = expense_summary(expSheet, originalNames, p1, peo)
                print(report)
            else:
                print("No expenses have been recorded yet.")
        elif opt == '3':
            if expense_name:
                report = expense_summary(expSheet, originalNames, p1, peo)
                base_filename = filename.replace('.json', '')
                saveToFile(report, base_filename)

                settle = input(
                    "\nDo you want to settle all debts and clear the expense history for this record? (yes/no): ").strip().lower()
                if settle == 'yes':
                    expSheet = {}
                    expense_name = []
                    p1 = dataSheet(peo, p1)
                    print(
                        "Status: All expenses have been cleared and balances reset to zero. The system is ready for new entries.")
            else:
                print("No expenses have been recorded yet. There is no data to export or settle.")
        elif opt == '4':
            data = {
                'peo': peo,
                'p1': p1,
                'originalNames': originalNames,
                'expSheet': expSheet,
                'expense_name': expense_name
            }
            save_data(filename, data)
            break
        else:
            print("Invalid choice. Please select a valid option from the menu.")

except ValueError as e:
    print(e)
    exit()
except Exception as e:
    print(f"An unexpected error occurred: {e}")