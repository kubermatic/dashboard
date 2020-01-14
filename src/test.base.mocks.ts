Object.defineProperty(document, 'doctype', {value: '<!DOCTYPE html>'});

/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});

Object.defineProperties(window, {
  crypto: {
    value: {getRandomValues: () => [2, 4, 8, 16]},
  },
  URL: {value: {createObjectURL: () => {}}},
  getComputedStyle: {
    value: () => {
      return {
        display: 'none',
        appearance: ['-webkit-appearance'],
        getPropertyValue: () => {},
      };
    }
  },
  matchMedia: {
    value: () => {
      return {
        matches: false,
      };
    },
  },
  CSS: {value: null},
});
