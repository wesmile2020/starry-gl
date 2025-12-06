import TinySDF from '@mapbox/tiny-sdf';
import { Canvas2D } from './Canvas2D';
import { ImageTexture } from '@/texture/ImageTexture';

type GlyphItem = Omit<ReturnType<TinySDF['draw']>, 'data'> & {
  data: ImageData,
};

interface CacheItem {
  tinySDF: TinySDF;
  glyphs: Map<string, GlyphItem>;
}

export interface GlyphParams {
  buffer: number;
  radius: number;
  cutoff: number;
}

interface DrawOptions {
  letterSpacing: number;
}

const defaultDrawOptions: DrawOptions = {
  letterSpacing: 0,
}

class GlyphManager {
  static readonly DEFAULT_GLYPH_SIZE = 32;

  private _cache: Map<string, CacheItem> = new Map();
  private _buffer: number;
  private _radius: number;
  private _cutoff: number;
  private _ctx: CanvasRenderingContext2D;
  private _canvas2D: Canvas2D;

  constructor(canvas2D?: Canvas2D, params?: GlyphParams) {
    this._canvas2D = canvas2D || new Canvas2D(1080, 960, 1, {
      willReadFrequently: true,
    });
    this._ctx = this._canvas2D.getContext();
    this._buffer = params?.buffer ?? 2;
    this._radius = params?.radius ?? 12;
    this._cutoff = params?.cutoff ?? 0.23;
  }

  private _makeRGBAImageData(alphaChannel: Uint8ClampedArray, width: number, height: number) {
    const imageData = this._ctx.createImageData(width, height);
    for (let i = 0; i < alphaChannel.length; i += 1) {
      imageData.data[4 * i + 0] = alphaChannel[i];
      imageData.data[4 * i + 1] = alphaChannel[i];
      imageData.data[4 * i + 2] = alphaChannel[i];
      imageData.data[4 * i + 3] = 255;
    }
    return imageData;
  }

  draw(font: string, text: string | number, options?: Partial<DrawOptions>) {
    const opts = { ...defaultDrawOptions, ...options };
    this._canvas2D.clear();
    const str = text.toString();
    const glyphs: GlyphItem[] = [];
    let maxHeight = 0;
    let maxOffsetY = 0;
    let maxGlyphTop = 0;
    for (let i = 0; i < str.length; i += 1) {
      const glyph = this._getGlyph(font, str[i]);
      glyphs.push(glyph);
      if (glyph.height > maxHeight) {
        maxHeight = glyph.height;
      }
      const offsetY = glyph.height - glyph.glyphTop;
      if (offsetY > maxOffsetY) {
        maxOffsetY = offsetY;
      }
      if (glyph.glyphTop > maxGlyphTop) {
        maxGlyphTop = glyph.glyphTop;
      }
    }
    const deltaY = maxHeight - maxGlyphTop;
    const fullHeight = maxHeight + maxOffsetY - deltaY;

    let dx = 0 + opts.letterSpacing;
    for (let i = 0; i < glyphs.length; i += 1) {
      const y = maxHeight - glyphs[i].glyphTop - deltaY;
      this._ctx.putImageData(glyphs[i].data, dx, y);
      dx += Math.ceil(glyphs[i].glyphAdvance) + opts.letterSpacing;
    }
    dx += opts.letterSpacing;
    const imageData = this._ctx.getImageData(0, 0, dx, fullHeight);

    return imageData;
  }

  createTexture(imageData: ImageData) {
    return new ImageTexture(imageData, imageData.width, imageData.height);
  }

  private _drawChar(tinySDF: TinySDF, s: string): GlyphItem {
    const glyph = tinySDF.draw(s);
    return {
      ...glyph,
      data: this._makeRGBAImageData(glyph.data, glyph.width, glyph.height),
    };
  }

  private _getGlyph(font: string, s: string) {
    const cacheItem = this._cache.get(font);
    if (cacheItem) {
      let glyph = cacheItem.glyphs.get(s);
      if (!glyph) {
        glyph = this._drawChar(cacheItem.tinySDF, s);
        cacheItem.glyphs.set(s, glyph);
      }
      return glyph;
    }

    const tinySDF = new TinySDF({
      fontSize: GlyphManager.DEFAULT_GLYPH_SIZE,
      buffer: this._buffer,
      radius: this._radius,
      cutoff: this._cutoff,
      fontFamily: font,
    });
    const glyph = this._drawChar(tinySDF, s);
    const glyphMap: Map<string, GlyphItem> = new Map();
    glyphMap.set(s, glyph);
    this._cache.set(font, { tinySDF, glyphs: glyphMap });
    return glyph;
  }

  destroy() {
    this._cache.clear();
  }

  getCanvas2D() {
    return this._canvas2D;
  }
}

export { GlyphManager };
