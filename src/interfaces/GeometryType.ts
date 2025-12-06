export type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N ? R : Tuple<T, N, [T, ...R]>;

export type ArrayPoint = Tuple<number, 3>;

export type PartialArrayPoint = [number, number, number?];

export interface Coordinate2D {
  x: number;
  y: number;
}

export interface Coordinate3D extends Coordinate2D {
  z: number;
}

export type MatrixValue = Tuple<number, 16> | Tuple<number, 9>;

export type VectorValue = Tuple<number, 2> | Tuple<number, 3> | Tuple<number, 4>;

export interface GPUBindGroupAddress {
  group: number;
  binding: number;
}

export type UniformType = 'int' | 'float' | 'vector' | 'matrix';
