const API_BASE = "http://localhost:8000/api";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | Record<string, string[]> | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  role: "doctor" | "patient";
  first_name?: string;
  last_name?: string;
  specialty?: string;
  bio?: string;
  phone?: string;
  date_of_birth?: string;
}

interface AuthResult {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    role: string;
  };
}

interface UserResult {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_approved: boolean;
  is_blocked: boolean;
  email_verified: boolean;
  doctor_profile?: {
    specialty: string;
    bio: string;
    phone: string;
    photo_url: string;
  } | null;
  patient_profile?: {
    phone: string;
    date_of_birth: string | null;
    emergency_contact: string;
  } | null;
}

export async function loginApi(
  data: LoginData
): Promise<ApiResponse<AuthResult>> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function registerApi(
  data: RegisterData
): Promise<ApiResponse<AuthResult>> {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function refreshTokenApi(
  refresh: string
): Promise<{ access: string }> {
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  return res.json();
}

export async function verifyEmailApi(
  uidb64: string,
  token: string
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(
    `${API_BASE}/auth/verify-email/${uidb64}/${token}/`
  );
  return res.json();
}

export async function meApi(
  token: string
): Promise<ApiResponse<UserResult>> {
  const res = await fetch(`${API_BASE}/auth/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
