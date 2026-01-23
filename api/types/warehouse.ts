export interface WareHouseLocation {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  country: string;
  code: string;
  address: string;
  manager: string;
  active: boolean;
  rack_count: number;
}

export interface WareHouseLocationsAPIResponse {
  status: string;
  message: string;
  data: WareHouseLocation[];
}

export interface WareHouseLocationAPIResponse {
  status: string;
  message: string;
  data: WareHouseLocation;
}

export interface CreateWareHouseLocationPayload {
  name: string;
  country: string;
  code: string;
  address: string;
  manager: string;
  active: boolean;
}

export interface UpdateWareHouseLocationPayload {
  name?: string;
  country?: string;
  code?: string;
  address?: string;
  manager?: string;
  active?: boolean;
}

export interface WarehouseRack {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  zone_name: string;
  bin_start: number;
  bin_end: number;
  capacity: number;
  type: string;
  warehouse_location_id: number;
  occupancy?: number;
  last_audited?: string;
}

export interface WarehouseRacksAPIResponse {
  status: string;
  message: string;
  data: WarehouseRack[];
}

export interface WarehouseRackAPIResponse {
  status: string;
  message: string;
  data: WarehouseRack;
}

export interface CreateWarehouseRackPayload {
  zone_name: string;
  bin_start: number;
  bin_end: number;
  capacity: number;
  type: string;
  warehouse_location_id: number;
}

export interface UpdateWarehouseRackPayload {
  zone_name?: string;
  bin_start?: number;
  bin_end?: number;
  capacity?: number;
  type?: string;
  warehouse_location_id?: number;
  warehouseRack_id?: number;
}

export interface DeleteWarehouseRackPayload {
  warehouseRack_id: number;
}

