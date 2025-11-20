export const isPointInRect = (point, rect) => (
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height
);

export const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });

export const scale = (vector, scalar) => ({ x: vector.x * scalar, y: vector.y * scalar });

export const distanceToRect = (point, rect) => {
  const x = clamp(point.x, rect.x, rect.x + rect.width);
  const y = clamp(point.y, rect.y, rect.y + rect.height);
  return Math.hypot(point.x - x, point.y - y);
};

export const rectsOverlap = (a, b) => !(
  a.x + a.width < b.x ||
  b.x + b.width < a.x ||
  a.y + a.height < b.y ||
  b.y + b.height < a.y
);

const resizeRect = (rect, amount) => ({
  x: rect.x - amount,
  y: rect.y - amount,
  width: rect.width + amount * 2,
  height: rect.height + amount * 2
});

const positiveRect = (rect) => (rect.width > 0 && rect.height > 0 ? rect : null);

export const shrinkRect = (rect, amount) => positiveRect(resizeRect(rect, -amount));

export const inflateRect = (rect, amount) => positiveRect(resizeRect(rect, amount));

export const distanceBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const normalizeVector = (vector) => {
  const mag = Math.hypot(vector.x, vector.y);
  if (!mag) return { x: 0, y: 0 };
  return { x: vector.x / mag, y: vector.y / mag };
};
