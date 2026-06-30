import OpenAI from "openai";

export class MissingOpenAIKeyError extends Error {
  constructor() {
    super("Missing OPENAI_API_KEY.");
    this.name = "MissingOpenAIKeyError";
  }
}

export class InvalidAIJsonError extends Error {
  constructor(message = "AI returned invalid JSON.") {
    super(message);
    this.name = "InvalidAIJsonError";
  }
}

export class OpenAIRequestError extends Error {
  readonly cause: unknown;

  constructor(message = "OpenAI request failed.", cause?: unknown) {
    super(message);
    this.name = "OpenAIRequestError";
    this.cause = cause;
  }
}

export function parseOpenAIJson(content: string) {
  try {
    return JSON.parse(content) as unknown;
  } catch (error) {
    throw new InvalidAIJsonError(error instanceof Error ? error.message : undefined);
  }
}

export function getAIErrorResponse(error: unknown) {
  if (error instanceof MissingOpenAIKeyError) {
    return { message: "AI is not configured yet. Add OPENAI_API_KEY on the server.", status: 503 };
  }

  if (error instanceof InvalidAIJsonError) {
    return { message: "AI returned an invalid response.", status: 502 };
  }

  if (error instanceof OpenAIRequestError) {
    return { message: "AI service unavailable.", status: 502 };
  }

  return { message: "AI service unavailable.", status: 500 };
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new MissingOpenAIKeyError();
  }
  return new OpenAI({ apiKey });
}

export async function requestJsonFromOpenAI(prompt: string) {
  const client = getOpenAIClient();
  let response;
  try {
    response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });
  } catch (error) {
    throw new OpenAIRequestError("OpenAI request failed.", error);
  }

  const content = response.choices[0]?.message?.content;
  if (!content) throw new InvalidAIJsonError("AI returned an empty response.");
  return parseOpenAIJson(content);
}
