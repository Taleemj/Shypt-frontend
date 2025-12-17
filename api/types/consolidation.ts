import { Order } from "./orders";
import { Package } from "./package";
import { AuthUser } from "./auth";

export interface ConsolidationPackagePivot {
  batch_id: number;
  package_id: number;
  created_at: string;
  updated_at: string;
}

export interface ConsolidationPackage extends Package {
  pivot: ConsolidationPackagePivot;
  order: Order;
}

export interface Consolidation {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  mawb_number: string;
  transport_mode: string; // Consider making this an enum if values are fixed
  container_flight_number: string;
  departure_date: string;
  status: string; // Consider making this an enum if values are fixed
  package_count: number;
  total_weight: string; // Keeping as string due to "0.00" format in example
  created_by: number;
  finalized_at: string;
  departed_at: string;
  arrived_at: string;
  packages: ConsolidationPackage[];
}

