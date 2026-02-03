export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: number;
  date: string;
  expense_category_id: number;
  particular: string;
  unit_price: number;
  // vendor: string;
  // paid_by: string;
  // status: "PAID" | "PENDING" | "REJECTED";
  // notes?: string;
  // linked_manifest?: string;
  // receipt_url?: string;
  // created_at?: string;
  // updated_at?: string;
  // category?: ExpenseCategory;
}

// API Response Types
export interface PaginatedExpensesResponse {
  data: Expense[];
  // Assuming a laravel-style paginator response
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ExpenseResponse {
  data: Expense;
  message?: string;
}

export interface ExpenseCategoryResponse {
  data: ExpenseCategory[];
  message?: string;
}

export interface SingleExpenseCategoryResponse {
  data: ExpenseCategory;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

// Payload Types
export interface CreateExpensePayload {
  date: string;
  category_id: number;
  description: string;
  amount: number;
  vendor: string;
  status: "PAID" | "PENDING";
  notes?: string;
  linked_manifest?: string;
  receipt?: File;
}

export interface UpdateExpensePayload {
  date?: string;
  category_id?: number;
  description?: string;
  amount?: number;
  vendor?: string;
  status?: "PAID" | "PENDING" | "REJECTED";
  notes?: string;
  linked_manifest?: string;
  receipt?: File;
}

export interface CreateExpenseCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateExpenseCategoryPayload {
  name?: string;
  description?: string;
}
