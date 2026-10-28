/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Stats from 'stats.js';
import {
  WebGLRenderer,
  PerspectiveCamera,
  PerspectiveControl,
  MapControl,
  Text,
  SymbolGeometry,
  Scene,
  GlyphManager,
  TextMaterial,
  Polygon,
  PolygonGeometry,
  PolygonMaterial,
  Polyline,
  PolylineGeometry,
  PolylineMaterial,
  Anchor,
  Alignment,
  version,
} from '@/index';
import { PartialArrayPoint } from '@/interfaces/GeometryType';

console.log(version);

const app = document.getElementById('app')!;
const { clientWidth, clientHeight } = app;

const scene = new Scene();
const renderer = new WebGLRenderer({
  pixelRatio: devicePixelRatio,
  size: [clientWidth, clientHeight],
});
(window as any).renderer = renderer;

app.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(36, clientWidth / clientHeight);
camera.resolution.set(clientWidth, clientHeight);
const control = new PerspectiveControl(camera, clientWidth, clientHeight);
(window as any).control = control;

new MapControl(app, control);

const glyphMng = new GlyphManager();

const textMaterial = new TextMaterial({
  alignment: Alignment.camera,
  haloWidth: 0.4,
  size: 48,
  haloColor: '#1ad',
  depthTest: false,
});

const imageData = glyphMng.draw('Cascadia Mono', '欢迎你,StarryGL', {
  letterSpacing: 2,
});
const texture = glyphMng.createTexture(imageData);
textMaterial.map = texture;

const geometry = new SymbolGeometry([0, 100, 0], [texture.width, texture.height], Anchor.center);
const text = new Text(geometry, textMaterial);
scene.add(text);

function generateStarPoints(centerX: number, centerY: number, outerRadius: number, innerRadius: number) {
  const points: PartialArrayPoint[] = [];
  const step = Math.PI / 5;
  const startAngle = Math.PI / 2 ;
  for (let i = 0; i < 10; i++) {
    const angle = startAngle + i * step;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    points.push([x, y]);
  }

  return points;
}

const polygonGeometry = new PolygonGeometry([
  generateStarPoints(0, 50, 100, 80),
], 50);
const polygonMaterial = new PolygonMaterial({
  color: 'rgba(71, 210, 83, 1)',
  enableOutline: true,
  depthTest: true,
  transparent: true,
});

const polygon = new Polygon(polygonGeometry, polygonMaterial);
scene.add(polygon);

const polygonMaterial1 = new PolygonMaterial({
  color: 'rgba(71, 210, 83, 1)',
  enableOutline: true,
  depthTest: true,
  transparent: true,
});

const polygon1 = new Polygon(polygonGeometry, polygonMaterial1);
polygon1.position.set(0, 200, 0);
polygon1.updateMatrix();
scene.add(polygon1);

function generateWavePoints(start: [number, number], amplitude: number, wavelength: number, length: number, numPoints: number) {
  const points: PartialArrayPoint[] = [];
  const [startX, startY] = start;
  const step = length / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const x = startX + i * step;
    const y = startY + amplitude * Math.sin((2 * Math.PI / wavelength) * x);
    points.push([x, y]);
  }

  return points;
}

const wavePoints = generateWavePoints([-600, -100], 30, 600, 1200, 100);
const lineGeometry = new PolylineGeometry(wavePoints);
const lineMaterial = new PolylineMaterial({
  color: '#29ccac',
  lineWidth: 12,
});
const polyline = new Polyline(lineGeometry, lineMaterial);
scene.add(polyline);

const stats = new Stats();
document.body.appendChild(stats.dom);

function loop() {
  stats.begin();
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
  stats.end();
}

loop();

window.addEventListener('resize', () => {
  const { clientWidth, clientHeight } = app;
  renderer.setSize(clientWidth, clientHeight);

  control.setSize(clientWidth, clientHeight);
});
