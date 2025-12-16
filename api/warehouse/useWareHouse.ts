import client from "..";
import {
  WareHousesAPIResponse,
  CreateWareHousePayload,
  UpdateWareHousePayload,
} from "../types/warehouse";

const useWareHouse = () => {
  const fetchWareHouses = async (): Promise<WareHousesAPIResponse> => {
    const { data } = await client.get("/api/settings/locations");
    return data;
  };

  const createWareHouse = async (
    payload: CreateWareHousePayload
  ): Promise<WareHousesAPIResponse> => {
    const { data } = await client.post("/api/settings/locations", payload);
    return data;
  };

  const updateWareHouse = async (
    id: number,
    payload: UpdateWareHousePayload
  ): Promise<WareHousesAPIResponse> => {
    const { data } = await client.put(`/api/settings/locations/${id}`, payload);
    return data;
  };

  const deleteWareHouse = async (id: number): Promise<WareHousesAPIResponse> => {
    const { data } = await client.delete(`/api/settings/locations/${id}`);
    return data;
  };
  return { fetchWareHouses, createWareHouse, updateWareHouse, deleteWareHouse };
};

export default useWareHouse;

