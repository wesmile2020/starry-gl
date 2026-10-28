import { Vector2 } from 'starry-math';
import { MaterialParameters, AbstractMaterial } from './AbstractMaterial';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { ShaderSourceType } from '@/config/ShaderSourceType';

export interface PolylineMaterialParameters extends MaterialParameters {
  lineWidth: number;
}

class PolylineMaterial extends AbstractMaterial {
  lineWidth: number = 8;

  constructor(parameters: Partial<PolylineMaterialParameters> = {}) {
    super(ShaderSourceType.line);
    super.setValues(parameters);
    this.lineWidth = parameters.lineWidth ?? 8;
  }

  override setValues(parameters: Partial<PolylineMaterialParameters>): this {
    super.setValues(parameters);
    this.lineWidth = parameters.lineWidth ?? 8;
    return this;
  }

  override copy(source: PolylineMaterial): this {
    super.copy(source);
    this.lineWidth = source.lineWidth;
    return this;
  }

  override onBeforeRender(camera: AbstractCamera) {
    super.onBeforeRender(camera);
    this._uniforms.set('u_lineWidth', this.lineWidth * camera.meterPerPixel);
    if (this.map) {
      this._uniforms.set('u_textureSize', new Vector2(this.map.width, this.map.height));
    }
  }

  override clone(): PolylineMaterial {
    const material = new PolylineMaterial();
    material.copy(this);
    return material;
  }
}

export { PolylineMaterial };
