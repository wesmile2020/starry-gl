export const enum EShaderSourceType {
  custom,
  line,
  mesh,
  point,
  symbol,
}

export interface SourceItem {
  vertex: string;
  fragment: string;
}

