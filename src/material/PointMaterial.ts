import { AbstractMaterial, MaterialParameters } from './AbstractMaterial';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { EShaderSourceType } from '@/config/ShaderSourceType';

type PointMode = 'square' | 'round';

export interface PointMaterialParameters extends MaterialParameters {
  pointSize: number;
  pointMode: PointMode;
}

class PointMaterial extends AbstractMaterial {
  pointSize: number = 8;

  constructor(parameters: Partial<PointMaterialParameters> = {}) {
    super(EShaderSourceType.point);
    super.setValues(parameters);

    this.pointSize = parameters.pointSize ?? this.pointSize;
    this.pointMode = parameters.pointMode ?? this.pointMode;
  }

  override setValues(parameters: Partial<PointMaterialParameters>) {
    super.setValues(parameters);
    this.pointSize = parameters.pointSize ?? this.pointSize;
    this.pointMode = parameters.pointMode ?? this.pointMode;

    return this;
  }

  clone(): PointMaterial {
    const material = new PointMaterial();
    return material.copy(this);
  }

  get pointMode(): PointMode {
    return this.getDefine('USE_DISCARD') ? 'round' : 'square';
  }

  set pointMode(mode: PointMode) {
    this.setDefine('USE_DISCARD', mode === 'round');
  }

  override onBeforeRender(camera: AbstractCamera): void {
    super.onBeforeRender(camera);
    this._uniforms.set('u_pointSize', this.pointSize);
  }

  override copy(source: PointMaterial): this {
    super.copy(source);
    this.pointSize = source.pointSize;
    this.pointMode = source.pointMode;
    return this;
  }
}

export { PointMaterial };
