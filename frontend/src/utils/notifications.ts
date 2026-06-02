import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/services/api";

export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyError(error: unknown, fallback: string): void {
  toast.error(getApiErrorMessage(error, fallback));
}

export function notifyLoading(message: string): string {
  return toast.loading(message);
}

export function notifyUpdate(
  id: string,
  message: string,
  isError = false,
): void {
  if (isError) {
    toast.error(message, { id });
  } else {
    toast.success(message, { id });
  }
}
