
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/localStorage';
import { Budget, Transaction, Goal, FinancialData } from '@/types/budget';
import { toast } from 'sonner';

// Sample colors for categories
export const CATEGORY_COLORS: Record<string, string> = {
  'Housing': '#3b82f6', // Blue
  'Food': '#22c55e', // Green
  'Transportation': '#f59e0b', // Amber
  'Entertainment': '#8b5cf6', // Purple
  'Shopping': '#ec4899', // Pink
  'Utilities': '#06b6d4', // Cyan
  'Healthcare': '#ef4444', // Red
  'Personal': '#64748b', // Slate
  'Education': '#0ea5e9', // Sky blue
  'Travel': '#84cc16', // Lime
  'Debt': '#d97706', // Amber dark
  'Savings': '#059669', // Emerald
  'Income': '#10b981', // Green
  'Other': '#6b7280', // Gray
};

// Default categories
export const DEFAULT_CATEGORIES = Object.keys(CATEGORY_COLORS);

// Sample mock data
const defaultBudgets: Budget[] = [
  {
    id: '1',
    category: 'Housing',
    amount: 1500,
    spent: 1200,
    period: 'monthly',
    color: CATEGORY_COLORS['Housing'],
  },
  {
    id: '2',
    category: 'Food',
    amount: 500,
    spent: 450,
    period: 'monthly',
    color: CATEGORY_COLORS['Food'],
  },
  {
    id: '3',
    category: 'Transportation',
    amount: 300,
    spent: 280,
    period: 'monthly',
    color: CATEGORY_COLORS['Transportation'],
  },
];

const defaultTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Grocery shopping',
    amount: 85.75,
    category: 'Food',
    date: '2025-04-15',
    type: 'expense',
  },
  {
    id: '2',
    description: 'Monthly salary',
    amount: 3000,
    category: 'Income',
    date: '2025-04-01',
    type: 'income',
  },
  {
    id: '3',
    description: 'Electric bill',
    amount: 120,
    category: 'Utilities',
    date: '2025-04-10',
    type: 'expense',
  },
];

const defaultGoals: Goal[] = [
  {
    id: '1',
    title: 'Vacation Fund',
    targetAmount: 2000,
    currentAmount: 500,
    deadline: '2025-08-01',
    category: 'Travel',
    color: CATEGORY_COLORS['Travel'],
  },
  {
    id: '2',
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 3500,
    deadline: '2025-12-31',
    category: 'Savings',
    color: CATEGORY_COLORS['Savings'],
  },
];

// Initial state
const initialFinancialData: FinancialData = {
  budgets: [],
  transactions: [],
  goals: [],
};

// Context type
interface FinancialContextType {
  financialData: FinancialData;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  resetToMockData: () => void;
}

// Create context
const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Provider component
export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [financialData, setFinancialData] = useState<FinancialData>(initialFinancialData);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedData = loadFromLocalStorage<FinancialData>('financialData', {
      budgets: defaultBudgets,
      transactions: defaultTransactions,
      goals: defaultGoals,
    });
    setFinancialData(storedData);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage('financialData', financialData);
  }, [financialData]);

  // Budget functions
  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: uuidv4(),
    };
    setFinancialData((prev) => ({
      ...prev,
      budgets: [...prev.budgets, newBudget],
    }));
    toast.success('Budget added successfully');
  };

  const updateBudget = (budget: Budget) => {
    setFinancialData((prev) => ({
      ...prev,
      budgets: prev.budgets.map((b) => (b.id === budget.id ? budget : b)),
    }));
    toast.success('Budget updated successfully');
  };

  const deleteBudget = (id: string) => {
    setFinancialData((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
    toast.success('Budget deleted successfully');
  };

  // Transaction functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
    };
    setFinancialData((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction],
    }));
    toast.success('Transaction added successfully');
  };

  const updateTransaction = (transaction: Transaction) => {
    setFinancialData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === transaction.id ? transaction : t)),
    }));
    toast.success('Transaction updated successfully');
  };

  const deleteTransaction = (id: string) => {
    setFinancialData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
    toast.success('Transaction deleted successfully');
  };

  // Goal functions
  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goal,
      id: uuidv4(),
    };
    setFinancialData((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
    toast.success('Goal added successfully');
  };

  const updateGoal = (goal: Goal) => {
    setFinancialData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goal.id ? goal : g)),
    }));
    toast.success('Goal updated successfully');
  };

  const deleteGoal = (id: string) => {
    setFinancialData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
    toast.success('Goal deleted successfully');
  };

  // Reset to mock data function
  const resetToMockData = () => {
    setFinancialData({
      budgets: defaultBudgets,
      transactions: defaultTransactions,
      goals: defaultGoals,
    });
    toast.success('Reset to default data successfully');
  };

  return (
    <FinancialContext.Provider
      value={{
        financialData,
        addBudget,
        updateBudget,
        deleteBudget,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGoal,
        updateGoal,
        deleteGoal,
        resetToMockData,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

// Hook for using the financial context
export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
