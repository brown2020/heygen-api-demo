import { describe, expect, it } from "vitest";

import { axiosErrorSummary } from "@/libs/axios-error";

describe("axiosErrorSummary", () => {
  it("omits request headers such as the API key", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed",
      config: { headers: { "x-api-key": "SECRETKEY" } },
      response: { status: 401, data: { message: "bad key" } },
      toJSON() {
        return this;
      },
    };
    const summary = axiosErrorSummary(error);
    expect(summary).toContain("status=401");
    expect(summary).toContain("bad key");
    expect(summary).not.toContain("SECRETKEY");
    expect(summary).not.toContain("x-api-key");
  });
});
