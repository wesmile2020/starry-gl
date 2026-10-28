/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  WebGLRenderer,
  PerspectiveCamera,
  PerspectiveControl,
  MapControl,
  SymbolGeometry,
  Symbol,
  Scene,
  TextureLoader,
  DataTexture,
  TextureFormat,
} from '@/index';

const app = document.getElementById('app')!;
const { clientWidth, clientHeight } = app;

const scene = new Scene();
const renderer = new WebGLRenderer({
  pixelRatio: devicePixelRatio,
});
(window as any).renderer = renderer;

app.appendChild(renderer.domElement);
renderer.setSize(clientWidth, clientHeight);

const camera = new PerspectiveCamera(36, clientWidth / clientHeight);
camera.resolution.set(clientWidth, clientHeight);
const control = new PerspectiveControl(camera, clientWidth, clientHeight);

new MapControl(app, control);

const symbol = new Symbol();

scene.add(symbol);

const loader = new TextureLoader();
loader.load("./starry.svg", { repeat: true }).then((result) => {
  symbol.geometry = new SymbolGeometry([0, 0, 0], [result.width, result.height]);
  symbol.material.map = result;
  symbol.material.size = 0.5;
});


function loop() {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
}

loop();
