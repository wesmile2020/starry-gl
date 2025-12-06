import { MathUtils } from 'starry-math';
import { ArrayPoint, PartialArrayPoint } from '@/interfaces/GeometryType';
import { BufferGeometry } from './BufferGeometry';
import { getNormalVector } from '@/utils/utils';
import { Float32BufferAttribute } from './BufferAttribute';

function getVertexByOffset(point: PartialArrayPoint, offset: ArrayPoint): ArrayPoint {
  return [
    point[0] + offset[0],
    point[1] + offset[1],
    (point[2] ?? 0) + offset[2],
  ];
}

function getDistance(start: ArrayPoint, end: ArrayPoint) {
  const x = end[0] - start[0];
  const y = end[1] - start[1];
  const z = end[2] - start[2];
  return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
}

function calculateJoin(p0: ArrayPoint, p1: ArrayPoint, p2: ArrayPoint, indexOffset: number) {
  const clockWise = MathUtils.isClockWise(p0, p1, p2);
  const side = clockWise ? -1 : 1;
  const normal1 = getNormalVector(p0, p1).multiplyScalar(side);
  const normal2 = getNormalVector(p1, p2).multiplyScalar(side);

  const normal = normal1.clone().add(normal2).unit();
  let angle = Math.abs(normal1.angleTo(normal2));
  angle = Math.min(angle, 120 / 180 * Math.PI);

  const num = 1 / Math.cos(angle / 2);
  normal.multiplyScalar(num);

  const vertices: number[] = [
    p1[0], p1[1], p1[2],
    p1[0], p1[1], p1[2],
    p1[0], p1[1], p1[2],
    p1[0], p1[1], p1[2],
  ];
  const normals: number[] = [
    0, 0,
    normal1.x, normal1.y,
    normal2.x, normal2.y,
    normal.x, normal.y,
  ];
  const joins = [
    0, 0,
    normal1.x, normal1.y,
    normal2.x, normal2.y,
    normal.x, normal.y,
  ];
  const uvs = [
    0, 0.5,
    0, 0,
    0, 0,
    0, 0,
  ];
  let indices: number[] = [];
  if (clockWise) {
    indices = [
      indexOffset + 0, indexOffset + 2, indexOffset + 1,
      indexOffset + 1, indexOffset + 2, indexOffset + 3,
    ];
  } else {
    indices = [
      indexOffset + 0, indexOffset + 1, indexOffset + 2,
      indexOffset + 2, indexOffset + 1, indexOffset + 3,
    ];
  }

  return { indices, vertices, normals, joins, uvs };
}

/**
 * 将线分成多个三角形
 * 被裁减的line join的三角形index满足 (index - 3) % 4 = 0
 * ------------------------
 *        1     |       3 |
 * 0            |   2     |
 * ------------ |         |
 *              |  4      |
 *              |         |
 *              |        5|
 */
class PolylineGeometry extends BufferGeometry {
  constructor(positions: PartialArrayPoint[] = [], offset: ArrayPoint = [0, 0, 0]) {
    super();
    const { vertices, indices, normals, joins, uvs } = PolylineGeometry.calculate(positions, offset);
    this.setAttribute('a_position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('a_normal', new Float32BufferAttribute(normals, 2));
    this.setAttribute('a_join', new Float32BufferAttribute(joins, 2));
    this.setAttribute('a_uv', new Float32BufferAttribute(uvs, 2));
    this.setIndex(indices);
  }

  static calculate(positions: PartialArrayPoint[], offset: ArrayPoint) {
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const joins: number[] = []; // 用于lineJoin 裁剪
    const uvs: number[] = [];

    for (let i = 0; i < positions.length - 1; i += 1) {
      let verticesCount = vertices.length / 3;
      const current = getVertexByOffset(positions[i], offset);
      const next = getVertexByOffset(positions[i + 1], offset);
      if (i > 0) {
        const prev = getVertexByOffset(positions[i - 1], offset);
        const joinData = calculateJoin(prev, current, next, verticesCount);
        vertices.push(...joinData.vertices);
        normals.push(...joinData.normals);
        indices.push(...joinData.indices);
        joins.push(...joinData.joins);
        uvs.push(...joinData.uvs);
        verticesCount += 4;
      }
      const normal = getNormalVector(current, next);
      vertices.push(
        current[0], current[1], current[2],
        current[0], current[1], current[2],
        next[0], next[1], next[2],
        next[0], next[1], next[2],
      );
      const distance = getDistance(current, next);

      uvs.push(
        0, 1,
        0, 0,
        distance, 1,
        distance, 0,
      );
      normals.push(
        normal.x, normal.y,
        -normal.x, -normal.y,
        normal.x, normal.y,
        -normal.x, -normal.y,
      );
      joins.push(
        0, 0,
        0, 0,
        0, 0,
        0, 0,
      );
      indices.push(
        verticesCount + 1, verticesCount + 0, verticesCount + 2,
        verticesCount + 1, verticesCount + 2, verticesCount + 3,
      );
    }
    return { vertices, indices, normals, joins, uvs };
  }
}

export { PolylineGeometry };
