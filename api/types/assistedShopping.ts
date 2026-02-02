// Based on the user's API specification and response examples.

// This is based on the 'user' object in the GET /api/assisted_shopping response
export interface AssistedShoppingUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  tin: string | null;
  passport: string | null;
  address: string;
  status: string;
  user_type: string; // e.g. "super_user"
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Quote for an assisted shopping item, from quote endpoints
export interface AssistedShoppingQuote {
  id: number;
  created_at?: string;
  updated_at?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  assisted_shopping_id: number;
}

// Main Assisted Shopping Item structure
export interface AssistedShoppingItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  url: string;
  quantity: number;
  status: "requested" | "quoted" | "paid" | "declined" | "purchased";
  notes: string;
  user_id: number;
  user: AssistedShoppingUser;
  quote_items?: AssistedShoppingQuote[]; // Quotes might be part of the detailed view
  retailer_ref?: string;
  carrier?: string;
  tracking_ref?: string;
  length?: number;
  width?: number;
  height?: number;
}

// Generic paginated response structure for lists
export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// Response for GET /api/assisted_shopping
export interface AssistedShoppingListResponse {
  message: string;
  data: PaginatedResponse<AssistedShoppingItem>;
}

// Response for GET /api/assisted_shopping/{id}
export interface AssistedShoppingResponse {
  message: string;
  data: AssistedShoppingItem;
}

// Payload for POST /api/assisted_shopping for a single item (existing use-case)
export interface AddAssistedShoppingPayload {
  name: string;
  url: string;
  quantity: number;
  notes: string;
}

// Payload for individual items within a multi-item request
export interface AddAssistedShoppingItemPayload {
  name: string;
  url: string;
  quantity: number;
  notes: string;
}

// Payload for POST /api/assisted_shopping (new multi-item request structure)
export interface AddAssistedShoppingRequestPayload {
  insured: boolean;
  shipping_mode: string;
  items: AddAssistedShoppingItemPayload[];
  name: string;
  url: string;
  quantity: number;
  notes: string;
}

// Simplified response data for add/update operations
interface AssistedShoppingModificationData {
  name: string;
  url: string;
  notes: string;
  user_id: number;
  updated_at: string;
  created_at: string;
  id: number;
}

// Response for POST /api/assisted_shopping
export interface AddAssistedShoppingResponse {
  message: string;
  data: AssistedShoppingModificationData;
}

// Payload for PUT /api/assisted_shopping/{id}
export interface UpdateAssistedShoppingPayload {
  name: string;
  url: string;
  quantity: number;
  status: "requested" | "quoted" | "paid" | "declined" | "purchased";
  notes: string;
  retailer_ref?: string;
  carrier?: string;
  tracking_ref?: string;
  length?: number;
  width?: number;
  height?: number;
}

// Response for PUT /api/assisted_shopping/{id}
export interface UpdateAssistedShoppingResponse {
  message: string;
  data: AssistedShoppingModificationData;
}

// Payload for POST /api/assisted_shopping_quote
export interface AddAssistedShoppingQuotePayload {
  item_name: string;
  quantity: number;
  unit_price: number;
  assisted_shopping_id: number;
}

// Payload for PUT /api/assisted_shopping_quote/{id}
export interface UpdateAssistedShoppingQuotePayload {
  item_name: string;
  quantity: number;
  unit_price: number;
  assisted_shopping_id: number;
}

// Response for quote actions is described as "similar to get single assisted shopping request"
// This implies it returns the parent item, potentially updated.
export interface AssistedShoppingQuoteActionResponse {
  message: string;
  data: AssistedShoppingItem;
}

// Response for DELETE /api/assisted_shopping_quote/{id}
export interface DeleteAssistedShoppingQuoteResponse {
  message: string;
}
