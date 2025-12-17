import client from "..";
import { Consolidation } from "../types/consolidation";

const useConsolidation = () => {
  const getConsolidationBatches = async () => {
    const { data: response } = await client.get<Consolidation[]>(
      `/api/consolidation-batches`
    );
    return response;
  };

  const getConsolidationBatch = async (id: number) => {
    const { data: response } = await client.get<Consolidation>(
      `/api/consolidation-batches/${id}`
    );
    return response;
  };

  const createConsolidationBatch = async (data: Partial<Consolidation>) => {
    const { data: response } = await client.post<{
      message: string;
      data: Consolidation;
    }>(`/api/consolidation-batches`, data);
    return response;
  };

  const updateConsolidationBatch = async (
    id: number,
    data: Partial<Consolidation>
  ) => {
    const { data: response } = await client.put<{
      message: string;
      data: Consolidation;
    }>(`/api/consolidation-batches/${id}`, data);
    return response;
  };

  const deleteConsolidationBatch = async (id: number) => {
    const { data: response } = await client.delete<{
      status: string;
      message: string;
    }>(`/api/consolidation-batches/${id}`);
    return response;
  };

  return {
    getConsolidationBatches,
    getConsolidationBatch,
    createConsolidationBatch,
    updateConsolidationBatch,
    deleteConsolidationBatch,
  };
};

export default useConsolidation;
