// Compatibility bridge for shop.js selector helpers on mobile browsers.
// shop.js sometimes passes a selector string (for example '#shopCheckout')
// as the query root. This safely lets that string resolve to the matching DOM node.
if (typeof String.prototype.querySelector !== 'function') {
  Object.defineProperty(String.prototype, 'querySelector', {
    configurable: true,
    enumerable: false,
    value: function(selector) {
      const root = document.querySelector(String(this));
      return root ? root.querySelector(selector) : null;
    }
  });
}

if (typeof String.prototype.querySelectorAll !== 'function') {
  Object.defineProperty(String.prototype, 'querySelectorAll', {
    configurable: true,
    enumerable: false,
    value: function(selector) {
      const root = document.querySelector(String(this));
      return root ? root.querySelectorAll(selector) : [];
    }
  });
}
