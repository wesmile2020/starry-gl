import earcut from 'earcut';
import { MathUtils } from 'starry-math';
import { BufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute } from './BufferAttribute';
import { BufferGeometry } from './BufferGeometry';
import { arrayNeedsUint32, offsetArray, getNormalVector } from '@/utils/utils';
import { ArrayPoint, PartialArrayPoint } from '@/interfaces/GeometryType';

function getVertexByOffset(point: PartialArrayPoint, offset: ArrayPoint): ArrayPoint {
  return [
    point[0] + offset[0],
    point[1] + offset[1],
    (point[2] ?? 0) + offset[2],
  ];
}

/**
 * 判断是否首尾相连
 * @param ring 点组
 * @returns boolean
 */
function isRing(ring: PartialArrayPoint[]) {
  const first = ring[0];
  const end = ring[ring.length - 1];
  return first[0] === end[0] && first[1] === end[1];
}

class PolygonGeometry extends BufferGeometry {
  private _outlineIndex?: BufferAttribute;

  constructor(polygon: PartialArrayPoint[][] = [], depth: number = 0, offset: ArrayPoint = [0, 0, 0]) {
    super();
    const { vertices, indices, normals, outlineIndices } = PolygonGeometry.calculate(polygon, depth, offset);
    this.setAttribute('a_position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('a_normal', new Float32BufferAttribute(normals, 3));
    this.setIndex(indices);
    this.setOutlineIndex(outlineIndices);
  }

  setOutlineIndex(indices: ArrayLike<number>) {
    const isUnit32 = arrayNeedsUint32(indices);
    if (isUnit32) {
      this._outlineIndex = new Uint32BufferAttribute(indices, 1);
    } else {
      this._outlineIndex = new Uint16BufferAttribute(indices, 1);
    }
  }

  getOutlineIndex() {
    return this._outlineIndex;
  }

  static calculate(polygon: PartialArrayPoint[][], depth: number, offset: ArrayPoint) {
    const vertices: number[] = [];
    const normals: number[] = [];
    const holes: number[] = [];

    const slideVertices: number[] = [];
    const slideNormals: number[] = [];
    const slideIndices: number[] = [];
    const outlineIndices: number[] = [];

    for (let i = 0; i < polygon.length; i += 1) {
      const ring = polygon[i];
      if (ring.length > 2) {
        const verticesCount = vertices.length / 3;
        if (i > 0) {
          holes.push(verticesCount);
        }
        const max = isRing(ring) ? ring.length - 1 : ring.length;
        const clockWise = MathUtils.isClockWiseRing(ring);
        if (clockWise) {
          ring.reverse();
        }
        for (let j = 0; j < max; j += 1) {
          if (j < max - 1) {
            outlineIndices.push(verticesCount + j, verticesCount + j + 1);
          } else {
            outlineIndices.push(verticesCount + j, verticesCount);
          }

          const current = getVertexByOffset(ring[j], offset);
          vertices.push(current[0], current[1], depth);
          normals.push(0, 0, 1);
          if (depth !== 0) {
            const slideCount = slideVertices.length / 3;
            const originNext = j < max - 1 ? ring[j + 1] : ring[0];
            const next = getVertexByOffset(originNext, offset);
            const normalVector = getNormalVector(current, next);
            slideVertices.push(
              current[0], current[1], 0,
              current[0], current[1], depth,
              next[0], next[1], 0,
              next[0], next[1], depth,
            );
            slideNormals.push(
              normalVector.x, normalVector.y, 0,
              normalVector.x, normalVector.y, depth,
              normalVector.x, normalVector.y, 0,
              normalVector.x, normalVector.y, depth,
            );
            slideIndices.push(
              slideCount + 1, slideCount + 0, slideCount + 2,
              slideCount + 1, slideCount + 2, slideCount + 3,
            );
          }
        }
      }
    }
    const indices = earcut(vertices, holes, 3);
    const oldCount = vertices.length / 3;
    vertices.push(...slideVertices);
    normals.push(...slideNormals);
    indices.push(...offsetArray(slideIndices, oldCount));

    return { vertices, normals, indices, outlineIndices };
  }
}

export { PolygonGeometry };
