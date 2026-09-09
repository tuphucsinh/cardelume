import { readFileSync } from "node:fs";
import {
  DEFAULT_GENERATION_DEADLINE_MS,
  DEFAULT_FALLBACK_RESERVE_MS,
  MAX_GENERATION_DEADLINE_MS,
  defaultGenerationDeadlineMs,
  defaultFallbackReserveMs,
  GenerationBudget,
  createGenerationBudget,
  generateCreativeDirectorDirections,
  criticRepairDirections,
  buildDeterministicCreativeFallback,
  type AIProvider,
  type AIProviderResponse,
} from "../packages/ai/src/index.ts";
import {
  portfolioV2AllTemplates,
  templateArchetype,
  type RankedTemplate,
  type TemplateMeta,
} from "../packages/templates/src/index.ts";
import { GenerationResultSchema, type GenerationBrief, type GenerationResult } from "../packages/card-schema/src/index.ts";

function need(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}

const fixtureBrief: GenerationBrief = {
  locale: "en-US",
  format: "portrait-5x7",
  hasPhoto: false,
  market: "US",
  feeling: "Elegant",
  occasion: "Birthday",
  relationship: "Friend",
  recipient: "Alex",
  detail: "",
};

function makeApprovedClone(src: TemplateMeta): TemplateMeta {
  return { ...src, status: "active", health: "healthy", launchStatus: "approved" };
}

const srcEditorial = portfolioV2AllTemplates.find(t => t.slug === "luxury-editorial")!;
const srcMidnight = portfolioV2AllTemplates.find(t => t.slug === "midnight-lume")!;
const srcQuiet = portfolioV2AllTemplates.find(t => t.slug === "classic-letterpress")!;
need(srcEditorial && srcMidnight && srcQuiet, "fixture_sources_missing");

const approvedEditorial = makeApprovedClone(srcEditorial);
const approvedMidnight = makeApprovedClone(srcMidnight);
const approvedQuiet = makeApprovedClone(srcQuiet);

function ranked(t: TemplateMeta): RankedTemplate {
  return {
    template: t,
    score: 0.9,
    baseScore: 0.9,
    marketScore: 0.8,
    reasons: ["fixture"],
    components: {
      relevance: 0.9,
      market: 0.8,
      editorial: 0.9,
      performance: 0.8,
      textFit: 1,
      freshness: 0.7,
      photoFit: 1,
      noveltyPenalty: 0,
    },
  };
}

const approvedTripleNoPhoto: RankedTemplate[] = [
  ranked(approvedEditorial),
  ranked(approvedMidnight),
  ranked(approvedQuiet),
];

function validProviderPayload(candidates: RankedTemplate[], brief: GenerationBrief, wowScore = 0.86) {
  const slots = brief.hasPhoto
    ? (["editorial", "midnight", "photo"] as const)
    : (["editorial", "midnight", "quiet"] as const);
  return {
    action: "select" as const,
    directions: slots.map(slot => {
      const arch = slot === "photo" ? "photo" : slot === "midnight" ? "midnight" : slot === "quiet" ? "quiet" : "editorial";
      const c = candidates.find(x => templateArchetype(x.template) === arch) ?? candidates[0];
      return {
        id: slot,
        templateId: c.template.id,
        templateVersionId: c.template.versionId,
        creativeThesis: "A refined expression crafted with precision for this exact moment in time.",
        customerRationale: "A quiet, considered fit for this day.",
        signatureMove: "recipient_anchor",
        accentMode: "original",
        kicker: "FOR THIS MOMENT",
        headline: "Something beautiful, just for you.",
        body: "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be.",
        confidence: 0.92,
        noveltyScore: 0.84,
        wowScore,
        riskCodes: [] as string[],
      };
    }),
  };
}

function makeValidResult(candidates: RankedTemplate[], brief: GenerationBrief, wowScore = 0.86): GenerationResult {
  const raw = validProviderPayload(candidates, brief, wowScore);
  return GenerationResultSchema.parse({
    directions: raw.directions.map(d => {
      const c = candidates.find(x => x.template.id === d.templateId) ?? candidates[0];
      return {
        ...d,
        templateName: c.template.name,
        visualDirection: c.template.visualDirection,
        photoMode: c.template.photoMode,
      };
    }),
  });
}

type ControllableProvider = AIProvider & {
  getCallCount(): number;
  getLastTimeoutMs(): number | undefined;
};

function makeControllableDelayedProvider(
  stepFn: (callIndex: number, timeoutMs?: number) => { data: unknown; simulatedDelayMs: number },
  advanceClock: (ms: number) => void
): ControllableProvider {
  let callCount = 0;
  let lastTimeoutMs: number | undefined;

  return {
    providerName: "delayed-fake",
    modelName: "delayed-model",
    async generateJson(input: { system: string; prompt: string; timeoutMs?: number }): Promise<AIProviderResponse> {
      callCount++;
      lastTimeoutMs = input.timeoutMs;
      const effectiveTimeout = input.timeoutMs ?? 12_000;
      const step = stepFn(callCount, input.timeoutMs);
      if (step.simulatedDelayMs > effectiveTimeout) {
        advanceClock(effectiveTimeout);
        throw new Error("ai_provider_timeout");
      }
      advanceClock(step.simulatedDelayMs);
      return {
        data: step.data,
        provider: "delayed-fake",
        model: "delayed-model",
        usage: { inputTokens: 50, outputTokens: 50 },
        latencyMs: step.simulatedDelayMs,
      };
    },
    getCallCount() {
      return callCount;
    },
    getLastTimeoutMs() {
      return lastTimeoutMs;
    },
  };
}

async function main() {
  const passMarkers: string[] = [];

  // ── 1. BUDGET_BOUNDS_AND_DEFAULTS ──────────────────────────────────────────
  need(DEFAULT_GENERATION_DEADLINE_MS === 20_000, "default_deadline_must_be_20s");
  need(DEFAULT_FALLBACK_RESERVE_MS === 2_000, "default_fallback_reserve_must_be_2s");
  need(MAX_GENERATION_DEADLINE_MS === 22_000, "max_deadline_must_be_22s");
  need(DEFAULT_GENERATION_DEADLINE_MS < 24_000, "server_deadline_must_be_below_browser_24s");
  need(MAX_GENERATION_DEADLINE_MS < 24_000, "max_server_deadline_must_be_below_browser_24s");
  need(DEFAULT_GENERATION_DEADLINE_MS - DEFAULT_FALLBACK_RESERVE_MS === 18_000, "ai_cutoff_must_be_18s");

  need(defaultGenerationDeadlineMs() === 20_000, "defaultGenerationDeadlineMs mismatch");
  need(defaultFallbackReserveMs() === 2_000, "defaultFallbackReserveMs mismatch");

  const prevDeadlineEnv = process.env.AI_GENERATION_DEADLINE_MS;
  try {
    process.env.AI_GENERATION_DEADLINE_MS = "30000";
    need(defaultGenerationDeadlineMs() === 22_000, "defaultGenerationDeadlineMs must clamp positive override to 22s max");
  } finally {
    if (prevDeadlineEnv === undefined) {
      delete process.env.AI_GENERATION_DEADLINE_MS;
    } else {
      process.env.AI_GENERATION_DEADLINE_MS = prevDeadlineEnv;
    }
  }

  let testSimTime = 50_000;
  const testBudget = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => testSimTime,
  });

  need(testBudget.startedAt === 50_000, "startedAt mismatch");
  need(testBudget.totalTimeoutMs === 20_000, "totalTimeoutMs mismatch");
  need(testBudget.fallbackReserveMs === 2_000, "fallbackReserveMs mismatch");
  need(testBudget.deadlineAt === 70_000, "deadlineAt mismatch");
  need(testBudget.aiCutoffAt === 68_000, "aiCutoffAt mismatch");
  need(testBudget.elapsedMs === 0, "elapsedMs should be 0");
  need(testBudget.remainingTotalMs === 20_000, "remainingTotalMs should be 20000");
  need(testBudget.remainingAiMs === 18_000, "remainingAiMs should be 18000");
  need(!testBudget.isExpired(), "budget should not be expired at start");

  // Clamping requested timeout to remaining budget
  need(testBudget.clampTimeoutMs(12_000) === 12_000, "clampTimeoutMs should allow 12000 when 18000 remaining");
  need(testBudget.clampTimeoutMs(25_000) === 18_000, "clampTimeoutMs should clamp 25000 to remaining 18000");

  // Advance time by 10,000ms
  testSimTime += 10_000;
  need(testBudget.elapsedMs === 10_000, "elapsedMs should be 10000");
  need(testBudget.remainingTotalMs === 10_000, "remainingTotalMs should be 10000");
  need(testBudget.remainingAiMs === 8_000, "remainingAiMs should be 8000");
  need(testBudget.clampTimeoutMs(12_000) === 8_000, "clampTimeoutMs should clamp 12000 to remaining 8000");

  // Advance time to AI cutoff (elapsed 18,000ms)
  testSimTime += 8_000;
  need(testBudget.remainingAiMs === 0, "remainingAiMs should be 0 at cutoff");
  need(testBudget.remainingTotalMs === 2_000, "remainingTotalMs should retain 2000 reserve");
  need(testBudget.isExpired(), "budget should be expired for AI at cutoff");

  let budgetExhaustedThrown = false;
  try {
    testBudget.ensureAiBudget();
  } catch (err) {
    budgetExhaustedThrown = (err as Error).message === "ai_budget_exhausted";
  }
  need(budgetExhaustedThrown, "ensureAiBudget must throw ai_budget_exhausted");

  passMarkers.push("BUDGET_BOUNDS_AND_DEFAULTS=PASS");

  // ── 2. NORMAL_FAST_EXECUTION ───────────────────────────────────────────────
  let simTimeNormal = 100_000;
  const budgetNormal = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => simTimeNormal,
  });

  const normalProvider = makeControllableDelayedProvider(
    () => ({
      data: validProviderPayload(approvedTripleNoPhoto, fixtureBrief),
      simulatedDelayMs: 350,
    }),
    ms => { simTimeNormal += ms; }
  );

  const normalOutcome = await generateCreativeDirectorDirections(
    normalProvider,
    fixtureBrief,
    approvedTripleNoPhoto,
    undefined,
    "creative_director",
    undefined,
    budgetNormal
  );

  need(normalOutcome.kind === "ready", "normal call must return ready");
  need(normalOutcome.result.directions.length === 3, "normal call must produce 3 directions");
  need(normalProvider.getCallCount() === 1, "normal call must make exactly 1 provider call");
  need(budgetNormal.elapsedMs === 350, "elapsed time must match simulated delay");
  need(budgetNormal.remainingAiMs === 17_650, "remaining ai budget matches");
  GenerationResultSchema.parse(normalOutcome.result);

  passMarkers.push("NORMAL_FAST_EXECUTION=PASS");

  // ── 3. SLOW_FIRST_CALL_CUTOFF ──────────────────────────────────────────────
  // Director takes 18,500ms (exceeding 18s AI cutoff).
  // Fake slow provider exceeds clamped 18,000ms timeout and throws ai_provider_timeout.
  // Remaining AI budget is exhausted (0ms).
  // Expansion must NOT be launched, and deterministic fallback runs.
  let simTimeSlow = 200_000;
  const budgetSlow = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => simTimeSlow,
  });

  const slowDirectorProvider = makeControllableDelayedProvider(
    () => ({
      data: { action: "expand_pool", reasonCode: "range_needed", desiredTraits: ["modern"] },
      simulatedDelayMs: 18_500,
    }),
    ms => { simTimeSlow += ms; }
  );

  const prevAiRequestTimeout = process.env.AI_REQUEST_TIMEOUT_MS;
  process.env.AI_REQUEST_TIMEOUT_MS = "18000";
  let slowDirectorTimedOut = false;
  try {
    await generateCreativeDirectorDirections(
      slowDirectorProvider,
      fixtureBrief,
      approvedTripleNoPhoto,
      undefined,
      "creative_director",
      undefined,
      budgetSlow
    );
  } catch (err) {
    slowDirectorTimedOut = (err as Error).message === "ai_provider_timeout";
  } finally {
    if (prevAiRequestTimeout === undefined) {
      delete process.env.AI_REQUEST_TIMEOUT_MS;
    } else {
      process.env.AI_REQUEST_TIMEOUT_MS = prevAiRequestTimeout;
    }
  }
  need(slowDirectorTimedOut, "slow director call must throw ai_provider_timeout");

  need(slowDirectorProvider.getCallCount() === 1, "director was called once");
  need(budgetSlow.isExpired(), "budget must be expired for AI after timeout");

  // Production worker checks budget.ensureAiBudget() before launching expanded phase
  let secondCallBlocked = false;
  try {
    budgetSlow.ensureAiBudget();
  } catch (err) {
    secondCallBlocked = (err as Error).message === "ai_budget_exhausted";
  }
  need(secondCallBlocked, "budget check before second phase must reject");

  // Direct call to director for expanded phase with expired budget must also reject without calling provider
  let secondCallAttemptBlocked = false;
  try {
    await generateCreativeDirectorDirections(
      slowDirectorProvider,
      fixtureBrief,
      approvedTripleNoPhoto,
      undefined,
      "expanded_director",
      { reasonCode: "range_needed", desiredTraits: ["modern"] },
      budgetSlow
    );
  } catch (err) {
    secondCallAttemptBlocked = (err as Error).message === "ai_budget_exhausted";
  }
  need(secondCallAttemptBlocked, "expanded phase call must be blocked with ai_budget_exhausted");
  need(slowDirectorProvider.getCallCount() === 1, "expansion must not start after budget exhaustion");

  const slowFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(slowFallback.directions.length === 3, "fallback must produce 3 directions");
  need(slowFallback.directions[0].templateId === approvedEditorial.id, "fallback must preserve approved identity");
  need(slowFallback.directions[1].templateId === approvedMidnight.id, "fallback must preserve approved identity");
  need(slowFallback.directions[2].templateId === approvedQuiet.id, "fallback must preserve approved identity");
  GenerationResultSchema.parse(slowFallback);

  passMarkers.push("SLOW_FIRST_CALL_CUTOFF=PASS");

  // ── 4. EXPANSION_PHASE_BOUNDED ─────────────────────────────────────────────
  // 4a: Fast expansion within budget
  let simTimeExpFast = 300_000;
  const budgetExpFast = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => simTimeExpFast,
  });

  const expFastProvider = makeControllableDelayedProvider(
    callIndex => {
      if (callIndex === 1) {
        return {
          data: { action: "expand_pool", reasonCode: "need_more", desiredTraits: ["bold"] },
          simulatedDelayMs: 1_200,
        };
      }
      return {
        data: validProviderPayload(approvedTripleNoPhoto, fixtureBrief),
        simulatedDelayMs: 1_500,
      };
    },
    ms => { simTimeExpFast += ms; }
  );

  const expFastOutcome1 = await generateCreativeDirectorDirections(
    expFastProvider,
    fixtureBrief,
    approvedTripleNoPhoto,
    undefined,
    "creative_director",
    undefined,
    budgetExpFast
  );
  need(expFastOutcome1.kind === "expand_pool", "first call asks for expansion");

  budgetExpFast.ensureAiBudget();
  const expFastOutcome2 = await generateCreativeDirectorDirections(
    expFastProvider,
    fixtureBrief,
    approvedTripleNoPhoto,
    undefined,
    "expanded_director",
    { reasonCode: expFastOutcome1.reasonCode, desiredTraits: expFastOutcome1.desiredTraits },
    budgetExpFast
  );
  need(expFastOutcome2.kind === "ready", "expanded director must succeed");
  need(expFastProvider.getCallCount() === 2, "must make 2 provider calls (director + expansion)");
  need(budgetExpFast.elapsedMs === 2_700, "elapsed time must be 2700ms");
  GenerationResultSchema.parse(expFastOutcome2.result);

  // 4b: Slow expansion clamped to remaining budget
  // Director takes 10,000ms. Remaining AI budget is 8,000ms.
  // Expansion fake tries to take 12,000ms.
  // Expansion timeout is clamped to 8,000ms and times out.
  let simTimeExpSlow = 400_000;
  const budgetExpSlow = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => simTimeExpSlow,
  });

  const expSlowProvider = makeControllableDelayedProvider(
    callIndex => {
      if (callIndex === 1) {
        return {
          data: { action: "expand_pool", reasonCode: "need_more", desiredTraits: ["bold"] },
          simulatedDelayMs: 10_000,
        };
      }
      return {
        data: validProviderPayload(approvedTripleNoPhoto, fixtureBrief),
        simulatedDelayMs: 12_000,
      };
    },
    ms => { simTimeExpSlow += ms; }
  );

  const expSlowOutcome1 = await generateCreativeDirectorDirections(
    expSlowProvider,
    fixtureBrief,
    approvedTripleNoPhoto,
    undefined,
    "creative_director",
    undefined,
    budgetExpSlow
  );
  need(expSlowOutcome1.kind === "expand_pool", "director asks for expansion");
  need(budgetExpSlow.remainingAiMs === 8_000, "remaining ai budget is 8000ms");

  let expSlowTimedOut = false;
  try {
    budgetExpSlow.ensureAiBudget();
    await generateCreativeDirectorDirections(
      expSlowProvider,
      fixtureBrief,
      approvedTripleNoPhoto,
      undefined,
      "expanded_director",
      { reasonCode: expSlowOutcome1.reasonCode, desiredTraits: expSlowOutcome1.desiredTraits },
      budgetExpSlow
    );
  } catch (err) {
    expSlowTimedOut = (err as Error).message === "ai_provider_timeout";
  }
  need(expSlowTimedOut, "timed-out expansion must throw ai_provider_timeout");
  need(expSlowProvider.getCallCount() === 2, "expansion provider was invoked once and timed out");
  need(expSlowProvider.getLastTimeoutMs() === 8_000, "expansion timeout must be clamped to 8000ms remaining budget");
  need(budgetExpSlow.elapsedMs === 18_000, "total elapsed must not overrun 18s AI cutoff");
  need(budgetExpSlow.remainingTotalMs === 2_000, "fallback reserve must remain intact");

  const expSlowFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(expSlowFallback.directions.length === 3, "fallback produces 3 directions");
  GenerationResultSchema.parse(expSlowFallback);

  passMarkers.push("EXPANSION_PHASE_BOUNDED=PASS");

  // ── 5. CRITIC_PHASE_BOUNDED ────────────────────────────────────────────────
  // 5a: Critic within budget
  let simTimeCriticFast = 500_000;
  const budgetCriticFast = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => simTimeCriticFast,
  });

  const criticFastProvider = makeControllableDelayedProvider(
    callIndex => {
      if (callIndex === 1) {
        return {
          data: validProviderPayload(approvedTripleNoPhoto, fixtureBrief, 0.5),
          simulatedDelayMs: 1_000,
        };
      }
      return {
        data: {
          repairs: validProviderPayload(approvedTripleNoPhoto, fixtureBrief, 0.9).directions,
        },
        simulatedDelayMs: 1_200,
      };
    },
    ms => { simTimeCriticFast += ms; }
  );

  const criticOutcome1 = await generateCreativeDirectorDirections(
    criticFastProvider,
    fixtureBrief,
    approvedTripleNoPhoto,
    undefined,
    "creative_director",
    undefined,
    budgetCriticFast
  );
  need(criticOutcome1.kind === "ready", "director ready");

  budgetCriticFast.ensureAiBudget();
  const repaired = await criticRepairDirections(
    criticFastProvider,
    fixtureBrief,
    criticOutcome1.result,
    approvedTripleNoPhoto,
    ["low_wow"],
    budgetCriticFast
  );
  need(repaired.result.directions.length === 3, "critic repaired 3 directions");
  need(criticFastProvider.getCallCount() === 2, "must call director and critic");
  GenerationResultSchema.parse(repaired.result);

  // 5b: Direct critic call with an expired budget and zero provider calls
  let simTimeCriticExpired = 600_000;
  const budgetCriticExpired = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => simTimeCriticExpired,
  });
  simTimeCriticExpired += 18_500; // Past 18s AI cutoff

  let zeroCriticCalls = 0;
  const criticZeroProvider: AIProvider = {
    providerName: "zero-call",
    modelName: "zero-model",
    async generateJson(): Promise<AIProviderResponse> {
      zeroCriticCalls++;
      throw new Error("should_not_be_called");
    },
  };

  const dummyValidResult = makeValidResult(approvedTripleNoPhoto, fixtureBrief, 0.5);

  let criticExhaustedThrown = false;
  try {
    await criticRepairDirections(
      criticZeroProvider,
      fixtureBrief,
      dummyValidResult,
      approvedTripleNoPhoto,
      ["low_wow"],
      budgetCriticExpired
    );
  } catch (err) {
    criticExhaustedThrown = (err as Error).message === "ai_budget_exhausted";
  }
  need(criticExhaustedThrown, "direct critic call with expired budget must throw ai_budget_exhausted");
  need(zeroCriticCalls === 0, "critic provider must NOT be called when budget is expired");

  const criticFallbackResult = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(criticFallbackResult.directions.length === 3, "fallback must produce 3 directions");
  need(criticFallbackResult.directions[0].templateId === approvedEditorial.id, "fallback template identity preserved");
  GenerationResultSchema.parse(criticFallbackResult);

  passMarkers.push("CRITIC_PHASE_BOUNDED=PASS");

  // ── 6. TIMEOUT_BEFORE_FALLBACK ─────────────────────────────────────────────
  // Provider hangs on first call. Provider timeout aborts at clamped cutoff.
  // Fallback completes with exact identity. Total elapsed strictly < 20,000ms (and < 24,000ms).
  let simTimeHang = 700_000;
  const budgetHang = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => simTimeHang,
  });

  const hangingProvider = makeControllableDelayedProvider(
    () => ({
      data: validProviderPayload(approvedTripleNoPhoto, fixtureBrief),
      simulatedDelayMs: 30_000, // exceeds any clamped timeout
    }),
    ms => { simTimeHang += ms; }
  );

  let hangTimedOut = false;
  try {
    await generateCreativeDirectorDirections(
      hangingProvider,
      fixtureBrief,
      approvedTripleNoPhoto,
      undefined,
      "creative_director",
      undefined,
      budgetHang
    );
  } catch (err) {
    hangTimedOut = (err as Error).message === "ai_provider_timeout";
  }

  need(hangTimedOut, "hanging provider must time out");
  need(hangingProvider.getCallCount() === 1, "exactly 1 provider call was attempted");
  need(budgetHang.elapsedMs <= 18_000, "hang must abort within AI cutoff");
  need(budgetHang.remainingTotalMs >= 2_000, "reserve must be intact for fallback");

  const hangFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(hangFallback.directions.length === 3, "fallback must produce 3 directions");
  need(hangFallback.directions[0].templateId === approvedEditorial.id, "fallback direction 0 matches approved editorial");
  need(hangFallback.directions[1].templateId === approvedMidnight.id, "fallback direction 1 matches approved midnight");
  need(hangFallback.directions[2].templateId === approvedQuiet.id, "fallback direction 2 matches approved quiet");
  GenerationResultSchema.parse(hangFallback);

  passMarkers.push("TIMEOUT_BEFORE_FALLBACK=PASS");

  // ── 7. NO_PHASE_AFTER_EXHAUSTION ───────────────────────────────────────────
  let simTimeExhausted = 800_000;
  const expiredBudget = new GenerationBudget({
    totalTimeoutMs: 20_000,
    fallbackReserveMs: 2_000,
    now: () => simTimeExhausted,
  });
  simTimeExhausted += 19_000; // Past AI cutoff

  let zeroProviderCalls = 0;
  const neverCalledProvider: AIProvider = {
    providerName: "never-called",
    modelName: "never-called-model",
    async generateJson(): Promise<AIProviderResponse> {
      zeroProviderCalls++;
      throw new Error("should_not_be_called");
    },
  };

  let directorRejected = false;
  try {
    await generateCreativeDirectorDirections(
      neverCalledProvider,
      fixtureBrief,
      approvedTripleNoPhoto,
      undefined,
      "creative_director",
      undefined,
      expiredBudget
    );
  } catch (err) {
    directorRejected = (err as Error).message === "ai_budget_exhausted";
  }
  need(directorRejected, "director with expired budget must reject with ai_budget_exhausted");
  need(zeroProviderCalls === 0, "provider must not be called by director");

  let criticRejected = false;
  try {
    const validDummy = makeValidResult(approvedTripleNoPhoto, fixtureBrief);
    await criticRepairDirections(
      neverCalledProvider,
      fixtureBrief,
      validDummy,
      approvedTripleNoPhoto,
      ["low_wow"],
      expiredBudget
    );
  } catch (err) {
    criticRejected = (err as Error).message === "ai_budget_exhausted";
  }
  need(criticRejected, "critic with expired budget must reject with ai_budget_exhausted");
  need(zeroProviderCalls === 0, "provider must not be called by critic");

  passMarkers.push("NO_PHASE_AFTER_EXHAUSTION=PASS");

  // ── 8. NO_UNBOUNDED_RETRY_AND_STATIC_GUARDS ────────────────────────────────
  const workerSrc = readFileSync("apps/worker/src/index.ts", "utf8");
  const aiSrc = readFileSync("packages/ai/src/index.ts", "utf8");
  const generationClientSrc = readFileSync("apps/web/lib/generation-client.ts", "utf8");
  const generationStartRouteSrc = readFileSync("apps/web/app/api/generate/route.ts", "utf8");
  const generationRouteSrc = readFileSync("apps/web/app/api/generate/[jobId]/route.ts", "utf8");
  const generationDbSrc = readFileSync("packages/db/src/generation.ts", "utf8");

  // Assert NO duplicate orchestration helper remains
  need(!workerSrc.includes("executeGenerationPipeline"), "worker must not reference executeGenerationPipeline");
  need(!aiSrc.includes("executeGenerationPipeline"), "ai package must not export executeGenerationPipeline");
  need(!aiSrc.includes("GenerationPipelineOptions"), "ai package must not export GenerationPipelineOptions");
  need(!aiSrc.includes("GenerationPipelineResult"), "ai package must not export GenerationPipelineResult");

  // Assert worker creates budget ONCE before director and passes it down
  const workerBudgetPos = workerSrc.indexOf("generationBudget=createGenerationBudget({startedAt:");
  need(workerBudgetPos !== -1, "worker must create budget once from queue creation before AI phases");

  // Assert worker passes budget to director
  const workerDirectorPos = workerSrc.indexOf("generateCreativeDirectorDirections", workerBudgetPos);
  need(workerDirectorPos !== -1, "director must come after budget creation");
  const initialDirectorCall = workerSrc.slice(workerDirectorPos, workerSrc.indexOf(";", workerDirectorPos) + 1);
  need(/generateCreativeDirectorDirections\(provider,brief,[^,]+,recentStyles,\"creative_director\",undefined,generationBudget\)/.test(initialDirectorCall), "worker must pass budget to director");

  // Assert worker checks budget and passes to expanded director
  const workerExpandBudgetPos = workerSrc.indexOf("generationBudget.ensureAiBudget();", workerDirectorPos);
  need(workerExpandBudgetPos !== -1, "worker must check budget before expanded director");
  const workerExpandPos = workerSrc.indexOf("generateCreativeDirectorDirections(provider,brief,candidatePool,recentStyles,\"expanded_director\",priorCritique,generationBudget)", workerExpandBudgetPos);
  need(workerExpandPos !== -1, "worker must pass budget to expanded director");

  // Assert worker checks budget and passes to critic
  const workerCriticBudgetPos = workerSrc.indexOf("generationBudget.ensureAiBudget();", workerExpandPos);
  need(workerCriticBudgetPos !== -1, "worker must check budget before critic");
  const workerCriticPos = workerSrc.indexOf("criticRepairDirections(provider,brief,result,candidatePool,risks,generationBudget)", workerCriticBudgetPos);
  need(workerCriticPos !== -1, "worker must pass budget to critic");

  // Worker fallback logging and execution
  need(workerSrc.includes("ai_plan_recovery_started"), "worker must log ai_plan_recovery_started");
  need(workerSrc.includes("ai_plan_fallback_used"), "worker must log ai_plan_fallback_used");
  need(workerSrc.includes("buildDeterministicCreativeFallback"), "worker must call buildDeterministicCreativeFallback");

  // Browser abandonment must cancel the durable job and stop later AI phases.
  need(generationClientSrc.includes('method:"DELETE"')&&generationClientSrc.includes("idempotency-key"), "client must cancel by durable idempotency key");
  need(generationStartRouteSrc.includes("export async function DELETE")&&generationStartRouteSrc.includes("cancelGenerationJobByIdempotencyKey"), "start route must cancel a job when POST response is lost");
  need(generationRouteSrc.includes("export async function DELETE")&&generationRouteSrc.includes("cancelGenerationJob"), "status route must expose authenticated cancellation");
  need(generationDbSrc.includes("generation_cancelled")&&generationDbSrc.includes("generationJobIsActive"), "db must persist and expose cancellation state");
  need(workerSrc.includes("generationJobIsActive")&&workerSrc.includes("generation_cancelled"), "worker must stop cancelled jobs");
  passMarkers.push("CANCELLATION_BOUNDARY=PASS");

  // Static bounds and guards
  need(aiSrc.includes("DEFAULT_GENERATION_DEADLINE_MS"), "ai must export DEFAULT_GENERATION_DEADLINE_MS");
  need(aiSrc.includes("DEFAULT_FALLBACK_RESERVE_MS"), "ai must export DEFAULT_FALLBACK_RESERVE_MS");
  need(aiSrc.includes("MAX_GENERATION_DEADLINE_MS"), "ai must export MAX_GENERATION_DEADLINE_MS");
  need(aiSrc.includes("clampTimeoutMs"), "ai must include clampTimeoutMs");
  need(aiSrc.includes("ensureAiBudget"), "ai must include ensureAiBudget");
  need(!aiSrc.includes("while(true)"), "ai must not contain while(true)");
  need(!workerSrc.includes("while(true)"), "worker must not contain while(true)");

  passMarkers.push("NO_UNBOUNDED_RETRY_AND_STATIC_GUARDS=PASS");

  // ── 9. FINAL DoD MARKER ───────────────────────────────────────────────────
  passMarkers.push("GENERATION_DEADLINE_BUDGET=PASS");

  for (const marker of passMarkers) {
    console.log(marker);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
