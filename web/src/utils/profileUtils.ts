import { getUserProfile } from "@/services/AuthService";
import { toastNotifier } from "./toastNotifier";
import { updateUserProfile } from "@/store/slices/authSlice";

export const fetchUserProfile = async (dispatch: any) => {
  try {
    const { user, error } = await getUserProfile();
    if (error) {
      toastNotifier({
        message: `Failed to fetch user profile: ${error}`,
        type: "error",
        duration: 3000,
      });
      return false;
    }

    if (user) {
      dispatch(updateUserProfile(user));
      return true;
    }

    return false;
  } catch (error: any) {
    toastNotifier({
      message: `Error updating profile: ${error.message}`,
      type: "error",
      duration: 3000,
    });
    return false;
  }
};
