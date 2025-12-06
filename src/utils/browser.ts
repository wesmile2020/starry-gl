export const browser = {
  requestAnimationFrame: typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : () => 0,
  cancelAnimationFrame: typeof window !== 'undefined' ? window.cancelAnimationFrame.bind(window) : () => 0,
};
