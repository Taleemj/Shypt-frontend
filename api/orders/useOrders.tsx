import client from "..";
import {
  Order,
  OrdersResponse,
  PlaceOrderPayload,
  UpdateOrderStatusPayload,
} from "../types/orders";

const useOrders = () => {
  const getOrders = async () => {
    const { data } = await client.get<OrdersResponse>("/api/orders");
    return data;
  };

  const placeOrder = async (payload: PlaceOrderPayload) => {
    const { data } = await client.post<{ status: string; message: string }>(
      "/api/orders",
      payload
    );
    return data;
  };

  const getOrder = async (id: number) => {
    const { data } = await client.get<{ status: string; data: Order }>(
      `/api/orders/${id}`
    );
    return data;
  };

  const updateOrder = async (id: number, payload: PlaceOrderPayload) => {
    const { data } = await client.put<{ status: string; message: string }>(
      `/api/orders/${id}`,
      payload
    );
    return data;
  };

  const deleteOrder = async (id: number) => {
    const { data } = await client.delete<{ status: string; message: string }>(
      `/api/orders/${id}`
    );
    return data;
  };

  const updateOrderStatus = async (payload: UpdateOrderStatusPayload) => {
    const { data } = await client.post<{ status: string; message: string }>(
      `/api/order_status_hisory`,
      payload
    );
    return data;
  };

  const deleteOrderStatusHistory = async (id: number) => {
    const { data } = await client.delete<{ status: string; message: string }>(
      `/api/order_status_hisory/${id}`
    );
    return data;
  };
  return {
    getOrders,
    placeOrder,
    getOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    deleteOrderStatusHistory,
  };
};

export default useOrders;
