"use client";

import type { CritiqueResponse, Suggestion } from "@/lib/ai/schemas";

type AIPanelProps = {
  critique: CritiqueResponse | null;
  selectedSuggestionId: string | null;
  loadingCritique: boolean;
  loadingRevision: boolean;
  error: string | null;
  hasRevision: boolean;
  onCritique: () => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  onDemonstrate: () => void;
  onApplyRevision: () => void;
};

export function AIPanel(props: AIPanelProps) {
  const selected = props.critique?.suggestions.find((suggestion) => suggestion.id === props.selectedSuggestionId) ?? null;
  const loading = props.loadingCritique || props.loadingRevision;

  return (
    <section className="aiPanel" aria-label="AI critique">
      <div className="panelHeader">
        <h2>AI Art Director</h2>
        <button type="button" onClick={props.onCritique} disabled={loading}>
          {props.loadingCritique ? "Thinking..." : "Get Critique"}
        </button>
      </div>

      {props.error ? (
        <p className="errorText" role="alert">
          {props.error}
        </p>
      ) : null}
      {props.critique ? (
        <p className="summaryText">{props.critique.summary}</p>
      ) : (
        <p className="mutedText">Ask for critique when you want a second set of eyes.</p>
      )}

      <div className="suggestionList">
        {props.critique?.suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            disabled={loading}
            className={props.selectedSuggestionId === suggestion.id ? "suggestion activeSuggestion" : "suggestion"}
            aria-pressed={props.selectedSuggestionId === suggestion.id}
            onClick={() => props.onSelectSuggestion(suggestion)}
          >
            <strong>{suggestion.title}</strong>
            <span>{suggestion.reasoning}</span>
          </button>
        ))}
      </div>

      <div className="aiActions">
        <button
          type="button"
          onClick={props.onDemonstrate}
          disabled={!selected || loading}
        >
          {props.loadingRevision ? "Generating revision..." : "Show Me"}
        </button>
        <button
          type="button"
          onClick={props.onApplyRevision}
          disabled={!props.hasRevision || loading}
        >
          Apply Revision
        </button>
      </div>
    </section>
  );
}
