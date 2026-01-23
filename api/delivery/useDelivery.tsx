import client from "..";
import {
  Delivery,
  PaginatedDeliveriesResponse,
  CreateDeliveryOrderPayload,
  UpdateDeliveryOrderPayload,
  UploadSignaturePayload,
  UpdateDeliveryStatusPayload,
  MessageResponse,
  UploadPodResponse,
  UpdateDeliveryStatusResponse,
} from "../types/delivery";

const useDelivery = () => {
  const listDeliveryOrders = async (): Promise<PaginatedDeliveriesResponse> => {
    const { data } = await client.get(`/api/delivery/orders`);
    return data;
  };

  const createDeliveryOrder = async (
    payload: CreateDeliveryOrderPayload,
  ): Promise<Delivery> => {
    const { data } = await client.post(`/api/delivery/orders`, payload);
    return data;
  };

  const showDeliveryOrder = async (orderId: number): Promise<Delivery> => {
    const { data } = await client.get(`/api/delivery/orders/${orderId}`);
    return data.data;
  };

  const updateDeliveryOrder = async (
    orderId: number,
    payload: UpdateDeliveryOrderPayload,
  ): Promise<Delivery> => {
    const { data } = await client.put(
      `/api/delivery/orders/${orderId}`,
      payload,
    );
    return data;
  };

  const deleteDeliveryOrder = async (
    orderId: number,
  ): Promise<MessageResponse> => {
    const { data } = await client.delete(`/api/delivery/orders/${orderId}`);
    return data;
  };

  const uploadPodPhoto = async (
    deliveryOrderId: number,
    podPhoto: File,
  ): Promise<UploadPodResponse> => {
    const formData = new FormData();
    formData.append("pod_photo", podPhoto);

    const { data } = await client.post(
      `/api/delivery/orders/${deliveryOrderId}/upload-pod`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return data;
  };

  const uploadCustomerSignature = async (
    deliveryOrderId: number,
    payload: UploadSignaturePayload,
  ): Promise<MessageResponse> => {
    const { data } = await client.post(
      `/api/delivery/orders/${deliveryOrderId}/upload-signature`,
      payload,
    );
    return data;
  };

  const updateDeliveryOrderStatus = async (
    deliveryOrderId: number,
    payload: UpdateDeliveryStatusPayload,
  ): Promise<UpdateDeliveryStatusResponse> => {
    const { data } = await client.post(
      `/api/delivery/update-orders-status/${deliveryOrderId}`,
      payload,
    );
    return data;
  };

  const getDeliverRiders = async (): Promise<{
    message: string;
    data: { id: number; full_name: string; email: string }[];
  }> => {
    const { data } = await client.get(`/api/delivery/riders`);
    return data;
  };

  return {
    listDeliveryOrders,
    createDeliveryOrder,
    showDeliveryOrder,
    updateDeliveryOrder,
    deleteDeliveryOrder,
    uploadPodPhoto,
    uploadCustomerSignature,
    updateDeliveryOrderStatus,
    getDeliverRiders,
  };
};

export default useDelivery;
