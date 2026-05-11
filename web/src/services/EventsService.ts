import { AxiosError } from "axios";
import apiClient from "./api/apiClient";

export const fetchMatches = async () => {
  try {
    const response = await apiClient.get("/events");
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

export const fetchLeagues = async () => {
  try {
    const response = await apiClient.get("/events/leagues");
    return response.data;
  } catch (err: any) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
}
