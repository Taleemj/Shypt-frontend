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
    const { data } = await client.put("/api/auth/user", payload);
    return data;
  };
  return {
    logout,
    login,
    getUserProfile,
    updateUserProfile,
    sendOtp,
    verifyOtp,
    changePassword,
  };
};

export default useAuth;
