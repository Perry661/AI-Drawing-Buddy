"use client";

import type { PixelMatrix } from "@/lib/pixel/types";

export type RevisionItem = {
  id: string;
  label: string;
  explanation: string;
  matrix: PixelMatrix;
};

type RevisionHistoryProps = {
  revisions: RevisionItem[];
  onSelect: (revision: RevisionItem) => void;
};

export function RevisionHistory({ revisions, onSelect }: RevisionHistoryProps) {
  return (
    <section className="historyPanel" aria-label="Revision history">
      <h2>Revision History</h2>
      {revisions.length === 0 ? <p className="mutedText">Generated revisions will appear here.</p> : null}
      <div className="historyList">
        {revisions.map((revision) => (
          <button key={revision.id} type="button" onClick={() => onSelect(revision)}>
            <strong>{revision.label}</strong>
            <span>{revision.explanation}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
