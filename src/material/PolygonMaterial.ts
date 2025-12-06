import { Color } from 'starry-math';
import { MeshMaterial, MeshMaterialParameters } from './MeshMaterial';

export interface PolygonMaterialParameters extends MeshMaterialParameters {
  enableOutline: boolean;
  outlineColor: string;
}

class PolygonMaterial extends MeshMaterial {
  outlineColor: Color = new Color();
  enableOutline: boolean = true;
  outlineDepthTest: boolean = false;

  constructor(parameters: Partial<PolygonMaterialParameters> = {}) {
    super(parameters);
    this.outlineColor.setStyle(parameters.outlineColor ?? '#000');
    this.enableOutline = parameters.enableOutline ?? true;
  }

  override setValues(parameters: Partial<PolygonMaterialParameters>): this {
    super.setValues(parameters);
    this.outlineColor.setStyle(parameters.outlineColor ?? '#000');
    this.enableOutline = parameters.enableOutline ?? true;
    return this;
  }

  override copy(source: PolygonMaterial): this {
    super.copy(source);
    this.outlineColor = source.outlineColor.clone();
    this.enableOutline = source.enableOutline;
    this.outlineDepthTest = source.outlineDepthTest;
    return this;
  }

  clone(): PolygonMaterial {
    const material = new PolygonMaterial();
    material.copy(this);
    return material;
  }
}

export { PolygonMaterial };
