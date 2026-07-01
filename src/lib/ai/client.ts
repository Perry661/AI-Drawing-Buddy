import type { CritiqueResponse, DemonstrationResponse, MatrixRequest, Suggestion } from "./schemas";

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "AI request failed.");
  }
  return data as TResponse;
}

export function requestCritique(input: MatrixRequest) {
  return postJson<CritiqueResponse>("/api/critique", input);
}

export function requestDemonstration(input: MatrixRequest, suggestion: Suggestion) {
  return postJson<DemonstrationResponse>("/api/demonstrate", { ...input, suggestion });
}
