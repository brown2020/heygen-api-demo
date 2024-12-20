import { addErrorReport } from "@/actions/addErrorReport";
import { HeyGenFailResponse } from "@/types/heygen";
import { AxiosError } from "axios";

export async function handleErrorGeneral(errorFrom: string, errorReportCode: string, error: unknown, extraDetails: Record<string, string>, ignoreResponseCode: number[] | null = null): Promise<HeyGenFailResponse> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let errorDetails: Record<string, any> = { ...extraDetails };

  let responseCode: number = typeof error == "object" && error && "status" in error && typeof error.status == 'number' ? error.status : 0;

  // Handle known types of error
  if (error instanceof Error) {
    errorDetails = {
      ...errorDetails,
      name: error.name,
      message: error.message,
      stack: error.stack || null,
      cause: error.cause || null
    };
  } else if (error instanceof AxiosError) {
    responseCode = error.status || 0;
    errorDetails = {
      ...errorDetails,
      name: error.name,
      message: error.message,
      stack: error.stack || null,
      cause: error.cause || null,
      response: error.response?.data,
    };
  } else {
    // For unknown errors
    errorDetails = {
      ...errorDetails,
      message: errorFrom,
      raw: JSON.stringify(error), // Serialize the raw error
    };
  }

  if (ignoreResponseCode == null || !ignoreResponseCode.includes(responseCode)) {
    await addErrorReport(errorReportCode, errorDetails);
  }

  console.error(errorFrom, errorDetails, error, responseCode);

  return {
    status: false,
    error: errorFrom,
    apiStatusCode: responseCode
  };
}