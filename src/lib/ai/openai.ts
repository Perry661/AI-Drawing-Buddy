import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AI is not configured yet. Add OPENAI_API_KEY on the server.");
  }
  return new OpenAI({ apiKey });
}

export async function requestJsonFromOpenAI(prompt: string) {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response.");
  return JSON.parse(content) as unknown;
}
