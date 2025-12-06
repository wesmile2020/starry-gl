import { SourceItem, EShaderSourceType } from '@/config/ShaderSourceType';

import meshVertex from './mesh.vertex.wgsl';
import meshFragment from './mesh.fragment.wgsl';
import lineVertex from './line.vertex.wgsl';
import lineFragment from './line.fragment.wgsl';
import symbolVertex from './symbol.vertex.wgsl';
import symbolFragment from './symbol.fragment.wgsl';

export const ShaderSource: Record<number, SourceItem> = {
  [EShaderSourceType.mesh]: { vertex: meshVertex, fragment: meshFragment },
  [EShaderSourceType.point]: { vertex: '', fragment: '' },
  [EShaderSourceType.line]: { vertex: lineVertex, fragment: lineFragment },
  [EShaderSourceType.symbol]: { vertex: symbolVertex, fragment: symbolFragment },
};
