import { AuthUser } from "./auth";

export interface Order {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tracking_number: string;
  user_id: number;
  origin_country: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string;
  receiver_address: string;
  status: string;
  received_at: string | null;
  dispatched_at: string | null;
  arrived_at: string | null;
  released_at: string | null;
  delivered_at: string | null;
  status_history: {
    id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    order_id: number;
    status: string;
    notes: string;
    location: string;
    user_id: number;
    user: AuthUser;
  }[];
  user: AuthUser;
}

export interface OrdersResponse {
  status: string;
  data: {
    current_page: number;
    data: Order[];
  };
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string;
  path: string;
  per_page: number;
  prev_page_url: string;
  to: number;
  total: number;
  links: {
    url: string;
    label: string;
    active: boolean;
  };
}
