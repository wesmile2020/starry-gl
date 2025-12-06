export interface WebGLRendererOptions {
  pixelRatio: number;
  attributes: WebGLContextAttributes;
  size: [number, number];
  canvas?: HTMLCanvasElement;
  gl?: WebGLRenderingContext;
}

export const defaultWebGLRendererOptions: WebGLRendererOptions = {
  size: [300, 300],
  pixelRatio: typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1,
  attributes: {
    antialias: true, // 抗锯齿
    depth: true, // 缓冲区包含深度检测
    preserveDrawingBuffer: false, // 是否保存缓冲区
    alpha: true, // canvas 包含 alpha 通道
    failIfMajorPerformanceCaveat: false, // 低性能设备上下文
    stencil: true,
  },
};

export interface WebGPURendererOptions {
  pixelRatio: number;
  size: [number, number];
  canvas?: HTMLCanvasElement;
  context?: GPUCanvasContext;
  device?: GPUDevice;
}

export const defaultWebGPURendererOptions: WebGPURendererOptions = {
  pixelRatio: typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1,
  size: [300, 300],
};
