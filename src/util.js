exports.event = function(eventName) {
  var handlers = [];
  var eventName = eventName;

  var subscribe = function(handler) {
    handlers.push(handler);
  };

  subscribe.fire = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    handlers.forEach(function(handler) {
      handler(...args);
    });
    var event = new Event(eventName);

    // Listen for the event.
    // window.carota.instance.containerDom.addEventListener('build', function(e) {/* ... */}, false);

    // Dispatch the event.
    window.carota && window.carota.instance && window.carota.instance.containerDom&& window.carota.instance.containerDom.dispatchEvent(event);
  };

  return subscribe;
};

exports.derive = function(prototype, methods) {
  var properties = {};
  Object.keys(methods).forEach(function(name) {
    properties[name] = { value: methods[name] };
  });
  return Object.create(prototype, properties);
};
