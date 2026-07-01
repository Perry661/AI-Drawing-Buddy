import {
  parseCritiqueResponse,
  parseDemonstrationResponse,
  type CritiqueResponse,
  type DemonstrationResponse,
  type MatrixRequest,
  type Suggestion,
} from "./schemas";

function getErrorMessage(data: unknown) {
  if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return "AI request failed.";
}

async function postJson<TResponse>(
  url: string,
  body: unknown,
  parseResponse: (data: unknown) => TResponse,
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("AI request failed.");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("AI request failed.");
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  try {
    return parseResponse(data);
  } catch {
    throw new Error("AI request failed.");
  }
}

export function requestCritique(input: MatrixRequest) {
  return postJson<CritiqueResponse>("/api/critique", input, (data) =>
    parseCritiqueResponse(input.width, input.height, data),
  );
}

export function requestDemonstration(input: MatrixRequest, suggestion: Suggestion) {
  return postJson<DemonstrationResponse>("/api/demonstrate", { ...input, suggestion }, (data) =>
    parseDemonstrationResponse(input.width, input.height, data),
  );
}
