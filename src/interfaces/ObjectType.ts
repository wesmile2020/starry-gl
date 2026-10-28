import { Vector3 } from 'starry-math';
import { BufferGeometry } from '@/geometry/BufferGeometry';
import { AbstractMaterial } from '@/material/AbstractMaterial';
import { Object3D } from '@/objects/Object3D';
import { GLContext } from '@/webgl/GLContext';
import { RayCaster } from '@/objects/RayCaster';
import { DrawMode } from '@/config/define';
import { GPUContext } from '@/webgpu/GPUContext';
import { WebGPUBindGroup } from '@/webgpu/WebGPUBindGroup';

export enum ObjectType {
  groupObject,
  renderObject,
}

export interface Intersection {
  point: Vector3;
  distance: number;
  index: number;
  object: RenderObject;
}

export interface InternalRenderObjectData {
  gpuBindGroup?: WebGPUBindGroup;
}

export interface RenderObject extends Object3D {
  __internalObjectData: InternalRenderObjectData;

  geometry: BufferGeometry;
  material: AbstractMaterial;

  readonly drawMode: DrawMode;
  readonly type: ObjectType.renderObject;

  cast(rayCaster: RayCaster): Intersection[];
  renderOnGL?(context: GLContext): void;
  renderOnGPU?(context: GPUContext): void;
  destroy(): void;
}
