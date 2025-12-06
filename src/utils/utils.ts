import earcut from 'earcut';
import { Vector2 } from 'starry-math';
import { ArrayPoint, Coordinate2D } from '@/interfaces/GeometryType';
import { EAnchor } from '@/config/define';

export function bindAll<T>(methods: (keyof T | (string & {}))[], context: T) {
  for (let i = 0; i < methods.length; i += 1) {
    const key = methods[i] as keyof T;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    context[key] = (context[key] as unknown as Function).bind(context);
  }
}

export function createCanvas(size: [number, number], pixelRatio: number) {
  const [width, height] = size;
  const canvas = document.createElement('canvas');
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  return canvas;
}

export function depthFirstEach<T extends { children?: unknown[] }>(tree: T[], cb: (a: T) => void) {
  const arr: T[] = [...tree];
  while (arr.length !== 0) {
    const item = arr.shift()!;
    cb(item);
    const { children } = item;
    if (children) {
      arr.unshift(...(children as T[]));
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function throttle<T extends Function>(cb: T, limit: number): T {
  let time = 0;
  function throttled(this: unknown, ...rest: unknown[]) {
    const now = Date.now();
    if (now - time > limit) {
      cb.apply(this, rest);
      time = now;
    }
  }
  return throttled as unknown as T;
}

export function arrayNeedsUint32(array: ArrayLike<number>) {
  const max = 2 ** 16 - 1;
  for (let i = 0; i < array.length; i += 1) {
    if (array[i] > max) {
      return true;
    }
  }
  return false;
}

/**
 * 创建一个矩形，顶点索引如下
 *  0 --- 2
 *  |     |
 *  1 --- 3
 */
export function createRectGeometry(point: ArrayPoint, width: number, height: number, anchor: EAnchor) {
  const AnchorMap = {
    [EAnchor.center]: [0, 0],
    [EAnchor.top]: [0, -0.5],
    [EAnchor.bottom]: [0, 0.5],
    [EAnchor.left]: [0.5, 0],
    [EAnchor.right]: [-0.5, 0],
    [EAnchor.topLeft]: [0.5, -0.5],
    [EAnchor.topRight]: [-0.5, -0.5],
    [EAnchor.bottomLeft]: [0.5, 0.5],
    [EAnchor.bottomRight]: [0.5, -0.5],
  };
  const anchorArr = AnchorMap[anchor] || [0, 0];
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const diffX = anchorArr[0] * width;
  const diffY = anchorArr[1] * height;

  const vertices = [
    point[0] - halfWidth + diffX, point[1] + halfHeight + diffY, point[2],
    point[0] - halfWidth + diffX, point[1] - halfHeight + diffY, point[2],
    point[0] + halfWidth + diffX, point[1] + halfHeight + diffY, point[2],
    point[0] + halfWidth + diffX, point[1] - halfHeight + diffY, point[2],
  ];
  const indices = [
    0, 1, 3,
    0, 3, 2,
  ];
  const uvs = [
    0, 1,
    0, 0,
    1, 1,
    1, 0,
  ];

  return { vertices, indices, uvs };
}

export function offsetArray(arr: number[], offset: number) {
  for (let i = 0; i < arr.length; i += 1) {
    arr[i] += offset;
  }
  return arr;
}

/**
 * 创建圆弧
 * @param center 圆心
 * @param startAngle 起始角度（与Y轴的夹角，逆时针方向为正）
 * @param endAngle 结束角度
 * @returns 圆弧
 */
export function createArc(center: Coordinate2D, radius: number, startAngle: number, endAngle: number) {
  const vector = new Vector2(0, radius);
  const diff = endAngle - startAngle;
  const step = Math.PI / 32 * Math.sign(diff);
  const count = Math.ceil(Math.abs(diff / step));
  const points: Coordinate2D[] = [];
  for (let i = 0; i <= count; i += 1) {
    const next = vector.clone().rotate(startAngle + step * i);
    points.push({ x: next.x + center.x, y: next.y + center.y });
  }
  return points;
}

export function createRectWithRadius(width: number, height: number, radius: number) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const r = Math.min(radius, halfWidth, halfHeight);

  const p0 = { x: -halfWidth, y: halfHeight };
  const p1 = { x: halfWidth, y: halfHeight };
  const p2 = { x: halfWidth, y: -halfHeight };
  const p3 = { x: -halfWidth, y: -halfHeight };

  const r0 = { x: p0.x + r, y: p0.y - r };
  const r1 = { x: p1.x - r, y: p1.y - r };
  const r2 = { x: p2.x - r, y: p2.y + r };
  const r3 = { x: p3.x + r, y: p3.y + r };

  const halfPI = Math.PI / 2;

  const points = [
    ...createArc(r0, r, halfPI, 0),
    ...createArc(r1, r, 0, -halfPI),
    ...createArc(r2, r, -halfPI, -Math.PI),
    ...createArc(r3, r, Math.PI, halfPI),
  ];

  const vertices: number[] = [];
  for (let i = 0; i < points.length; i += 1) {
    vertices.push(points[i].x, points[i].y, 0);
  }

  const indices: number[] = earcut(vertices, undefined, 3);
  return { vertices, indices, points };
}

export async function requestGPUDevice(adapterOptions?: GPURequestAdapterOptions, deviceOptions?: GPUDeviceDescriptor) {
  if (typeof navigator === 'undefined') {
    return null;
  }
  const adapter = await navigator?.gpu.requestAdapter(adapterOptions);
  if (!adapter) {
    return null;
  }
  return adapter.requestDevice(deviceOptions);
}

export function arrayEqual(a: number[], b: number[]) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function getNormalVector(start: ArrayPoint, end: ArrayPoint) {
  const vector = new Vector2(end[0] - start[0], end[1] - start[1]);
  return vector.normal().unit();
}
