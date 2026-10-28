export const enum ShaderSourceType {
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
