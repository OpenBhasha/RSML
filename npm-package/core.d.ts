export declare const VERSION: string;

export type ListCategory =
  | "hesitations"
  | "isolatedParalinguistics"
  | "isolatedOther"
  | "disfluencySpans"
  | "paralinguisticSpans"
  | "prosodySpans";

export type MapCategory = "entities" | "languages" | "dialects" | "domains";

export type Category = ListCategory | MapCategory;

export type Vocabulary = { [K in ListCategory]: string[] } & {
  [K in MapCategory]: Record<string, string>;
};

export type VocabularyOverrides = Partial<{
  [K in Category]: K extends ListCategory ? readonly string[] : Readonly<Record<string, string>>;
}>;

export type CategorySpec =
  | { kind: "isolated" | "span"; tagCategory: string }
  | { kind: "map"; lowercaseKey?: boolean };

export declare const CATEGORIES: readonly Category[];
export declare const CATEGORY_SPECS: Readonly<Record<Category, CategorySpec>>;

export declare const DEFAULT_HESITATIONS: readonly string[];
export declare const DEFAULT_ISOLATED_PARALINGUISTICS: readonly string[];
export declare const DEFAULT_ISOLATED_OTHER: readonly string[];
export declare const DEFAULT_DISFLUENCY_SPANS: readonly string[];
export declare const DEFAULT_PARALINGUISTIC_SPANS: readonly string[];
export declare const DEFAULT_PROSODY_SPANS: readonly string[];
export declare const DEFAULT_ENTITY_MAP: Readonly<Record<string, string>>;
export declare const DEFAULT_LANGS: Readonly<Record<string, string>>;

export declare class VocabularyError extends Error {
  constructor(message: string);
}

export declare function categorySpec(category: string): CategorySpec;
export declare function isValidName(name: unknown): boolean;
export declare function isValidCode(code: unknown): boolean;
export declare function defaultVocabulary(): Vocabulary;
export declare function vocabularyFrom(overrides?: VocabularyOverrides | null): Vocabulary;
export declare function addEntry(
  vocabulary: Vocabulary,
  category: Category,
  value: string,
  label?: string,
): boolean;
export declare function removeEntry(vocabulary: Vocabulary, category: Category, value: string): boolean;

export type TagUse = {
  kind: "isolated" | "span" | "entity" | "language" | "dialect" | "domain" | "accent";
  name: string;
};

export declare const BRACKET_TAG_RE: RegExp;
export declare const AT_TAG_RE: RegExp;
export declare const SPEAKER_TAG_RE: RegExp;
export declare function matchBracket(text: string, start: number, open: string, close: string): number;
export declare function findTagUses(text: string): TagUse[];
export declare function usesEntry(use: TagUse, category: Category, value: string): boolean;
export declare function countEntryUses(text: string, category: Category, value: string): number;
