import axios from 'axios';
import { Platform } from 'react-native';

// Standard local IP or localhost. On Android emulator, localhost maps to 10.0.2.2.
// We handle this dynamically to ensure it runs out-of-the-box on web, simulator, or devices!
const LOCAL_IP = '127.0.0.1'; // Can be updated to your local machine IP for testing on real devices
const API_BASE_URL = Platform.select({
  android: `http://10.0.2.2:8000/api`,
  default: `http://${LOCAL_IP}:8000/api`,
});

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Group {
  id: string;
  name: string;
  created_at: string;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
  username_key: string;
}

export interface ExpenseSplit {
  id: string;
  member_id: string;
  amount: string;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: string;
  payer_id: string;
  created_at: string;
  splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  group_id: string;
  debtor_id: string;
  creditor_id: string;
  amount: string;
  created_at: string;
}

export interface MemberBalance {
  member_id: string;
  name: string;
  total_paid: string;
  total_owed: string;
  net_balance: string;
}

export interface DebtSimplified {
  debtor_id: string;
  debtor_name: string;
  creditor_id: string;
  creditor_name: string;
  amount: number;
}

export interface GroupSummary {
  group_id: string;
  group_name: string;
  total_spending: string;
  balances: MemberBalance[];
  simplified_debts: DebtSimplified[];
}

export const apiService = {
  // Group Operations
  getGroups: async (): Promise<Group[]> => {
    const res = await client.get<Group[]>('/groups');
    return res.data;
  },

  createGroup: async (name: string): Promise<Group> => {
    const res = await client.post<Group>('/groups', { name });
    return res.data;
  },

  getGroup: async (groupId: string): Promise<Group> => {
    const res = await client.get<Group>(`/groups/${groupId}`);
    return res.data;
  },

  // Member Operations
  getMembers: async (groupId: string): Promise<Member[]> => {
    const res = await client.get<Member[]>(`/groups/${groupId}/members`);
    return res.data;
  },

  addMembers: async (groupId: string, members: { name: string }[]): Promise<Member[]> => {
    const res = await client.post<Member[]>(`/groups/${groupId}/members`, members);
    return res.data;
  },

  // Expense Operations
  getExpenses: async (groupId: string): Promise<Expense[]> => {
    const res = await client.get<Expense[]>(`/groups/${groupId}/expenses`);
    return res.data;
  },

  createExpense: async (
    groupId: string,
    data: { description: string; amount: number; payer_id: string; split_member_ids: string[] }
  ): Promise<Expense> => {
    const res = await client.post<Expense>(`/groups/${groupId}/expenses`, data);
    return res.data;
  },

  // Settlement Operations
  recordSettlement: async (
    groupId: string,
    data: { debtor_id: string; creditor_id: string; amount: number }
  ): Promise<Settlement> => {
    const res = await client.post<Settlement>(`/groups/${groupId}/settlements`, data);
    return res.data;
  },

  // Analytics & Summary Operations
  getBalances: async (groupId: string): Promise<MemberBalance[]> => {
    const res = await client.get<MemberBalance[]>(`/groups/${groupId}/balances`);
    return res.data;
  },

  getSummary: async (groupId: string): Promise<GroupSummary> => {
    const res = await client.get<GroupSummary>(`/groups/${groupId}/summary`);
    return res.data;
  },

  resetGroup: async (groupId: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/groups/${groupId}/reset`);
    return res.data;
  },
};
