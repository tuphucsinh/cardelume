import fs from 'node:fs';
const studio=fs.readFileSync('apps/web/components/card-studio.tsx','utf8');
const schema=fs.readFileSync('packages/card-schema/src/index.ts','utf8');
const worker=fs.readFileSync('apps/worker/src/index.ts','utf8');
const rewrite=fs.readFileSync('apps/web/app/api/rewrite/route.ts','utf8');
const templates=fs.readFileSync('packages/templates/src/index.ts','utf8');
const home=fs.readFileSync('apps/web/app/page.tsx','utf8');
const assertions=[
  [!studio.includes('openTemplateBrowser'),'customer_template_browser_removed'],
  [!studio.includes('TemplateGroup'),'customer_template_grid_removed'],
  [studio.includes('void generate(true)'),'three_new_directions_cta'],
  [schema.includes('refreshContext:z.object'),'refresh_context_schema'],
  [worker.includes('Refresh evidence is intentionally soft'),'refresh_is_soft_not_veto'],
  [studio.includes('rewriteTone("warmer")')&&!studio.includes('rewriteTone("playful")'),'single_refine_action_not_tone_menu'],
  [rewrite.includes('Never invent memories')&&rewrite.includes('same language'),'rewrite_fact_language_guard'],
  [rewrite.includes('checkUserRateLimit("rewrite"'),'rewrite_rate_limit'],
  [!studio.includes('PhysicalEffectsControl'),'physical_effects_not_customer_control'],
  [studio.includes('customOccasion')&&studio.includes('customRelation'),'low_friction_custom_personalization'],
  [templates.includes('featuredTemplatesForEnvironment')&&templates.includes('t.launchStatus==="approved"'),'production_marketing_approved_only'],
  [home.includes('step17jShowcaseTemplatesForEnvironment(process.env.APP_ENV)'),'homepage_uses_step17j_showroom_gate'],
  [home.includes('marketingTemplates.length>0')&&home.includes('marketingTemplates.slice(0,16)'),'homepage_showroom_bounded_to_16'],
  [home.includes('hero-material-stage')&&home.includes('marketingTemplates[0]')&&home.includes('hero-brand-object'),'hero_uses_one_approved_material_object_or_brand_fallback'],
  [studio.includes('customerRationale')&&!studio.includes('generated?.creativeThesis'),'customer_safe_rationale_only'],
  [studio.includes('messageUndo')&&studio.includes('undoMessage'),'rewrite_has_undo'],
  [studio.includes('messageRef.current!==sourceMessage'),'rewrite_does_not_clobber_inflight_manual_edit'],
  [studio.includes('reveal-folio')&&studio.includes('viewTransitionName:`card-'),'folio_reveal_to_results_transition'],
  [studio.includes('Print layout (optional)')&&studio.includes('no physical card')&&studio.includes('print-layout-picker'),'digital_print_layout_visual_clarity'],
  [studio.includes('useState<""|(typeof relations)[number]>("")'),'relationship_has_neutral_default'],
  [(studio.match(/onClick=\{\(\)=>setAccentMode\(/g)||[]).length<=3,'finish_color_choices_reduced'],
  [studio.includes('data-phase-focus')&&studio.includes('querySelector<HTMLElement>("[data-phase-focus]")'),'phase_focus_management'],
  [fs.readFileSync('apps/web/app/d/[recoveryId]/page.tsx','utf8').includes('recovery-keepsake'),'post_pay_keepsake_handoff'],
  [templates.includes('step17jPortfolioSlugs')&&templates.includes('materialWorld'),'step17j_material_portfolio_metadata'],
  [home.includes('gallery-world-${t.materialWorld}')&&home.includes('gallery-physical'),'step17j_041_showroom_presentation'],
  [studio.includes('palette-feedback show')||studio.includes('palette-feedback show'), 'palette_feedback_present']
];
for(const [ok,name] of assertions)if(!ok)throw new Error(`product_ux_source_failed:${name}`);
console.log(JSON.stringify({ok:true,checks:assertions.length},null,2));
