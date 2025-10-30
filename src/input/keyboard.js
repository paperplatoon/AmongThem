const normalizeKey = (value) => (value.length === 1 ? value.toLowerCase() : value);

const setKey = (set, key, down) => (down ? set.add(key) : set.delete(key));

const emit = (callback, key) => { if (callback) callback(key); };

const createHandler = (set, down, callback) => (event) => {
  if (event.repeat) return;
  const key = normalizeKey(event.key);
  setKey(set, key, down);
  if (down) emit(callback, key);
};

const bind = (type, handler) => {
  window.addEventListener(type, handler);
  return () => window.removeEventListener(type, handler);
};

export const bindKeyboard = (set, onKeyDown) => {
  const unbindDown = bind('keydown', createHandler(set, true, onKeyDown));
  const unbindUp = bind('keyup', createHandler(set, false));
  return () => {
    unbindDown();
    unbindUp();
  };
};
