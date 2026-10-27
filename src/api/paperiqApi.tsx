import axios, { type InternalAxiosRequestConfig } from "axios";

// In production the React build is served by Django, so a relative path works.
// In development, vite.config.ts proxies /api to the Django dev server.
// Optionally override via VITE_API_BASE_URL at build time.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api";

// ✅ Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Share one refresh across concurrent requests, then replay each upload once.
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshInFlight: Promise<string> | null = null;
const isAuthRequest = (url = "") => /\/auth\/(login|register|refresh)\//.test(url);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && !isAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryConfig | undefined;
    if (error.response?.status !== 401 || !original || isAuthRequest(original.url)) {
      return Promise.reject(error);
    }
    const refresh = localStorage.getItem("refreshToken");
    if (refresh && !original._retry) {
      original._retry = true;
      try {
        if (!refreshInFlight) {
          refreshInFlight = api.post("/auth/refresh/", { refresh })
            .then(({ data }) => {
              localStorage.setItem("accessToken", data.access);
              if (data.refresh) localStorage.setItem("refreshToken", data.refresh);
              return data.access as string;
            })
            .finally(() => { refreshInFlight = null; });
        }
        const access = await refreshInFlight;
        original.headers.Authorization = `Bearer ${access}`;
        return api.request(original);
      } catch (refreshError) {
        // Preserve the session on a temporary network/server failure.
        if (!axios.isAxiosError(refreshError) ||
            ![400, 401].includes(refreshError.response?.status ?? 0)) {
          return Promise.reject(refreshError);
        }
      }
    }
    logoutUser();
    window.location.assign("/login");
    return Promise.reject(error);
  }
);

//
// ======================== AUTH APIs ========================
//

// ✅ Register user
export const registerUser = async (name: string, email: string, password: string) => {
  const response = await api.post("/auth/register/", { name, email, password });
  return response.data;
};

// ✅ Login user and store token
export const loginUser = async (email: string, password: string) => {
  const response = await api.post("/auth/login/", { email, password });
  const { access, refresh, user } = response.data;

  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
  localStorage.setItem("user", JSON.stringify(user));

  return user;
};

// ✅ Get logged-in user
export const getCurrentUser = async () => {
  const token = localStorage.getItem("accessToken");
  const response = await api.get("/auth/user/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ✅ Logout
export const logoutUser = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

//
// ======================== DOCUMENT APIs ========================
//

// ✅ Ingest document
export const ingestFile = async (file: File) => {
  if (!file) throw new Error("No file provided");
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("accessToken");
  const response = await api.post("/ingest/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// ✅ Preprocess text
export const preprocessText = async (text: string) => {
  if (!text) throw new Error("No text provided");
  const formData = new FormData();
  formData.append("text", text);

  const token = localStorage.getItem("accessToken");
  const response = await api.post("/preprocess/", formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ✅ Extract insights
export const extractInsights = async (text: string) => {
  if (!text) throw new Error("No text provided");
  const formData = new FormData();
  formData.append("text", text);

  const token = localStorage.getItem("accessToken");
  const response = await api.post("/extract/", formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ✅ Summarize file
export const summarizeFile = async (file: File) => {
  if (!file) throw new Error("No file provided");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user?.id) throw new Error("User not logged in");

  const token = localStorage.getItem("accessToken");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", user.id);

  const response = await api.post("/summarize/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
