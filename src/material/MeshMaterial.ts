import { AbstractMaterial, MaterialParameters } from './AbstractMaterial';
import { Texture } from '@/texture/Texture';
import { EShaderSourceType } from '@/config/ShaderSourceType';

export interface MeshMaterialParameters extends MaterialParameters {
  map: Texture | null;
}

class MeshMaterial extends AbstractMaterial {
  constructor(parameters: Partial<MeshMaterialParameters> = {}) {
    super(EShaderSourceType.mesh);
    super.setValues(parameters);

    this.map = parameters.map || null;
  }

  override setValues(parameters: Partial<MeshMaterialParameters>): this {
    super.setValues(parameters);
    this.map = parameters.map || null;
    return this;
  }

  clone(): MeshMaterial {
    const material = new MeshMaterial();
    return material.copy(this);
  }
}

export { MeshMaterial };
