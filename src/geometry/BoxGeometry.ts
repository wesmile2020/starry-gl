import { Float32BufferAttribute } from './BufferAttribute';
import { BufferGeometry } from './BufferGeometry';

class BoxGeometry extends BufferGeometry {
  constructor(width: number = 10, height: number = 10, depth: number = 10) {
    super();

    const x = width / 2;
    const y = height / 2;
    const z = depth / 2;

    const vertices: number[] = [
      -x, y, z,
      -x, -y, z,
      x, -y, z,
      x, y, z,
    ];

    const uvs: number[] = [
      0, 1,
      0, 0,
      1, 0,
      1, 1,
    ];

    const normals: number[] = [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ];

    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];

    this.setAttribute('a_position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('a_uv', new Float32BufferAttribute(uvs, 2));
    this.setAttribute('a_normal', new Float32BufferAttribute(normals, 3));
    this.setIndex(indices);
  }
}

export { BoxGeometry };
