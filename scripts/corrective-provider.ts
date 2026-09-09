import {
  classifyProviderError,
  GenerationBudget,
  OpenAICompatibleProvider,
  providerProtocolFor,
  safeProviderErrorCode,
} from "../packages/ai/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function response(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function jsonBody(init: RequestInit | undefined) {
  need(typeof init?.body === "string", "request_body_missing");
  return JSON.parse(init.body);
}
function header(init: RequestInit | undefined, name: string) {
  return new Headers(init?.headers).get(name);
}

async function main() {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const chatFetch: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return response({
      model: "glm-5.2",
      choices: [{ message: { content: JSON.stringify({ ok: true }) } }],
      usage: { prompt_tokens: 11, completion_tokens: 7 },
    });
  };
  const chat = new OpenAICompatibleProvider({
    apiKey: "fixture-key",
    model: "glm-5.2",
    baseUrl: "https://opencode.ai/zen/go/v1",
  }, chatFetch);
  const chatResult = await chat.generateJson({ system: "system", prompt: "prompt" });
  const chatRequest = requests[0];
  const chatBody = jsonBody(chatRequest?.init);
  need(providerProtocolFor("glm-5.2", "https://opencode.ai/zen/go/v1") === "chat_completions", "chat_protocol_missing");
  need(chat.protocol === "chat_completions", "chat_provider_protocol_missing");
  need(chatRequest?.url.endsWith("/chat/completions"), "chat_endpoint_invalid");
  need(/^[0-9a-f-]{36}$/.test(header(chatRequest?.init, "x-opencode-session") ?? ""), "chat_session_header_missing");
  need(chatBody.response_format?.type === "json_object", "chat_json_contract_missing");
  need(chatResult.data && (chatResult.data as { ok?: boolean }).ok === true, "chat_response_contract_invalid");
  need(chatResult.usage?.inputTokens === 11 && chatResult.usage.outputTokens === 7, "chat_usage_invalid");

  requests.length = 0;
  const responsesFetch: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return response({
      model: "gpt-5.6-luna",
      output_text: JSON.stringify({ ok: true, protocol: "responses" }),
      usage: { input_tokens: 13, output_tokens: 9 },
    });
  };
  const responsesProvider = new OpenAICompatibleProvider({
    apiKey: "fixture-key",
    model: "gpt-5.6-luna",
    baseUrl: "https://opencode.ai/zen/go/v1",
  }, responsesFetch);
  const responsesResult = await responsesProvider.generateJson({ system: "system", prompt: "prompt" });
  const responsesRequest = requests[0];
  const responsesBody = jsonBody(responsesRequest?.init);
  need(providerProtocolFor("gpt-5.6-luna", "https://opencode.ai/zen/go/v1") === "responses", "responses_protocol_missing");
  need(responsesProvider.protocol === "responses", "responses_provider_protocol_missing");
  need(responsesRequest?.url.endsWith("/responses"), "responses_endpoint_invalid");
  need(/^[0-9a-f-]{36}$/.test(header(responsesRequest?.init, "x-opencode-session") ?? ""), "responses_session_header_missing");
  need(responsesBody.instructions.includes("json") && responsesBody.input.includes("json"), "responses_input_contract_invalid");
  need(responsesBody.response_format === undefined, "responses_chat_field_leaked");
  need(responsesBody.text?.format?.type === "json_object", "responses_json_contract_missing");
  need((responsesResult.data as { protocol?: string }).protocol === "responses", "responses_output_contract_invalid");
  need(responsesResult.usage?.inputTokens === 13 && responsesResult.usage.outputTokens === 9, "responses_usage_invalid");

  const badRequestProvider = new OpenAICompatibleProvider({
    apiKey: "fixture-key",
    model: "gpt-5.6-luna",
    baseUrl: "https://opencode.ai/zen/go/v1",
  }, async () => response({ error: { message: "secret-provider-detail" } }, 400));
  let badRequestError: unknown;
  try {
    await badRequestProvider.generateJson({ system: "system", prompt: "prompt" });
  } catch (error) {
    badRequestError = error;
  }
  need(badRequestError instanceof Error && badRequestError.message === "ai_provider_http_400", "http_400_not_classified");
  need(!String(badRequestError).includes("secret-provider-detail"), "http_body_leaked");
  need(classifyProviderError(badRequestError) === "http_client", "http_400_failure_class_invalid");
  need(safeProviderErrorCode(badRequestError) === "ai_provider_http_400", "http_400_safe_code_invalid");

  const timeoutProvider = new OpenAICompatibleProvider({
    apiKey: "fixture-key",
    model: "gpt-5.6-luna",
    baseUrl: "https://opencode.ai/zen/go/v1",
  }, async (_url, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  }));
  let timeoutError: unknown;
  try {
    await timeoutProvider.generateJson({ system: "system", prompt: "prompt", timeoutMs: 5 });
  } catch (error) {
    timeoutError = error;
  }
  need(timeoutError instanceof Error && timeoutError.message === "ai_provider_timeout", "timeout_not_classified");
  need(classifyProviderError(timeoutError) === "timeout", "timeout_failure_class_invalid");

  let now = 10_000;
  const queuedBudget = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    startedAt: 10_000,
    now: () => now,
  });
  now = 16_000;
  need(queuedBudget.elapsedMs === 6_000, "queue_wait_not_counted");
  need(queuedBudget.remainingAiMs === 12_000, "queue_wait_ai_budget_invalid");
  need(queuedBudget.clampTimeoutMs(18_000) === 12_000, "provider_timeout_not_clamped_to_queue_budget");
  now = 28_001;
  need(queuedBudget.isExpired(), "deadline_expiry_not_enforced");
  need(classifyProviderError(new Error("ai_budget_exhausted")) === "budget", "budget_failure_class_invalid");

  console.log("PROVIDER_PROTOCOL_RESPONSES=PASS");
  console.log("PROVIDER_PROTOCOL_CHAT=PASS");
  console.log("HTTP_400_CLASSIFICATION=PASS");
  console.log("TIMEOUT_CLASSIFICATION=PASS");
  console.log("QUEUE_WAIT_DEADLINE=PASS");
  console.log("SAFE_ERROR_PAYLOAD=PASS");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "corrective_provider_failed");
  process.exitCode = 1;
});
