/**
 * Chapter id -> component for the full film. A chapter that is not listed here renders
 * <ChapterPlaceholder> (id, title, counter range, a progress arc), so the film always plays.
 *
 * To register chapter C03 (component in src/film/chapters/C03/index.tsx, `export const C03`):
 *   1. add   import { C03 } from "./chapters/C03";
 *   2. add   C03,   inside CHAPTER_COMPONENTS
 * One line each, keep them sorted. Only the orchestrator edits this file. Chapter previews do
 * NOT read it, so a broken chapter can only break the full film render, never another preview.
 */
import type React from "react";
import type { ChapterId } from "./chapters";
import { placeholderFor } from "./Placeholder";

// --- chapter imports (one per line, sorted) ---
import { C01 } from "./chapters/C01";
import { C02 } from "./chapters/C02";

export const CHAPTER_COMPONENTS: Partial<Record<ChapterId, React.FC>> = {
  // --- registered chapters (one per line, sorted) ---
  C01,
  C02,
};

export const chapterComponent = (id: ChapterId): React.FC => CHAPTER_COMPONENTS[id] ?? placeholderFor(id);
