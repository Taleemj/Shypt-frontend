import { AuthUser } from "@/api/types/auth";

export interface CargoApiResponse {
  status: string;
  message: string;
}

export interface Location {
  id: number;
  name: string;
  code: string;
  //...
}

export interface CargoItemPayload {
  cargo_item: string;
  value: number;
  weight: number;
}

export interface CargoDeclaration {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  warehouse_location_id: number;
  internal_curier: string;
  tracking_number: string;
  cargo_details: CargoItemPayload[]; // Changed to array of objects
  value: string | number;
  weight: string | number;
  status: "pending" | "received" | "declined" | string;
  files: string[];
  user_id: number;
  user: AuthUser;
  location: Location;
  is_insured?: boolean;
}

export interface ListCargoDeclarationsResponse extends CargoApiResponse {
  data: CargoDeclaration[];
}

export interface GetCargoDeclarationResponse extends CargoApiResponse {
  data: CargoDeclaration;
}

export interface CreateCargoDeclarationPayload {
  user_id?: number;
  warehouse_location_id?: number;
  internal_curier?: string;
  tracking_number?: string;
  cargo_details: CargoItemPayload[];
  value?: number;
  weight?: number;
  insured?: boolean;
}

export interface CreateCargoDeclarationResponse extends CargoApiResponse {
  data: CargoDeclaration;
}

export interface UpdateCargoDeclarationPayload {
  internal_curier?: string;
  tracking_number?: string;
  cargo_details?: CargoItemPayload[];
  value?: number;
  weight?: number;
  status?: "pending" | "received" | "declined" | string;
  is_insured?: boolean;
}

export interface UpdateCargoDeclarationResponse extends CargoApiResponse {
  data: CargoDeclaration;
}

export interface DeleteCargoDeclarationResponse extends CargoApiResponse {}

export interface DeleteFilePayload {
  file_name: string;
}

export interface UploadFilesResponse extends CargoApiResponse {
  data: CargoDeclaration;
}

export interface DeleteFileResponse extends CargoApiResponse {
  data: CargoDeclaration;
}
