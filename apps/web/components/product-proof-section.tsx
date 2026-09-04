"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, FileText, ShieldCheck, Download } from "lucide-react";
import type { TemplateMeta } from "@cardelume/templates";
import { withoutRecipient, type LocaleCode, type Messages } from "../i18n/messages";
import { launchCopy } from "../i18n/launch-copy";
import { CardVisual } from "./card-visual";
import { PhysicalCardSurface } from "./physical-effects";
import {
  getValidProductProofCases,
  getRetainedMvpTemplates,
  getLocalizedStyleDisplay,
  type ProofCase
} from "../content/product-proof";

export type ProductProofMessages = {
  home: Pick<Messages["home"], "galleryCta">;
  studio: Pick<Messages["studio"], "occasion" | "recipient" | "feel" | "detail" | "copy">;
};

type Props = {
  locale: LocaleCode;
  messages: ProductProofMessages;
  createHref: string;
  templates: TemplateMeta[];
  isProduction?: boolean;
};

export function ProductProofSection({ locale, messages, createHref, templates, isProduction = false }: Props) {
  const launch = launchCopy(locale);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const proofCases = getValidProductProofCases(templates, isProduction);

  if (proofCases.length === 0) {
    return null;
  }

  const activeCase: ProofCase = proofCases[activeCaseIndex] ?? proofCases[0];
  const retainedTemplates = getRetainedMvpTemplates(templates);

  const matchedChosen = templates.find(
    (t) =>
      t.id === activeCase.provenance.templateId &&
      t.versionId === activeCase.provenance.versionId
  );
  const provId = matchedChosen ? matchedChosen.id : activeCase.provenance.templateId;
  const provVersion = matchedChosen ? matchedChosen.version : activeCase.provenance.version;

  const samples = [
    { k: messages.studio.copy.birthdayKicker, h: messages.studio.copy.editorialHeadline, b: messages.studio.copy.editorialBody },
    { k: messages.studio.copy.birthdayKicker, h: messages.studio.copy.midnightHeadline, b: messages.studio.copy.midnightBody },
    { k: messages.studio.copy.birthdayKicker, h: withoutRecipient(messages.studio.copy.birthdayHeadline), b: messages.studio.copy.birthdayBody },
    { k: messages.studio.copy.thankKicker, h: withoutRecipient(messages.studio.copy.thankHeadline), b: messages.studio.copy.thankBody },
    { k: messages.studio.copy.anniversaryKicker, h: withoutRecipient(messages.studio.copy.anniversaryHeadline), b: messages.studio.copy.anniversaryBody },
    { k: messages.studio.copy.congratsKicker, h: messages.studio.copy.editorialHeadline, b: messages.studio.copy.congratsBody },
    { k: messages.studio.copy.birthdayKicker, h: messages.studio.copy.photoHeadline, b: messages.studio.copy.photoBody },
    { k: messages.studio.copy.formalBirthdayKicker, h: withoutRecipient(messages.studio.copy.formalBirthdayHeadline), b: messages.studio.copy.formalBirthdayBody }
  ];

  return (
    <section className="paper-section gallery-showroom deferred-section product-proof-section" id="styles">
      {/* Proof Section Head */}
      <div className="shell section-head gallery-head">
        <div>
          <span className="eyebrow"><Sparkles size={14} />{launch.proofEyebrow}</span>
          <h2>
            <span className="display-line">{launch.proofTitleA}</span>{" "}
            <span className="display-line"><em>{launch.proofTitleB}</em></span>
          </h2>
        </div>
        <p>{launch.proofSubtitle}</p>
      </div>

      {/* Proof Case Tabs & Interactive Showcase */}
      <div className="shell proof-stage-container" style={{ marginBottom: "56px" }}>
        {/* Case selector tabs */}
        <div
          className="proof-tab-list"
          role="tablist"
          aria-label={launch.tabCaseAria}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "28px",
            padding: "6px",
            background: "rgba(11,23,48,0.04)",
            borderRadius: "16px",
            width: "max-content",
            maxWidth: "100%"
          }}
        >
          {proofCases.map((c, index) => {
            const isSelected = index === activeCaseIndex;
            const title = launch[c.titleKey] as string;
            return (
              <button
                key={c.id}
                role="tab"
                type="button"
                id={`proof-tab-${c.id}`}
                aria-selected={isSelected}
                aria-controls={`proof-panel-${c.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveCaseIndex(index)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: isSelected ? 650 : 500,
                  border: isSelected ? "1px solid rgba(185,151,98,0.5)" : "1px solid transparent",
                  background: isSelected ? "#fff" : "transparent",
                  color: isSelected ? "var(--navy)" : "#6c6861",
                  boxShadow: isSelected ? "0 4px 14px rgba(11,23,48,0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {title}
              </button>
            );
          })}
        </div>

        {/* Active Case Panel */}
        <div
          role="tabpanel"
          id={`proof-panel-${activeCase.id}`}
          aria-labelledby={`proof-tab-${activeCase.id}`}
          className="proof-case-panel"
          style={{
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(11,23,48,0.08)",
            borderRadius: "28px",
            padding: "28px",
            boxShadow: "0 18px 44px rgba(22,25,31,0.06)"
          }}
        >
          {/* Brief Row */}
          <div
            className="proof-brief-row"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              paddingBottom: "22px",
              marginBottom: "24px",
              borderBottom: "1px solid rgba(11,23,48,0.08)"
            }}
          >
            <div>
              <small style={{ color: "#8d7756", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.1em", fontWeight: 700 }}>
                {launch.briefLabel} · {messages.studio.occasion}
              </small>
              <p style={{ margin: "4px 0 0", color: "var(--navy)", fontWeight: 600, fontSize: "14px" }}>
                {launch[activeCase.occasionKey] as string}
              </p>
            </div>
            <div>
              <small style={{ color: "#8d7756", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.1em", fontWeight: 700 }}>
                {messages.studio.recipient}
              </small>
              <p style={{ margin: "4px 0 0", color: "var(--navy)", fontWeight: 600, fontSize: "14px" }}>
                {launch[activeCase.recipientKey] as string}
              </p>
            </div>
            <div>
              <small style={{ color: "#8d7756", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.1em", fontWeight: 700 }}>
                {messages.studio.feel}
              </small>
              <p style={{ margin: "4px 0 0", color: "var(--navy)", fontWeight: 600, fontSize: "14px" }}>
                {launch[activeCase.feelingKey] as string}
              </p>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <small style={{ color: "#8d7756", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.1em", fontWeight: 700 }}>
                {messages.studio.detail}
              </small>
              <p style={{ margin: "4px 0 0", color: "#4f4c46", fontSize: "13px", lineHeight: "1.5" }}>
                &ldquo;{launch[activeCase.detailKey] as string}&rdquo;
              </p>
            </div>
          </div>

          {/* Three Directions Showcase */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--navy)", fontFamily: "var(--serif)" }}>
                {launch.directionsLabel}
              </h3>
              <span style={{ fontSize: "11px", color: "#8a8177", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {launch[activeCase.formatLabelKey] as string}
              </span>
            </div>

            <div
              className="proof-directions-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "18px"
              }}
            >
              {activeCase.directions.map((dir, idx) => {
                const isChosen = idx === activeCase.chosenIndex;
                const badgeLabel = idx === 0 ? launch.directionBadgeA : idx === 1 ? launch.directionBadgeB : launch.directionBadgeC;
                const kicker = launch[dir.kickerKey] as string;
                const headline = launch[dir.headlineKey] as string;
                const body = launch[dir.bodyKey] as string;
                const matchedTemplate = templates.find(
                  (t) =>
                    t.id === dir.templateId &&
                    t.versionId === dir.versionId &&
                    t.slug === dir.templateSlug
                );
                const dirName = matchedTemplate ? matchedTemplate.name : dir.name;
                const dirMaterial = matchedTemplate ? matchedTemplate.material : dir.material;
                const visualDirection = matchedTemplate ? matchedTemplate.visualDirection : dir.directionId;
                const display = getLocalizedStyleDisplay(locale, dirName, dirMaterial);

                return (
                  <article
                    key={dir.templateId}
                    style={{
                      background: isChosen ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)",
                      border: isChosen ? "1.5px solid rgba(185,151,98,0.65)" : "1px solid rgba(11,23,48,0.08)",
                      borderRadius: "20px",
                      padding: "14px",
                      boxShadow: isChosen ? "0 12px 32px rgba(185,151,98,0.12)" : "0 6px 18px rgba(11,23,48,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: isChosen ? "#8c6f45" : "#7c756c",
                          background: isChosen ? "rgba(185,151,98,0.14)" : "rgba(11,23,48,0.05)",
                          padding: "3px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        {badgeLabel}
                      </span>
                      {isChosen ? (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 650,
                            color: "#8c6f45",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Check size={12} /> {launch.chosenBadge}
                        </span>
                      ) : null}
                    </div>

                    <div style={{ height: "280px", display: "grid", placeItems: "center", marginBottom: "10px" }}>
                      <PhysicalCardSurface className="gallery-physical" intensity={0.88}>
                        <CardVisual
                          direction={visualDirection}
                          compact
                          locale={locale}
                          kicker={kicker}
                          headline={headline}
                          body={body}
                          photoUrl={activeCase.hasPhoto ? activeCase.photoUrl : null}
                        />
                      </PhysicalCardSurface>
                    </div>

                    <div style={{ marginTop: "auto", borderTop: "1px solid rgba(11,23,48,0.06)", paddingTop: "8px" }}>
                      <small style={{ color: "#8d7756", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                        {display.material}
                      </small>
                      <strong style={{ color: "var(--navy)", fontSize: "16px", fontFamily: "var(--serif)" }}>
                        {display.name}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Chosen & Real Delivery Details Card */}
          <div
            className="proof-delivery-box"
            style={{
              background: "linear-gradient(145deg, #f7f3eb, #ede6d8)",
              border: "1px solid rgba(185,151,98,0.32)",
              borderRadius: "18px",
              padding: "18px 22px",
              display: "flex",
              flexWrap: "wrap",
              gap: "18px",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#8c6f45", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                <ShieldCheck size={14} /> {launch.chosenFinalLabel}
              </div>
              <p style={{ margin: "2px 0 6px", color: "var(--navy)", fontSize: "13px", lineHeight: "1.5" }}>
                {launch[activeCase.chosenRationaleKey] as string}
              </p>
              <small style={{ color: "#7a7267", fontSize: "11px", display: "block" }}>
                {launch.stagingNotice} · {launch.proofRefLabel}: {activeCase.goldenRef} · {launch.proofIdLabel}: {provId.slice(0, 8)}… · {launch.proofVersionLabel}{provVersion}
              </small>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--navy)",
                  background: "#fff",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(11,23,48,0.04)"
                }}
              >
                <FileText size={14} color="#8c6f45" /> {launch.vectorPdfJpg}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--navy)",
                  background: "#fff",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(11,23,48,0.04)"
                }}
              >
                <Download size={14} color="#8c6f45" /> {launch.digitalDeliveryBadge}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Retained MVP Flagship Gallery */}
      {retainedTemplates.length > 0 ? (
        <>
          <div className="shell showroom-note">
            <span>{launch.showroomNote}</span>
            <i />
            <span>{launch.showroomSubnote}</span>
          </div>

          <div className="shell style-grid step17j-style-grid">
            {retainedTemplates.map((t, index) => {
              const display = getLocalizedStyleDisplay(locale, t.name, t.material);
              const sample = samples[index % samples.length] ?? samples[0];
              return (
                <article className={`style-card step17j-style-card gallery-world-${t.materialWorld}`} key={t.id} data-template-slug={t.slug}>
                  <div className="style-stage step17j-style-stage">
                    <PhysicalCardSurface className="gallery-physical" intensity={0.92}>
                      <CardVisual direction={t.visualDirection} compact locale={locale} kicker={sample.k} headline={sample.h} body={sample.b} />
                    </PhysicalCardSurface>
                  </div>
                  <div className="style-meta step17j-style-meta">
                    <small>{display.material}</small>
                    <h3>{display.name}</h3>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      {/* Truthful Purchase / Delivery Reassurance & CTA */}
      <div className="center-action gallery-cta" style={{ marginTop: "44px" }}>
        <Link className="button button-primary" href={createHref}>
          {messages.home.galleryCta}
        </Link>
        <div
          className="trust-row gallery-trust-row"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "14px 22px",
            marginTop: "16px",
            fontSize: "12px",
            color: "#6c6861"
          }}
        >
          <span><Check size={14} color="#8c6f45" />{launch.oneTimePayment}</span>
          <span><Check size={14} color="#8c6f45" />{launch.previewBeforePay}</span>
          <span><Check size={14} color="#8c6f45" />{launch.vectorPdfJpg}</span>
          <span><Check size={14} color="#8c6f45" />{launch.noAccountRequired}</span>
          <span><Check size={14} color="#8c6f45" />{launch.noPhysicalNotice}</span>
        </div>
        <small style={{ maxWidth: "540px", color: "#8a8177", fontSize: "11px", lineHeight: 1.5, marginTop: "8px" }}>
          {launch.gallerySubnote}
        </small>
      </div>
    </section>
  );
}
