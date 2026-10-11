/**
 * One caption line = one sentence of the script, in GLOBAL seconds.
 *
 *   id        unique, e.g. "C02-1"
 *   text      exact sentence text (words split on single spaces)
 *   start/end first word start / speech end
 *   emphasis  words drawn gold (compared lower-case, letters and digits only); the film's
 *             LAST line defaults to its last word
 *   words     each word's start (seconds), same count as text.split(" "); else spread by length
 *   phrases   word indices where a spoken phrase starts; a sentence too long for MAX_ROWS rows
 *             is paged at these (see captions/pages.ts)
 */
export type CaptionLine = {
  id: string;
  text: string;
  start: number;
  end: number;
  emphasis?: string[];
  words?: number[];
  phrases?: number[];
};
