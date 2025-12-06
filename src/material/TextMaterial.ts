import { Color } from 'starry-math';
import { AbstractCamera } from '@/camera/AbstractCamera';
import { GlyphManager } from '@/glyph/GlyphManager';
import { SymbolMaterial, SymbolMaterialParameters } from './SymbolMaterial';

export interface TextMaterialParameters extends SymbolMaterialParameters {
  haloWidth: number;
  haloColor: string;
  defaultGlyphSize: number;
}

class TextMaterial extends SymbolMaterial {
  static readonly fillHalo = 0.75;

  haloWidth: number = 0.4;
  haloColor: Color = new Color('#fff');
  defaultGlyphSize: number = GlyphManager.DEFAULT_GLYPH_SIZE;

  constructor(parameters: Partial<TextMaterialParameters> = {}) {
    super(parameters);
    this.size = parameters.size ?? 14;
    this.haloWidth = parameters.haloWidth ?? 0.4;
    this.haloColor.setStyle(parameters.haloColor ?? '#fff');
    this.defaultGlyphSize = parameters.defaultGlyphSize ?? GlyphManager.DEFAULT_GLYPH_SIZE;
    this.depthTest = parameters.depthTest ?? false;
    this.setDefine('DRAW_TEXT_SYMBOL', true);
  }

  override setValues(parameters: Partial<TextMaterialParameters>): this {
    super.setValues(parameters);
    this.size = parameters.size ?? 14;
    this.haloWidth = parameters.haloWidth ?? 0.2;
    this.haloColor.setStyle(parameters.haloColor ?? '#fff');
    this.defaultGlyphSize = parameters.defaultGlyphSize ?? GlyphManager.DEFAULT_GLYPH_SIZE;

    return this;
  }

  override onBeforeRender(camera: AbstractCamera): void {
    super.onBeforeRender(camera);
    this._uniforms.set('u_gamma', 2 * 1.414 / this.size);
    this._uniforms.set('u_size', this.size / this.defaultGlyphSize);
    this._uniforms.set('u_halo', TextMaterial.fillHalo);
  }
}

export { TextMaterial };
