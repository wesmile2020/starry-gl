import { SourceItem, ShaderSourceType } from '@/config/ShaderSourceType';

import meshVertex from './mesh.vertex.wgsl';
import meshFragment from './mesh.fragment.wgsl';
import lineVertex from './line.vertex.wgsl';
import lineFragment from './line.fragment.wgsl';
import symbolVertex from './symbol.vertex.wgsl';
import symbolFragment from './symbol.fragment.wgsl';

export const ShaderSource: Record<number, SourceItem> = {
  [ShaderSourceType.mesh]: { vertex: meshVertex, fragment: meshFragment },
  [ShaderSourceType.point]: { vertex: '', fragment: '' },
  [ShaderSourceType.line]: { vertex: lineVertex, fragment: lineFragment },
  [ShaderSourceType.symbol]: { vertex: symbolVertex, fragment: symbolFragment },
};
