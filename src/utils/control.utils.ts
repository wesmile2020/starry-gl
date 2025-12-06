import { Vector2 } from 'starry-math';

export interface WXTouchEvent {
  touches: {
    x: number;
    y: number;
  }[];
}

export function getPointsFromTouch(e: TouchEvent | WXTouchEvent) {
  const points: Vector2[] = [];
  for (let i = 0; i < e.touches.length; i += 1) {
    const touch = e.touches[i];
    const vector = new Vector2();
    if ('clientX' in touch) {
      vector.set(touch.clientX, touch.clientY);
    } else {
      vector.set(touch.x, touch.y);
    }
    points.push(vector);
  }
  return points;
}

export function findNearPointIndex(point: Vector2, list: Vector2[]) {
  let distance = point.distanceTo(list[0]);
  let index = 0;
  for (let i = 1; i < list.length; i += 1) {
    const item = point.distanceTo(list[i]);
    if (item < distance) {
      distance = item;
      index = i;
    }
  }
  return index;
}
