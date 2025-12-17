import client from "..";
import { Package, AddPackageToOrderResponse } from "../types/package";

const usePackage = () => {
  const addPackageToOrder = async (order_id: number, data: Package) => {
    const { data: response } = await client.post<AddPackageToOrderResponse>(
      `/api/orders/${order_id}/packages`,
      data
    );
    return response;
  };
  const updateOrderPackage = async (order_id: number, data: Package) => {
    const { data: response } = await client.put<AddPackageToOrderResponse>(
      `/api/orders/${order_id}/packages`,
      data
    );
    return response;
  };

  const deletePackage = async (package_id: number) => {
    const { data: response } = await client.delete<{
      status: string;
      message: string;
    }>(`/api/packages/${package_id}`);
    return response;
  };
  const addPackageImages = async (packageId: number, formData: FormData) => {
    const { data: response } = await client.post(
      `/api/packages/${packageId}/package-photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  };

  const deletePackageImages = async (packageId: number, image: string) => {
    const { data: response } = await client.delete(
      `/api/packages/${packageId}/package-photos`,
      {
        // @ts-ignore
        photo: image,
      }
    );
    return response;
  };

  return {
    addPackageToOrder,
    updateOrderPackage,
    deletePackage,
    addPackageImages,
    deletePackageImages,
  };
};

export default usePackage;
