import client from "..";
import {
  AuthResponse,
  ChangePasswordPayload,
  GetUserProfileResponse,
  LoginPayload,
  LoginResponse,
  SendOtpPayload,
  UpdateUserPayload,
  VerifyOtpPayload,
  RegisterPayload,
  RegisterResponse,
  AuthUser,
} from "@/api/types/auth";

const useAuth = () => {
  const logout = async (): Promise<AuthResponse> => {
    const { data } = await client.post("/api/auth/logout");
    localStorage.removeItem("token_osm");
    localStorage.removeItem("user_osm");
    return data;
  };
  const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await client.post("/api/auth/login", payload);
    return data;
  };

  const register = async (
    payload: RegisterPayload
  ): Promise<RegisterResponse> => {
    const { data } = await client.post("/api/auth/register", payload);
    return data;
  };

  const getUserProfile = async (): Promise<GetUserProfileResponse> => {
    const { data } = await client.get("/api/auth/user");
    return data;
  };

  const sendOtp = async (payload: SendOtpPayload): Promise<AuthResponse> => {
    const { data } = await client.post("/api/auth/send_otp", payload);
    return data;
  };

  const verifyOtp = async (
    payload: VerifyOtpPayload
  ): Promise<AuthResponse> => {
    const { data } = await client.post("/api/auth/verify_otp", payload);
    return data;
  };

  const changePassword = async (
    payload: ChangePasswordPayload
  ): Promise<AuthResponse> => {
    const { data } = await client.post("/api/auth/change_password", payload);
    return data;
  };

  const updateUserProfile = async (
    payload: UpdateUserPayload
  ): Promise<AuthResponse> => {
    const { data } = await client.put("/api/auth/update_user", payload);
    return data;
  };

  const fetchAllUsers = async (): Promise<{
    data: AuthUser[];
    message: string;
    status: string;
  }> => {
    const { data } = await client.get("/api/auth/all_profiles");
    return data;
  };

  const fetchCrmCustomers = async (): Promise<{
    data: {
      balance: number;
      email: string;
      phone: string;
      status: string;
    }[];
    message: string;
    status: string;
  }> => {
    const { data } = await client.get("/api/customers");
    return data;
  };
  return {
    logout,
    login,
    getUserProfile,
    updateUserProfile,
    sendOtp,
    verifyOtp,
    register,
    changePassword,
    fetchAllUsers,
    fetchCrmCustomers,
  };
};

export default useAuth;
