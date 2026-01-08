import { AuthUser } from "./auth";
import { Order } from "./orders";

export interface LineItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  method: string;
  assisted_shopping_id: number | null;
  invoice: Invoice;
  assisted_Shopping: {};
  transaction_reference: string | null;
  gateway_reference: string | null;
  status: "COMPLETED" | "PENDING" | "FAILED" | null;
  paid_at: string;
  user: AuthUser;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  user_id: number;
  order_id: number | null;
  type: string;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  currency: string;
  order: Order | null;
  user?: AuthUser;
  line_items: LineItem[];
  payments: Payment[];
}

export interface PaginatedInvoicesResponse {
  data: Invoice[];
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
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
  total: number;
  per_page: number;
  from: number;
  last_page: number;
}

export interface CreateInvoicePayload {
  type: string;
  order_id?: number;
  due_date?: string; // YYYY-MM-DD
  user_id: number;
  currency: string;
}

export interface UpdateInvoicePayload {
  type?: string;
  status?: string;
  due_date?: string; // YYYY-MM-DD
}

export interface AddItemToInvoicePayload {
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface UpdateInvoiceItemPayload {
  description?: string;
  quantity?: number;
  unit_price?: number;
}

export interface RecordPaymentPayload {
  invoice_id?: number;
  assisted_shopping_id?: number;
  amount: number;
  method: "MOBILE_MONEY" | "CARD" | "BANK_TRANSFER" | "CASH";
  paid_at?: string; // YYYY-MM-DD HH:MM:SS
  transaction_reference?: string;
  gateway_reference?: string;
  status?: "PENDING" | "COMPLETED" | "FAILED";
}

export interface MessageResponse {
  message: string;
}
