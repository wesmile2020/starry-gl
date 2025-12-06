import { BufferGeometry } from './BufferGeometry';
import { createRectGeometry } from '@/utils/utils';
import { ArrayPoint } from '@/interfaces/GeometryType';
import { Float32BufferAttribute, Uint8BufferAttribute } from './BufferAttribute';
import { EAnchor } from '@/config/define';

class SymbolGeometry extends BufferGeometry {
  constructor(position: ArrayPoint = [0, 0, 0], size: [number, number] = [10, 10], anchor: EAnchor = EAnchor.center) {
    super();
    const geometry = createRectGeometry(position, size[0], size[1], anchor);
    this.setAttribute('a_position', new Float32BufferAttribute(geometry.vertices, 3));
    this.setAttribute('a_uv', new Float32BufferAttribute(geometry.uvs, 2));
    this.setIndex(new Uint8BufferAttribute(geometry.indices, 1));
  }
}

export { SymbolGeometry };
