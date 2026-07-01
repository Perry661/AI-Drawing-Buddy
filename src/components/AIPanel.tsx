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

  return (
    <section className="aiPanel" aria-label="AI critique">
      <div className="panelHeader">
        <h2>AI Art Director</h2>
        <button type="button" onClick={props.onCritique} disabled={props.loadingCritique}>
          {props.loadingCritique ? "Thinking..." : "Get Critique"}
        </button>
      </div>

      {props.error ? <p className="errorText">{props.error}</p> : null}
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
            className={props.selectedSuggestionId === suggestion.id ? "suggestion activeSuggestion" : "suggestion"}
            onClick={() => props.onSelectSuggestion(suggestion)}
          >
            <strong>{suggestion.title}</strong>
            <span>{suggestion.reasoning}</span>
          </button>
        ))}
      </div>

      <div className="aiActions">
        <button type="button" onClick={props.onDemonstrate} disabled={!selected || props.loadingRevision}>
          {props.loadingRevision ? "Generating revision..." : "Show Me"}
        </button>
        <button type="button" onClick={props.onApplyRevision} disabled={!props.hasRevision}>
          Apply Revision
        </button>
      </div>
    </section>
  );
}
