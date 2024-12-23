import { addErrorReport } from "@/actions/addErrorReport";
import { HeyGenFailResponse } from "@/types/heygen";
import { AxiosError } from "axios";

export async function handleHeyGenError(errorFrom: string, errorReportCode: string, error: unknown, extraDetails: Record<string, string>, ignoreResponseCode: number[] | null = null): Promise<HeyGenFailResponse> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let errorDetails: Record<string, any> = { ...extraDetails };

  let responseCode: number = typeof error == "object" && error && "status" in error && typeof error.status == 'number' ? error.status : 0;

  let ignoreErrorReport = false;
  let displayMessage = '';

  // Handle known types of error
  if (error instanceof AxiosError) {
    responseCode = error.status || 0;

    const errorResponse = error.response?.data;
    if (responseCode === 401) {
      ignoreErrorReport = true;
      displayMessage = "Invalid HeyGen API Key";
    } else if (errorReportCode === "uploadTalkingPhoto" && typeof errorResponse == 'object' && "code" in errorResponse) {
      if("message" in errorResponse){
        displayMessage = errorResponse.message;
        ignoreErrorReport = true;
      }
      if(errorResponse.code === 40001){
        displayMessage = "Upload image not found.";
      }
    }

    errorDetails = {
      ...errorDetails,
      name: error.name,
      message: error.message,
      stack: error.stack || null,
      cause: error.cause || null,
      response: error.response?.data,
    };


  } else if (error instanceof Error) {
    errorDetails = {
      ...errorDetails,
      name: error.name,
      message: error.message,
      stack: error.stack || null,
      cause: error.cause || null
    };
  } else {
    // For unknown errors
    errorDetails = {
      ...errorDetails,
      message: errorFrom,
      raw: JSON.stringify(error), // Serialize the raw error
    };
  }

  if (
    (ignoreErrorReport ||
      (ignoreResponseCode != null && ignoreResponseCode.includes(responseCode)))
  ) { } else {
    await addErrorReport(errorReportCode, errorDetails);
  }

  console.error(errorFrom, errorDetails, error, responseCode);

  return {
    status: false,
    error: errorFrom,
    apiStatusCode: responseCode,
    displayMessage
  };
}