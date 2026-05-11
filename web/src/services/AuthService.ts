import { AxiosError } from "axios";
import apiClient from "./api/apiClient";

export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  } catch (err: any) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
};

export const registerUser = async (credentials: {
  email: string;
  name: string;
  password: string;
}) => {
  try {
    const response = await apiClient.post("/auth/register", credentials);
    return response.data;
  } catch (err: any) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
};

export const verifyEmail = async (token: string) => {
  try {
    const response = await apiClient.get("/auth/verify", {
      params: {
        token,
      },
    });
    return response.data;
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  } catch (err: any) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
};

export const resetPassword = async (token: string, password: string) => {
  try {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  } catch (err: any) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
};

export const getUserProfile = async () => {
  try {
    const storedAuth = localStorage.getItem('auth');
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;
      
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await apiClient.get('/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });


    return { user: response.data, error: null };
  } catch (err: any) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
};
