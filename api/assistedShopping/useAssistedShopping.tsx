import client from "..";
import {
  AssistedShoppingListResponse,
  AddAssistedShoppingRequestPayload, // Changed from AddAssistedShoppingPayload
  AddAssistedShoppingResponse,
  AssistedShoppingResponse,
  UpdateAssistedShoppingPayload,
  UpdateAssistedShoppingResponse,
  AddAssistedShoppingQuotePayload,
  UpdateAssistedShoppingQuotePayload,
  AssistedShoppingQuoteActionResponse,
  DeleteAssistedShoppingQuoteResponse,
} from "@/api/types/assistedShopping";

const useAssistedShopping = () => {
  const listAssistedShoppingRequests =
    async (): Promise<AssistedShoppingListResponse> => {
      const { data } = await client.get("/api/assisted_shopping");
      return data;
    };

  const addAssistedShopping = async (
    payload: AddAssistedShoppingRequestPayload // Changed from AddAssistedShoppingPayload
  ): Promise<AddAssistedShoppingResponse> => {
    const { data } = await client.post("/api/assisted_shopping", payload);
    return data;
  };

  const getAssistedShopping = async (
    id: number
  ): Promise<AssistedShoppingResponse> => {
    const { data } = await client.get(`/api/assisted_shopping/${id}`);
    return data;
  };

  const updateAssistedShopping = async (
    id: number,
    payload: UpdateAssistedShoppingPayload
  ): Promise<UpdateAssistedShoppingResponse> => {
    const { data } = await client.put(`/api/assisted_shopping/${id}`, payload);
    return data;
  };

  const addAssistedShoppingQuote = async (
    payload: AddAssistedShoppingQuotePayload
  ): Promise<AssistedShoppingQuoteActionResponse> => {
    const { data } = await client.post("/api/assisted_shopping_quote", payload);
    return data;
  };

  const updateAssistedShoppingQuote = async (
    id: number,
    payload: UpdateAssistedShoppingQuotePayload
  ): Promise<AssistedShoppingQuoteActionResponse> => {
    const { data } = await client.put(
      `/api/assisted_shopping_quote/${id}`,
      payload
    );
    return data;
  };

  const deleteAssistedShoppingQuote = async (
    id: number
  ): Promise<DeleteAssistedShoppingQuoteResponse> => {
    const { data } = await client.delete(`/api/assisted_shopping_quote/${id}`);
    return data;
  };

  return {
    listAssistedShoppingRequests,
    addAssistedShopping,
    getAssistedShopping,
    updateAssistedShopping,
    addAssistedShoppingQuote,
    updateAssistedShoppingQuote,
    deleteAssistedShoppingQuote,
  };
};

export default useAssistedShopping;
