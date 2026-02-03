import client from "..";
import {
  PaginatedExpensesResponse,
  ExpenseResponse,
  ExpenseCategoryResponse,
  SingleExpenseCategoryResponse,
  MessageResponse,
  CreateExpensePayload,
  UpdateExpensePayload,
  CreateExpenseCategoryPayload,
  UpdateExpenseCategoryPayload,
} from "../types/expenses";

const useExpenses = () => {
  // === Expenses ===
  const listExpenses = async (page = 1): Promise<PaginatedExpensesResponse> => {
    const { data } = await client.get(
      `/api/expenditures/expenses?page=${page}`,
    );
    return data;
  };

  const getExpense = async (id: number): Promise<ExpenseResponse> => {
    const { data } = await client.get(`/api/exp/expenses/${id}`);
    return data;
  };

  const createExpense = async (
    payload: CreateExpensePayload,
  ): Promise<ExpenseResponse> => {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      // @ts-ignore
      formData.append(key, payload[key]);
    });

    const { data } = await client.post("/api/expenditures/expenses", payload);
    return data;
  };

  const updateExpense = async (
    id: number,
    payload: UpdateExpensePayload,
  ): Promise<ExpenseResponse> => {
    const { data } = await client.put(
      `/api/expenditures/expenses/${id}`,
      payload,
    );
    return data;
  };

  const deleteExpense = async (id: number): Promise<MessageResponse> => {
    const { data } = await client.delete(`/api/expenditures/expenses/${id}`);
    return data;
  };

  // === Expense Categories ===
  const listExpenseCategories = async (): Promise<ExpenseCategoryResponse> => {
    const { data } = await client.get("/api/expenditures/category");
    return data;
  };

  const createExpenseCategory = async (
    payload: CreateExpenseCategoryPayload,
  ): Promise<SingleExpenseCategoryResponse> => {
    const { data } = await client.post("/api/expenditures/category", payload);
    return data;
  };

  const updateExpenseCategory = async (
    id: number,
    payload: UpdateExpenseCategoryPayload,
  ): Promise<SingleExpenseCategoryResponse> => {
    const { data } = await client.put(
      `/api/expenditures/category/${id}`,
      payload,
    );
    return data;
  };

  const deleteExpenseCategory = async (
    id: number,
  ): Promise<MessageResponse> => {
    const { data } = await client.delete(`/api/expenditures/category/${id}`);
    return data;
  };

  return {
    // Expenses
    listExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    // Expense Categories
    listExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
  };
};

export default useExpenses;
