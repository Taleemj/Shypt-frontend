import client from "..";
import { Order, OrdersResponse } from "../types/orders";

const useOrders = () => {
  const getOrders = async () => {
    const { data } = await client.get<OrdersResponse>("/api/orders");
    return data;
  };

  const placeOrder = async (payload: {
    origin_country: string;
    receiver_name: string;
    receiver_phone: string;
    receiver_email: string;
    receiver_address: string;
  }) => {
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

  const updateOrder = async (
    id: number,
    payload: {
      origin_country: string;
      receiver_name: string;
      receiver_phone: string;
      receiver_email: string;
      receiver_address: string;
    }
  ) => {
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

  const updateOrderStatus = async (payload: {
    order_id: number;
    status: string;
    notes: string;
    user_id: number;
    location: string;
  }) => {
    const { data } = await client.post<{ status: string; message: string }>(
      `/api/orders_status_hisory`,
      payload
    );
    return data;
  };

  const deleteOrderStatusHistory = async (id: number) => {
    const { data } = await client.delete<{ status: string; message: string }>(
      `/api/orders_status_hisory/${id}`
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
