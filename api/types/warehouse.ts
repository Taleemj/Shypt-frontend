export interface WareHouse {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  country: string;
  code: string;
  zone: string;
  rack: string;
  bay: string;
  shelf: string;
  is_occupied: 0 | 1;
}

export interface WareHousesAPIResponse {
  status: string;
  message: string;
  data: WareHouse[];
}

export interface CreateWareHousePayload {
  name: string;
  country: string;
  code: string;
  zone: string;
  rack: string;
  bay: string;
  shelf: string;
  is_occupied?: 0 | 1; // Optional, as it might default
}

export interface UpdateWareHousePayload {
  name?: string;
  country?: string;
  code?: string;
  zone?: string;
  rack?: string;
  bay?: string;
  shelf?: string;
  is_occupied?: 0 | 1;
}

