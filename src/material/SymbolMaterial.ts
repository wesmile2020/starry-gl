import { Euler, EulerOrder, Vector3 } from 'starry-math';
import { AbstractMaterial, MaterialParameters } from './AbstractMaterial';
import { Texture } from '@/texture/Texture';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { ShaderSourceType } from '@/config/ShaderSourceType';
import { Alignment } from '@/config/define';

export interface SymbolMaterialParameters extends MaterialParameters {
  map: Texture
  size: number;
  alignment: Alignment;
}

class SymbolMaterial extends AbstractMaterial {
  size: number = 1;
  alignment: Alignment = Alignment.viewport;

  private _rotation: Euler = new Euler(0, 0, 0, EulerOrder.ZYX);

  constructor(parameters: Partial<SymbolMaterialParameters> = {}) {
    super(ShaderSourceType.symbol);
    super.setValues(parameters);
    this.size = parameters.size ?? 1;
    this.alignment = parameters.alignment ?? Alignment.viewport;

    this.setDefine('EULER_ORDER', this._rotation.order);
    this._uniforms.set('u_rotation', new Vector3(this._rotation.x, this._rotation.y, this._rotation.z));
  }

  override setValues(parameters: Partial<SymbolMaterialParameters>): this {
    super.setValues(parameters);
    this.size = parameters.size ?? 1;
    this.alignment = parameters.alignment ?? Alignment.viewport;

    return this;
  }

  override copy(source: SymbolMaterial): this {
    super.copy(source);
    this.size = source.size;
    this.alignment = source.alignment;
    return this;
  }

  override onBeforeRender(camera: AbstractCamera): void {
    super.onBeforeRender(camera);
    // 处理 euler order
    if (camera.rotation.order !== this._rotation.order) {
      this._rotation.order = camera.rotation.order;
      this.setDefine('EULER_ORDER', this._rotation.order);
    }
    this._uniforms.set('u_resolution', camera.resolution);
    this._uniforms.set('u_size', this.size);
    const u_rotation = this._uniforms.get('u_rotation') as Vector3;
    if (this.alignment === Alignment.camera) {
      this._rotation.copy(camera.rotation);
      u_rotation.set(camera.rotation.x, camera.rotation.y, -camera.rotation.z);
    } else {
      this._rotation.set(0, 0, 0);
      u_rotation.set(0, 0, 0);
    }
  }

  get rotation() {
    return this._rotation;
  }

  clone(): SymbolMaterial {
    const material = new SymbolMaterial();
    material.copy(this);
    return material;
  }
}

export { SymbolMaterial };
