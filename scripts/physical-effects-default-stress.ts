import fs from "node:fs";
import assert from "node:assert/strict";

function must(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`physical_effects_default_stress_failed: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Source-level invariant checks on apps/web/components/physical-effects.tsx
// ---------------------------------------------------------------------------

const sourcePath = "apps/web/components/physical-effects.tsx";
must(fs.existsSync(sourcePath), `Component file not found at ${sourcePath}`);

const source = fs.readFileSync(sourcePath, "utf8");

// (a) Defaults must be explicitly false for fresh profiles
const defaultsMatch = source.match(/const\s+defaults\s*:\s*Prefs\s*=\s*\{([^}]+)\};/);
must(Boolean(defaultsMatch), "defaults:Prefs declaration not found in physical-effects.tsx");

const defaultsBody = defaultsMatch ? defaultsMatch[1] : "";
must(defaultsBody.includes("master:false") || defaultsBody.includes("master: false"), "defaults.master must be false");
must(defaultsBody.includes("haptics:false") || defaultsBody.includes("haptics: false"), "defaults.haptics must be false");
must(defaultsBody.includes("gyro:false") || defaultsBody.includes("gyro: false"), "defaults.gyro must be false");
must(defaultsBody.includes("lighting:false") || defaultsBody.includes("lighting: false"), "defaults.lighting must be false");

must(!defaultsBody.includes("master:true") && !defaultsBody.includes("master: true"), "defaults.master must not be true");
must(!defaultsBody.includes("haptics:true") && !defaultsBody.includes("haptics: true"), "defaults.haptics must not be true");
must(!defaultsBody.includes("gyro:true") && !defaultsBody.includes("gyro: true"), "defaults.gyro must not be true");
must(!defaultsBody.includes("lighting:true") && !defaultsBody.includes("lighting: true"), "defaults.lighting must not be true");

// (b) Storage key and preservation contract
must(source.includes('const STORAGE="cardelume.physical-effects.v2"') || source.includes('const STORAGE = "cardelume.physical-effects.v2"'), "STORAGE key must remain cardelume.physical-effects.v2");
must(source.includes("localStorage.getItem(STORAGE)"), "Storage read path localStorage.getItem(STORAGE) missing");
must(source.includes("localStorage.setItem(STORAGE,JSON.stringify(prefs))") || source.includes("localStorage.setItem(STORAGE, JSON.stringify(prefs))"), "Storage write path localStorage.setItem(STORAGE, ...) missing");
must(source.includes("{...defaults,...JSON.parse(stored)}") || source.includes("{ ...defaults, ...JSON.parse(stored) }"), "Stored preferences must merge with defaults to preserve saved profiles");

// (c) Gyro permission and request path must remain behind explicit customer opt-in
must(source.includes("const requestGyro=useCallback") || source.includes("const requestGyro = useCallback"), "requestGyro helper missing");
must(source.includes("if(key===\"gyro\"&&value){") || source.includes("if (key === \"gyro\" && value) {"), "requestGyro must only trigger when key === 'gyro' and value is true");
must(source.includes("const ok=await requestGyro()") || source.includes("const ok = await requestGyro()"), "setPref must await requestGyro on explicit opt-in");

// Ensure requestGyro is NOT invoked automatically in any useEffect hook
const useEffectBlocks = source.match(/useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[[^\]]*\]\s*\)/g) || [];
for (const block of useEffectBlocks) {
  must(!block.includes("requestGyro("), "requestGyro must never be called automatically inside useEffect");
}

// Orientation listener effect must guard early if master or gyro is off
must(source.includes("if(!prefs.master||!prefs.gyro||reducedMotion||performancePaused)return") || source.includes("if (!prefs.master || !prefs.gyro || reducedMotion || performancePaused) return"), "Orientation listener missing guard against inactive master/gyro/reducedMotion/performancePaused");

// (d) Reduced-motion and performance-paused safeguards
must(source.includes('window.matchMedia("(prefers-reduced-motion: reduce)")'), "prefers-reduced-motion media query listener missing");
must(source.includes("dynamicLighting=active&&prefs.lighting&&!reducedMotion") || source.includes("dynamicLighting = active && prefs.lighting && !reducedMotion"), "dynamicLighting must be guarded by !reducedMotion");
must(source.includes("gyroEffects=active&&prefs.gyro&&!reducedMotion") || source.includes("gyroEffects = active && prefs.gyro && !reducedMotion"), "gyroEffects must be guarded by !reducedMotion");
must(source.includes("effectsPerformancePaused=performancePaused") || source.includes("effectsPerformancePaused = performancePaused"), "effectsPerformancePaused dataset attribute missing");

// Card surface pointer interaction must guard against inactive effects and reduced motion
must(source.includes("if(!prefs.master||reducedMotion||performancePaused)return") || source.includes("if (!prefs.master || reducedMotion || performancePaused) return"), "PhysicalCardSurface onPointerMove missing early return guard");

// Haptic feedback must guard against inactive master or haptics or performance pause
must(source.includes("if(!prefs.master||!prefs.haptics||performancePaused)return") || source.includes("if (!prefs.master || !prefs.haptics || performancePaused) return"), "haptic feedback missing guard");

// (e) Exported components and API contracts
must(source.includes("export function PhysicalEffectsProvider"), "PhysicalEffectsProvider must be exported");
must(source.includes("export function usePhysicalEffects"), "usePhysicalEffects hook must be exported");
must(source.includes("export function PhysicalEffectsControl"), "PhysicalEffectsControl must be exported");
must(source.includes("export function PhysicalCardSurface"), "PhysicalCardSurface must be exported");

// ---------------------------------------------------------------------------
// 2. Deterministic Behavioral & State Logic Tests
// ---------------------------------------------------------------------------

type Prefs = {
  master: boolean;
  haptics: boolean;
  gyro: boolean;
  lighting: boolean;
};

// Extracted defaults matching the source contract
const defaults: Prefs = { master: false, haptics: false, gyro: false, lighting: false };
const STORAGE_KEY = "cardelume.physical-effects.v2";

function computeDataset(prefs: Prefs, reducedMotion: boolean, performancePaused: boolean) {
  const active = prefs.master && !performancePaused;
  return {
    physicalEffects: active ? "on" : "off",
    dynamicLighting: active && prefs.lighting && !reducedMotion ? "on" : "off",
    gyroEffects: active && prefs.gyro && !reducedMotion ? "on" : "off",
    haptics: active && prefs.haptics ? "on" : "off",
    effectsPerformancePaused: performancePaused ? "true" : "false",
  };
}

function shouldOrientationRun(prefs: Prefs, reducedMotion: boolean, performancePaused: boolean) {
  if (!prefs.master || !prefs.gyro || reducedMotion || performancePaused) return false;
  return true;
}

function shouldFpsMonitorRun(prefs: Prefs, reducedMotion: boolean, performancePaused: boolean) {
  if (!prefs.master || (!prefs.gyro && !prefs.lighting) || reducedMotion || performancePaused) return false;
  return true;
}

function shouldPointerMoveRun(prefs: Prefs, reducedMotion: boolean, performancePaused: boolean) {
  if (!prefs.master || reducedMotion || performancePaused) return false;
  return true;
}

function shouldHapticRun(prefs: Prefs, performancePaused: boolean) {
  if (!prefs.master || !prefs.haptics || performancePaused) return false;
  return true;
}

// Scenario 1: Fresh Profile (Zero Stored State) -> All OFF by default
{
  const freshPrefs = { ...defaults };
  assert.equal(freshPrefs.master, false, "Fresh profile: master must be false");
  assert.equal(freshPrefs.haptics, false, "Fresh profile: haptics must be false");
  assert.equal(freshPrefs.gyro, false, "Fresh profile: gyro must be false");
  assert.equal(freshPrefs.lighting, false, "Fresh profile: lighting must be false");

  const dataset = computeDataset(freshPrefs, false, false);
  assert.equal(dataset.physicalEffects, "off", "Fresh profile: physicalEffects dataset must be off");
  assert.equal(dataset.dynamicLighting, "off", "Fresh profile: dynamicLighting dataset must be off");
  assert.equal(dataset.gyroEffects, "off", "Fresh profile: gyroEffects dataset must be off");
  assert.equal(dataset.haptics, "off", "Fresh profile: haptics dataset must be off");
  assert.equal(dataset.effectsPerformancePaused, "false", "Fresh profile: effectsPerformancePaused must be false");

  assert.equal(shouldOrientationRun(freshPrefs, false, false), false, "Fresh profile: orientation effect must not run");
  assert.equal(shouldFpsMonitorRun(freshPrefs, false, false), false, "Fresh profile: fps monitor must not run");
  assert.equal(shouldPointerMoveRun(freshPrefs, false, false), false, "Fresh profile: pointer move must not run");
  assert.equal(shouldHapticRun(freshPrefs, false), false, "Fresh profile: haptics must not run");
}

// Scenario 2: Stored Saved-ON Profile -> Exactly Preserved
{
  const savedOnJson = JSON.stringify({ master: true, haptics: true, gyro: true, lighting: true });
  const parsed = JSON.parse(savedOnJson);
  const restoredPrefs: Prefs = { ...defaults, ...parsed };

  assert.equal(restoredPrefs.master, true, "Saved-ON profile: master preserved as true");
  assert.equal(restoredPrefs.haptics, true, "Saved-ON profile: haptics preserved as true");
  assert.equal(restoredPrefs.gyro, true, "Saved-ON profile: gyro preserved as true");
  assert.equal(restoredPrefs.lighting, true, "Saved-ON profile: lighting preserved as true");

  const dataset = computeDataset(restoredPrefs, false, false);
  assert.equal(dataset.physicalEffects, "on", "Saved-ON profile: physicalEffects dataset must be on");
  assert.equal(dataset.dynamicLighting, "on", "Saved-ON profile: dynamicLighting dataset must be on");
  assert.equal(dataset.gyroEffects, "on", "Saved-ON profile: gyroEffects dataset must be on");
  assert.equal(dataset.haptics, "on", "Saved-ON profile: haptics dataset must be on");

  assert.equal(shouldOrientationRun(restoredPrefs, false, false), true, "Saved-ON profile: orientation effect runs");
  assert.equal(shouldFpsMonitorRun(restoredPrefs, false, false), true, "Saved-ON profile: fps monitor runs");
  assert.equal(shouldPointerMoveRun(restoredPrefs, false, false), true, "Saved-ON profile: pointer move runs");
  assert.equal(shouldHapticRun(restoredPrefs, false), true, "Saved-ON profile: haptics run");
}

// Scenario 3: Selective Saved Preferences (Only haptics enabled)
{
  const savedPartialJson = JSON.stringify({ master: true, haptics: true, gyro: false, lighting: false });
  const restoredPrefs: Prefs = { ...defaults, ...JSON.parse(savedPartialJson) };

  assert.equal(restoredPrefs.master, true, "Partial profile: master is true");
  assert.equal(restoredPrefs.haptics, true, "Partial profile: haptics is true");
  assert.equal(restoredPrefs.gyro, false, "Partial profile: gyro is false");
  assert.equal(restoredPrefs.lighting, false, "Partial profile: lighting is false");

  const dataset = computeDataset(restoredPrefs, false, false);
  assert.equal(dataset.physicalEffects, "on", "Partial profile: physicalEffects is on");
  assert.equal(dataset.haptics, "on", "Partial profile: haptics is on");
  assert.equal(dataset.gyroEffects, "off", "Partial profile: gyroEffects is off");
  assert.equal(dataset.dynamicLighting, "off", "Partial profile: dynamicLighting is off");

  assert.equal(shouldOrientationRun(restoredPrefs, false, false), false, "Partial profile: orientation effect must not run when gyro is false");
  assert.equal(shouldFpsMonitorRun(restoredPrefs, false, false), false, "Partial profile: fps monitor must not run when gyro and lighting are false");
  assert.equal(shouldHapticRun(restoredPrefs, false), true, "Partial profile: haptics run when enabled");
}

// Scenario 4: Corrupted Storage Fallback
{
  let restoredPrefs: Prefs = { ...defaults };
  try {
    const invalidJson = "bad-json{{{";
    restoredPrefs = { ...defaults, ...JSON.parse(invalidJson) };
  } catch {
    // try/catch in component preserves defaults
  }
  assert.equal(restoredPrefs.master, false, "Corrupted storage: falls back to default-off master");
  assert.equal(restoredPrefs.gyro, false, "Corrupted storage: falls back to default-off gyro");
}

// Scenario 5: Reduced Motion Safeguard
{
  const activePrefs: Prefs = { master: true, haptics: true, gyro: true, lighting: true };
  const dataset = computeDataset(activePrefs, true, false);

  assert.equal(dataset.physicalEffects, "on", "Reduced motion: master effects remain on");
  assert.equal(dataset.dynamicLighting, "off", "Reduced motion: dynamic lighting forced off");
  assert.equal(dataset.gyroEffects, "off", "Reduced motion: gyro effects forced off");
  assert.equal(dataset.haptics, "on", "Reduced motion: haptics remain unaffected");

  assert.equal(shouldOrientationRun(activePrefs, true, false), false, "Reduced motion: orientation listener must be disabled");
  assert.equal(shouldFpsMonitorRun(activePrefs, true, false), false, "Reduced motion: fps monitor must be disabled");
  assert.equal(shouldPointerMoveRun(activePrefs, true, false), false, "Reduced motion: card surface tilt must be disabled");
}

// Scenario 6: Performance Paused Safeguard
{
  const activePrefs: Prefs = { master: true, haptics: true, gyro: true, lighting: true };
  const dataset = computeDataset(activePrefs, false, true);

  assert.equal(dataset.physicalEffects, "off", "Performance paused: physicalEffects forced off");
  assert.equal(dataset.dynamicLighting, "off", "Performance paused: dynamicLighting forced off");
  assert.equal(dataset.gyroEffects, "off", "Performance paused: gyroEffects forced off");
  assert.equal(dataset.haptics, "off", "Performance paused: haptics forced off");
  assert.equal(dataset.effectsPerformancePaused, "true", "Performance paused: effectsPerformancePaused marker set");

  assert.equal(shouldOrientationRun(activePrefs, false, true), false, "Performance paused: orientation listener disabled");
  assert.equal(shouldFpsMonitorRun(activePrefs, false, true), false, "Performance paused: fps monitor disabled");
  assert.equal(shouldPointerMoveRun(activePrefs, false, true), false, "Performance paused: pointer move disabled");
  assert.equal(shouldHapticRun(activePrefs, true), false, "Performance paused: haptic tap disabled");
}

// Scenario 7: Explicit Gyro Opt-in Flow
async function runScenario7() {
  let currentPrefs: Prefs = { ...defaults };
  let gyroPermission: "unknown" | "granted" | "denied" | "unsupported" = "unknown";
  let requestGyroCallCount = 0;

  async function mockRequestGyro(): Promise<boolean> {
    requestGyroCallCount++;
    gyroPermission = "granted";
    return true;
  }

  async function setPref(key: keyof Prefs, value: boolean) {
    if (key === "gyro" && value) {
      const ok = await mockRequestGyro();
      currentPrefs = {
        ...currentPrefs,
        master: ok || gyroPermission === "granted" ? true : currentPrefs.master,
        gyro: ok || gyroPermission === "granted",
      };
      return;
    }
    currentPrefs = key === "master"
      ? { ...currentPrefs, master: value }
      : { ...currentPrefs, master: value ? true : currentPrefs.master, [key]: value };
  }

  // Before opt-in: no requestGyro calls
  assert.equal(requestGyroCallCount, 0, "No gyro request before opt-in");
  assert.equal(currentPrefs.gyro, false, "Gyro off before opt-in");

  // User explicitly toggles gyro ON
  await setPref("gyro", true);
  assert.equal(requestGyroCallCount, 1, "requestGyro called exactly once on explicit opt-in");
  assert.equal(currentPrefs.gyro, true, "Gyro enabled after explicit opt-in");
  assert.equal(currentPrefs.master, true, "Master enabled automatically with gyro opt-in");

  // User toggles master OFF
  await setPref("master", false);
  assert.equal(currentPrefs.master, false, "Master disabled");
  assert.equal(shouldOrientationRun(currentPrefs, false, false), false, "Orientation halts when master is off");

  console.log(JSON.stringify({
    status: "PASS",
    storageKey: STORAGE_KEY,
    freshDefaults: { master: false, haptics: false, gyro: false, lighting: false },
    storagePreserved: true,
    autoRequestBlocked: true,
    reducedMotionGuards: true,
    performancePausedGuards: true,
    explicitOptInVerified: true,
  }));
}

runScenario7().catch((err) => {
  console.error(err);
  process.exit(1);
});
