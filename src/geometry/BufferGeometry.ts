import { Box3 } from 'starry-math';
import {
  BufferAttribute,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Uint8BufferAttribute,
} from './BufferAttribute';
import { arrayNeedsUint32 } from '@/utils/utils';
import { GLVertexArrayObject } from '@/webgl/GLVertexArrayObject';

type AttributeKey = 'a_position' | 'a_uv' | 'a_normal' | (string & {});

interface InternalGeometryData {
  vao?: GLVertexArrayObject;
}

function setupBoxByAttribute(attribute: BufferAttribute, box: Box3) {
   let minX = +Infinity;
    let minY = +Infinity;
    let minZ = +Infinity;

    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < attribute.count; i += 1) {
      const x = attribute.getX(i);
      const y = attribute.getY(i);
      const z = attribute.getZ(i);

      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (z < minZ) {
        minZ = z;
      }

      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
      if (z > maxZ) {
        maxZ = z;
      }
    }
    box.min.set(minX, minY, minZ);
    box.max.set(maxX, maxY, maxZ);
}

class BufferGeometry {
  private _index?: BufferAttribute;
  private _attributes: Map<AttributeKey, Float32BufferAttribute> = new Map();
  private _boundingBox: Box3 | null = null;

  __internalGeometryData: InternalGeometryData = {};

  setAttribute(name: AttributeKey, attribute: Float32BufferAttribute) {
    this._attributes.set(name, attribute);
  }

  getAttribute(name: AttributeKey) {
    return this._attributes.get(name);
  }

  getAttributes() {
    return this._attributes;
  }

  setIndex(indices: number[] | Uint8BufferAttribute | Uint16BufferAttribute | Uint32BufferAttribute) {
    if (Array.isArray(indices)) {
      const index = arrayNeedsUint32(indices) ? new Uint32BufferAttribute(indices, 1) : new Uint16BufferAttribute(indices, 1);
      this._index = index;
    } else {
      this._index = indices;
    }
  }

  getIndex() {
    return this._index;
  }

  computeBoundingBox() {
    const position = this._attributes.get('a_position');
    if (!position) return;
    if (!this._boundingBox) {
      this._boundingBox = new Box3();
    }

    setupBoxByAttribute(position, this._boundingBox);
  }

  get boundingBox() {
    return this._boundingBox;
  }

  destroy() {
    if (this.__internalGeometryData.vao) {
      this.__internalGeometryData.vao.destroy();
      delete this.__internalGeometryData.vao;
    }

    if (this._index) {
      this._index.destroy();
      delete this._index;
    }
    this._boundingBox = null;
    this._attributes.forEach((value) => {
      value.destroy();
    });
    this._attributes.clear();
  }
}

export { BufferGeometry };
