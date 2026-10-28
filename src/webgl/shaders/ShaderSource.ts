import { ShaderSourceType,  SourceItem } from '@/config/ShaderSourceType';

import lineVS from './line.vs';
import lineFS from './line.fs';
import meshVS from './mesh.vs';
import meshFS from './mesh.fs';
import pointVS from './point.vs';
import pointFS from './point.fs';
import symbolVS from './symbol.vs';
import symbolFS from './symbol.fs';

const ShaderSource: Record<number, SourceItem> = {
  [ShaderSourceType.line]: { vertex: lineVS, fragment: lineFS },
  [ShaderSourceType.mesh]: { vertex: meshVS, fragment: meshFS },
  [ShaderSourceType.point]: { vertex: pointVS, fragment: pointFS },
  [ShaderSourceType.symbol]: { vertex: symbolVS, fragment: symbolFS },
};

export { ShaderSource };
