export interface AuthResponse {
  status: string;
  message: string;
}

export interface SendOtpPayload {
  validation_text: string;
}

export interface VerifyOtpPayload {
  validation_text: string;
  otp: string;
}

export interface ChangePasswordPayload {
  password: string;
  password_confirmation: string;
  user_id: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation?: string;
  tin?: string;
  address?: string;
  passport?: string;
}

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  email_verified_at: string | null;
  tin: string;
  passport: string;
  address: string;
  otp: string;
  status: string;
  user_type: "super_user" | "user" | "staff";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LoginResponse extends AuthResponse {
  authorization: {
    token: string;
    token_type: string;
  };
  data: AuthUser;
}

export interface RegisterResponse extends AuthResponse {
  status: string;
  message: string;
  data: AuthUser;
}

export interface GetUserProfileResponse extends AuthResponse {
  data: AuthUser;
}

export interface UpdateUserPayload {
  phone: string;
  full_name: string;
  tin: string;
  passport: string;
  address: string;
}
