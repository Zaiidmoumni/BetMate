import { AxiosError } from "axios";
import apiClient from "./api/apiClient";

export const fetchBetHistory = async () => {
  try {
    const storedAuth = localStorage.getItem("auth");
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;

    if (!token) {
      return {
        error: "No token found in local storage.",
      };
    }

    const response = await apiClient.get(`/bet/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    
    const data = response.data;
    return data;
  } catch (err: any) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
};
