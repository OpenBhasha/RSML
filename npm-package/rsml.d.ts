import type { Category, Vocabulary } from "./core.js";

export type RenderMode = "normalized" | "verbatim";

export type RSMLAnnotatorOptions = {
  textarea: HTMLTextAreaElement | string;
  output: HTMLElement | string;
  hesitations?: string[];
  isolatedParalinguistics?: string[];
  isolatedOther?: string[];
  disfluencySpans?: string[];
  paralinguisticSpans?: string[];
  prosodySpans?: string[];
  entities?: Record<string, string>;
  languages?: Record<string, string>;
  dialects?: Record<string, string>;
  domains?: Record<string, string>;
  demoText?: boolean;
  disableCodeMirror?: boolean;
  renderMode?: RenderMode;
  hideDisfluencies?: boolean;
  toolbar?: boolean;
  alwaysShowStatus?: boolean;
  onChange?: (value: string) => void;
  preferredLanguage?: string | null;
  accents?: Record<string, string>;
};

declare class RSMLAnnotator {
  constructor(options: RSMLAnnotatorOptions);
  readonly opts: Vocabulary & {
    textarea: HTMLTextAreaElement | string;
    output: HTMLElement | string;
    tags: string[];
  };
  destroy(): void;
  setValue(value: string): void;
  getValue(): string;
  undo(): boolean | undefined;
  redo(): boolean | undefined;
  add(category: Category, value: string, label?: string): boolean;
  remove(category: Category, value: string): boolean;
  setRenderMode(mode: RenderMode): void;
  setHideDisfluencies(hide: boolean): void;
  setPreferredLanguage(code: string | null): void;
  setAccents(accents: Record<string, string>): void;
}

export default RSMLAnnotator;
