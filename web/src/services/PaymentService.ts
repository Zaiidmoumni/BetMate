import { AxiosError } from "axios";
import apiClient from "./api/apiClient";

export const getHistory = async () => {
  try {
    const storedAuth = localStorage.getItem("auth");
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.get("/payment/history", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export const deposit = async (amount: number, paymentMethod: string) => {
  try {
    const storedAuth = localStorage.getItem("auth");
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.post(
      "/payment/deposit",
      {
        amount,
        paymentMethod,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

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

export const verifyPayment = async (transactionId?: string) => {
  try {
    const storedAuth = localStorage.getItem("auth");
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.get(`/payment/verify/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export const withdraw = async (amount: number, withdrawalMethod: string) => {
  try {
    const storedAuth = localStorage.getItem("auth");
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.post(
      "/payment/withdraw",
      {
        amount,
        withdrawalMethod,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data
  } catch (err: any) {
    if (err instanceof AxiosError) {
      console.error("Axios Error: ", err.response?.data || err.message);
    } else {
      console.error("Unknown Error: ", err);
    }
    throw err;
  }
};

// Fetch all transactions (admin only)
export const getAllTransactions = async () => {
  try {
    const storedAuth = localStorage.getItem("auth");
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.get("/payment/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("All transactions:", response.data[0]);
    
    return response.data;
  } catch (err) {
    console.error("Error fetching transactions:", err);
    throw err;
  }
};

// Process a withdrawal (admin only)
export const processWithdrawal = async (transactionId: string) => {
  try {
    const storedAuth = localStorage.getItem("auth");
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.post(`/payment/withdraw/process/${transactionId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error processing withdrawal:", err);
    throw err;
  }
};

// Cancel a withdrawal
export const cancelWithdrawal = async (transactionId: string) => {
  try {
    const storedAuth = localStorage.getItem("auth");
    const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.post(`/payment/withdraw/cancel/${transactionId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error cancelling withdrawal:", err);
    throw err;
  }
};
