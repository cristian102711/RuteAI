export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const successResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (error: string, message?: string): ApiResponse<null> => ({
  success: false,
  message,
  error,
});
