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

export const bindKeyboard = (set, onKeyDown, onKeyAction) => {
  const downHandler = (event) => {
    if (event.repeat) return;
    const key = normalizeKey(event.key);
    setKey(set, key, true);
    if (onKeyDown) onKeyDown(key);
    if (onKeyAction) onKeyAction(key);
  };
  const unbindDown = bind('keydown', downHandler);
  const unbindUp = bind('keyup', createHandler(set, false));
  return () => {
    unbindDown();
    unbindUp();
  };
};
