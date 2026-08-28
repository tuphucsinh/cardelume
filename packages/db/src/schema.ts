import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, uniqueIndex, index, primaryKey, numeric, date } from "drizzle-orm/pg-core";

export const cards = pgTable("cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  status: text("status").notNull().default("draft"),
  occasion: text("occasion").notNull(),
  locale: text("locale").notNull().default("en"),
  selectedVersionId: uuid("selected_version_id"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
});

export const cardVersions = pgTable("card_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id").notNull(),
  direction: text("direction").notNull(),
  document: jsonb("document").notNull(),
  previewObjectKey: text("preview_object_key"),
  managedTemplateId: uuid("managed_template_id"),
  managedTemplateVersionId: uuid("managed_template_version_id"),
  managedTemplateSource: text("managed_template_source"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
});

export const generationJobs = pgTable("generation_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  cardId: uuid("card_id").notNull(),
  status: text("status").notNull().default("queued"),
  queueJobId: text("queue_job_id"),
  idempotencyKey: text("idempotency_key"),
  requestHash: text("request_hash"),
  brief: jsonb("brief"),
  stage: integer("stage").notNull().default(0),
  result: jsonb("result"),
  attemptCount: integer("attempt_count").notNull().default(0),
  errorCode: text("error_code"),
  startedAt: timestamp("started_at", {withTimezone:true}),
  completedAt: timestamp("completed_at", {withTimezone:true}),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  uniqueIndex("generation_jobs_user_idempotency_uidx").on(t.userId,t.idempotencyKey),
  index("generation_jobs_status_created_idx").on(t.status,t.createdAt)
]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  // Legacy CardeLume convenience FK retained for backward compatibility.
  // Shared commerce/recovery code should prefer orderItems.resourceId.
  cardId: uuid("card_id").notNull(),
  productKey: text("product_key").notNull().default("cardelume"),
  locale: text("locale").notNull().default("en"),
  status: text("status").notNull().default("pending"),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("USD"),
  providerPaymentId: text("provider_payment_id"),
  checkoutIdempotencyKey: text("checkout_idempotency_key"),
  checkoutRequestHash: text("checkout_request_hash"),
  paymentProvider: text("payment_provider").notNull().default("dodo"),
  providerCheckoutId: text("provider_checkout_id"),
  providerCheckoutUrl: text("provider_checkout_url"),
  providerCheckoutCreationToken: text("provider_checkout_creation_token"),
  providerCheckoutCreatingAt: timestamp("provider_checkout_creating_at", {withTimezone:true}),
  pricingMarket: text("pricing_market"),
  pricingDisplay: text("pricing_display"),
  paidAt: timestamp("paid_at", {withTimezone:true}),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  uniqueIndex("orders_checkout_idempotency_uidx").on(t.userId,t.checkoutIdempotencyKey),
  uniqueIndex("orders_provider_checkout_uidx").on(t.providerCheckoutId),
  uniqueIndex("orders_provider_payment_uidx").on(t.providerPaymentId)
]);

export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerEventId: text("provider_event_id").notNull(),
  eventType: text("event_type").notNull(),
  processed: boolean("processed").notNull().default(false),
  payload: jsonb("payload").notNull(),
  orderId: uuid("order_id").references(()=>orders.id),
  outcome: text("outcome"),
  processedAt: timestamp("processed_at", {withTimezone:true}),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  uniqueIndex("payment_events_provider_event_uidx").on(t.providerEventId),
  index("payment_events_order_idx").on(t.orderId)
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(()=>orders.id),
  productKey: text("product_key").notNull().default("cardelume"),
  resourceId: uuid("resource_id").notNull(),
  resourceVersionId: uuid("resource_version_id"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  uniqueIndex("order_items_resource_uidx").on(t.orderId,t.productKey,t.resourceId),
  index("order_items_order_idx").on(t.orderId),
  index("order_items_resource_idx").on(t.productKey,t.resourceId)
]);

export const downloadEntitlements = pgTable("download_entitlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  orderId: uuid("order_id").notNull().references(()=>orders.id),
  orderItemId: uuid("order_item_id").notNull().references(()=>orderItems.id),
  // Legacy CardeLume link retained only for backward compatibility/reporting.
  cardId: uuid("card_id").references(()=>cards.id),
  assetKind: text("asset_kind").notNull().default("final"),
  downloadName: text("download_name"),
  contentType: text("content_type"),
  finalObjectKey: text("final_object_key").notNull(),
  idempotencyKey: text("idempotency_key"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  index("download_entitlements_order_idx").on(t.orderId),
  index("download_entitlements_order_item_idx").on(t.orderItemId),
  index("download_entitlements_card_idx").on(t.cardId),
  uniqueIndex("download_entitlements_idempotency_uidx").on(t.idempotencyKey)
]);

// Long-lived purchase recovery capability. The raw recovery token is never
// stored; only a SHA-256 hash is persisted. Access is server-only: RLS is
// enabled without an anonymous/user policy in the migration.
export const purchaseRecoveries = pgTable("purchase_recoveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(()=>orders.id),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", {withTimezone:true}).notNull(),
  revokedAt: timestamp("revoked_at", {withTimezone:true}),
  lastClaimedAt: timestamp("last_claimed_at", {withTimezone:true}),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  uniqueIndex("purchase_recoveries_order_uidx").on(t.orderId),
  uniqueIndex("purchase_recoveries_token_hash_uidx").on(t.tokenHash),
  index("purchase_recoveries_user_idx").on(t.userId)
]);

// A successful claim mints a separate browser-session secret. This avoids
// putting the durable email recovery token into localStorage or keeping it in
// the visible URL after the claim redirect.
export const recoverySessions = pgTable("recovery_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  recoveryId: uuid("recovery_id").notNull().references(()=>purchaseRecoveries.id),
  sessionHash: text("session_hash").notNull(),
  expiresAt: timestamp("expires_at", {withTimezone:true}).notNull(),
  revokedAt: timestamp("revoked_at", {withTimezone:true}),
  lastUsedAt: timestamp("last_used_at", {withTimezone:true}),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  uniqueIndex("recovery_sessions_hash_uidx").on(t.sessionHash),
  index("recovery_sessions_recovery_idx").on(t.recoveryId)
]);

// One-time, short-lived claim used only for the payment-provider return URL.
// It may be retried while the webhook/final entitlement is still catching up,
// but is consumed once a recovery browser session is minted.
export const checkoutReturnClaims = pgTable("checkout_return_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(()=>orders.id),
  claimHash: text("claim_hash").notNull(),
  expiresAt: timestamp("expires_at", {withTimezone:true}).notNull(),
  consumedAt: timestamp("consumed_at", {withTimezone:true}),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  uniqueIndex("checkout_return_claims_order_uidx").on(t.orderId),
  uniqueIndex("checkout_return_claims_hash_uidx").on(t.claimHash)
]);


export const photoAssets = pgTable("photo_assets", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  status: text("status").notNull().default("uploading"),
  originalName: text("original_name"),
  sourceContentType: text("source_content_type").notNull(),
  sourceSizeBytes: integer("source_size_bytes").notNull(),
  quarantineObjectKey: text("quarantine_object_key").notNull(),
  cleanObjectKey: text("clean_object_key").notNull(),
  cleanContentType: text("clean_content_type"),
  cleanSizeBytes: integer("clean_size_bytes"),
  width: integer("width"),
  height: integer("height"),
  sha256: text("sha256"),
  completionTokenHash: text("completion_token_hash").notNull(),
  failureCode: text("failure_code"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull(),
  readyAt: timestamp("ready_at", {withTimezone:true}),
  deletedAt: timestamp("deleted_at", {withTimezone:true})
}, (t) => [
  uniqueIndex("photo_assets_completion_token_uidx").on(t.completionTokenHash),
  uniqueIndex("photo_assets_quarantine_key_uidx").on(t.quarantineObjectKey),
  uniqueIndex("photo_assets_clean_key_uidx").on(t.cleanObjectKey),
  index("photo_assets_user_created_idx").on(t.userId,t.createdAt),
  index("photo_assets_cleanup_idx").on(t.status,t.createdAt)
]);

export const cardAssetBindings = pgTable("card_asset_bindings", {
  resourceVersionId: uuid("resource_version_id").notNull().references(()=>cardVersions.id),
  assetId: uuid("asset_id").notNull().references(()=>photoAssets.id),
  role: text("role").notNull().default("photo"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  uniqueIndex("card_asset_bindings_resource_asset_uidx").on(t.resourceVersionId,t.assetId),
  index("card_asset_bindings_asset_idx").on(t.assetId)
]);

export const requestRateBuckets = pgTable("request_rate_buckets", {
  bucketKey: text("bucket_key").notNull(),
  subjectKey: text("subject_key").notNull(),
  windowStart: timestamp("window_start", {withTimezone:true}).notNull(),
  requestCount: integer("request_count").notNull().default(0),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
}, (t) => [
  primaryKey({columns:[t.bucketKey,t.subjectKey,t.windowStart]}),
  index("request_rate_buckets_cleanup_idx").on(t.windowStart)
]);

export const workerHeartbeats = pgTable("worker_heartbeats", {
  nodeId: text("node_id").primaryKey(),
  version: text("version").notNull(),
  activeJobs: integer("active_jobs").notNull().default(0),
  lastSeenAt: timestamp("last_seen_at", {withTimezone:true}).defaultNow().notNull()
});

export const templateFamilies = pgTable("template_families", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
},(t)=>[uniqueIndex("template_families_slug_uidx").on(t.slug)]);

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey(),
  familyId: uuid("family_id").notNull().references(()=>templateFamilies.id),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  material: text("material").notNull().default(""),
  status: text("status").notNull().default("draft"),
  launchStatus: text("launch_status").notNull().default("candidate"),
  health: text("health").notNull().default("healthy"),
  photoMode: text("photo_mode").notNull().default("none"),
  editorialScore: integer("editorial_score").notNull().default(80),
  maturity: text("maturity").notNull().default("new"),
  currentVersionId: uuid("current_version_id"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull(),
  archivedAt: timestamp("archived_at", {withTimezone:true})
},(t)=>[uniqueIndex("templates_slug_uidx").on(t.slug),index("templates_status_health_idx").on(t.status,t.health)]);

export const templateVersions = pgTable("template_versions", {
  id: uuid("id").primaryKey(),
  templateId: uuid("template_id").notNull().references(()=>templates.id),
  version: integer("version").notNull(),
  rendererTemplateKey: text("renderer_template_key").notNull(),
  visualDirection: text("visual_direction").notNull(),
  supportedFormats: jsonb("supported_formats").notNull(),
  scriptSupport: jsonb("script_support").notNull(),
  headlineCapacity: text("headline_capacity").notNull(),
  bodyCapacity: text("body_capacity").notNull(),
  previewAsset: text("preview_asset"),
  validationStatus: text("validation_status").notNull().default("pending"),
  validationNotes: text("validation_notes"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
},(t)=>[uniqueIndex("template_versions_template_version_uidx").on(t.templateId,t.version),uniqueIndex("template_versions_template_id_pair_uidx").on(t.templateId,t.id)]);

export const templateTargeting = pgTable("template_targeting", {
  templateId: uuid("template_id").notNull().references(()=>templates.id),
  dimension: text("dimension").notNull(),
  targetKey: text("target_key").notNull(),
  affinity: numeric("affinity",{precision:5,scale:4}).notNull().default("0")
},(t)=>[primaryKey({columns:[t.templateId,t.dimension,t.targetKey]})]);

export const templateEvents = pgTable("template_events", {
  id: uuid("id").primaryKey(),
  templateId: uuid("template_id").notNull().references(()=>templates.id),
  templateVersionId: uuid("template_version_id").notNull().references(()=>templateVersions.id),
  eventType: text("event_type").notNull(),
  source: text("source").notNull(),
  market: text("market").notNull(),
  locale: text("locale").notNull(),
  rankPosition: integer("rank_position"),
  dedupeKey: text("dedupe_key"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
},(t)=>[index("template_events_rollup_schema_idx").on(t.templateId,t.createdAt),uniqueIndex("template_events_dedupe_schema_uidx").on(t.dedupeKey)]);

export const templateMetricsDaily = pgTable("template_metrics_daily", {
  day: date("day").notNull(),
  templateId: uuid("template_id").notNull().references(()=>templates.id),
  market: text("market").notNull(),
  source: text("source").notNull(),
  impressions: integer("impressions").notNull().default(0),
  selected: integer("selected").notNull().default(0),
  aiAssigned: integer("ai_assigned").notNull().default(0),
  checkoutStarted: integer("checkout_started").notNull().default(0),
  paid: integer("paid").notNull().default(0),
  regenerated: integer("regenerated").notNull().default(0),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
},(t)=>[primaryKey({columns:[t.day,t.templateId,t.market,t.source]})]);

export const styleFingerprints = pgTable("style_fingerprints", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  templateId: uuid("template_id").notNull().references(()=>templates.id),
  templateVersionId: uuid("template_version_id").notNull().references(()=>templateVersions.id),
  familyId: uuid("family_id").notNull().references(()=>templateFamilies.id),
  visualDirection: text("visual_direction").notNull(),
  accentMode: text("accent_mode"),
  source: text("source").notNull(),
  sourceKey: text("source_key"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
},(t)=>[index("style_fingerprints_user_recent_schema_idx").on(t.userId,t.createdAt),uniqueIndex("style_fingerprints_source_key_schema_uidx").on(t.sourceKey)]);

export const generationAiUsage = pgTable("generation_ai_usage", {
  id: uuid("id").primaryKey(),
  generationJobId: uuid("generation_job_id").notNull(),
  phase: text("phase").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  latencyMs: integer("latency_ms").notNull(),
  estimatedCostMicros: integer("estimated_cost_micros"),
  success: boolean("success").notNull(),
  errorCode: text("error_code"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
},(t)=>[index("generation_ai_usage_job_schema_idx").on(t.generationJobId,t.createdAt)]);
