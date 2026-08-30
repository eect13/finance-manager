export type FontSource = "google" | "upload";

export type Axis = {
  tag: string;
  min: number;
  max: number;
  def: number;
};

export type FontRecord = {
  id: string;
  family: string;
  source: FontSource;
  category: string;
  stroke: string;
  variants: string[];
  axes: Axis[];
  subsets: string[];
  designers: string[];
  popularity: number;
  fileSize: number;
  added: string;
  tags: string[];
  license: string;
  italic: boolean;
  weight: number;
  features?: string[];
  glyphCount?: number;
  fileName?: string;
  uploadId?: string;
};

export type CompactGoogle = {
  f: string;
  c: string;
  s: string;
  v: string[];
  a: [string, number, number, number][];
  u: string[];
  d: string[];
  p: number;
  z: number;
  n: string;
  k: string[];
};

export type Collection = {
  id: string;
  name: string;
  familyIds: string[];
};

export type ScopeKind =
  | "all"
  | "recent"
  | "favorites"
  | "active"
  | "inactive"
  | "uploads"
  | "google"
  | "category"
  | "collection";

export type Scope = {
  kind: ScopeKind;
  value?: string;
};

export type AppTab = "library" | "playground" | "glyphs" | "duplicates";

export type SortKey = "popular" | "name" | "newest";

export type ViewMode = "grid" | "list";
