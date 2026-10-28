import { MathUtils } from "starry-math";
import { AbstractMaterial } from "./AbstractMaterial";
import { ShaderSourceType } from "@/config/ShaderSourceType";

class ShaderMaterial extends AbstractMaterial {
  private _vertex: string;
  private _fragment: string;

  constructor(vertex: string, fragment: string) {
    super(ShaderSourceType.custom);
    this._vertex = vertex;
    this._fragment = fragment;
    this._shaderKey = this._calculateShaderKey();
  }

  getVertex() {
    return this._vertex;
  }

  getFragment() {
    return this._fragment;
  }

  protected override _calculateShaderKey() {
    const str = this._shaderType  + '\n' + this.getDefineCode() + '\n' + this._vertex + '\n' + this._fragment;
    return MathUtils.hashCode(str);
  }

  clone(): ShaderMaterial {
    const material = new ShaderMaterial(this._vertex, this._fragment);
    return material.copy(this);
  }
}

export { ShaderMaterial };
