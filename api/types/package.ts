export interface Package {
  order_id: number;
  hwb_number: string;
  contents: string;
  declared_value: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  is_fragile: boolean;
  is_hazardous: boolean;
  is_damaged: boolean;
  package_photos?: string[];
  location_id: string;
  received_at: string;
  updated_at: string;
  created_at: string;
  id: number;
}

export interface AddPackageToOrderResponse {
  status: string;
  message: string;
  data: Package;
}
