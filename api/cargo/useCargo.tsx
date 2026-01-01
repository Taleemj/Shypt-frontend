import client from "..";
import {
  CreateCargoDeclarationPayload,
  CreateCargoDeclarationResponse,
  DeleteCargoDeclarationResponse,
  DeleteFilePayload,
  DeleteFileResponse,
  GetCargoDeclarationResponse,
  ListCargoDeclarationsResponse,
  UpdateCargoDeclarationPayload,
  UpdateCargoDeclarationResponse,
  UploadFilesResponse,
} from "@/api/types/cargo";

const useCargo = () => {
  const listCargoDeclarations =
    async (): Promise<ListCargoDeclarationsResponse> => {
      const { data } = await client.get("/api/cargo_decleration");
      return data;
    };

  const createCargoDeclaration = async (
    payload: CreateCargoDeclarationPayload
  ): Promise<CreateCargoDeclarationResponse> => {
    const { data } = await client.post("/api/cargo_decleration", payload);
    return data;
  };

  const getCargoDeclaration = async (
    declaration_id: number | string
  ): Promise<GetCargoDeclarationResponse> => {
    const { data } = await client.get(
      `/api/cargo_decleration/${declaration_id}`
    );
    return data;
  };

  const updateCargoDeclaration = async (
    declaration_id: number | string,
    payload: UpdateCargoDeclarationPayload
  ): Promise<UpdateCargoDeclarationResponse> => {
    const { data } = await client.put(
      `/api/cargo_decleration/${declaration_id}`,
      payload
    );
    return data;
  };

  const deleteCargoDeclaration = async (
    declaration_id: number | string
  ): Promise<DeleteCargoDeclarationResponse> => {
    const { data } = await client.delete(
      `/api/cargo_declaration/${declaration_id}`
    );
    return data;
  };

  const uploadCargoDeclarationFiles = async (
    declaration_id: number | string,
    payload: FormData
  ): Promise<UploadFilesResponse> => {
    const { data } = await client.post(
      `/api/cargo_files/${declaration_id}`,
      payload
    );
    return data;
  };

  const deleteCargoDeclarationFile = async (
    declaration_id: number | string,
    payload: DeleteFilePayload
  ): Promise<DeleteFileResponse> => {
    const { data } = await client.post(
      `/api/cargo_files/${declaration_id}`,
      payload
    );
    return data;
  };

  return {
    listCargoDeclarations,
    createCargoDeclaration,
    getCargoDeclaration,
    updateCargoDeclaration,
    deleteCargoDeclaration,
    uploadCargoDeclarationFiles,
    deleteCargoDeclarationFile,
  };
};

export default useCargo;
