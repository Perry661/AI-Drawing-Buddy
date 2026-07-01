import type { CritiqueResponse, DemonstrationResponse, MatrixRequest, Suggestion } from "./schemas";

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("AI request failed.");
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : "AI request failed.";
    throw new Error(message);
  }

  return data as TResponse;
}

export function requestCritique(input: MatrixRequest) {
  return postJson<CritiqueResponse>("/api/critique", input);
}

export function requestDemonstration(input: MatrixRequest, suggestion: Suggestion) {
  return postJson<DemonstrationResponse>("/api/demonstrate", { ...input, suggestion });
}
