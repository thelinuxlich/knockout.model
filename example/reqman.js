(function() {
  this.RQ = {
    beforeAdd: null,
    afterAdd: null,
    beforeRemove: null,
    afterRemove: null,
    container: [],
    containerMap: {},
    killAll: function() {
      var key, req_id, _i, _len, _ref;
      _ref = RQ.container;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        req_id = _ref[_i];
        key = RQ.container[req_id];
        RQ.containerMap[key].abort();
      }
      RQ.container = [];
      return RQ.containerMap = {};
    },
    add: function(req, req_id) {
      if (typeof RQ.beforeAdd === "function") {
        RQ.beforeAdd();
      }
      req_id = req_id || ("rq_" + (RQ.container.length + 1));
      req.container_id = req_id;
      if (req !== false) {
        RQ.container.push(req_id);
        RQ.containerMap[req_id] = req;
      }
      if (typeof RQ.afterAdd === "function") {
        return RQ.afterAdd();
      }
    },
    remove: function(condition) {
      var index, key, oldkey, request, _ref;
      if (typeof RQ.beforeRemove === "function") {
        RQ.beforeRemove();
      }
      if (typeof condition === "object") {
        _ref = RQ.containerMap;
        for (key in _ref) {
          request = _ref[key];
          if (request === condition["request"]) {
            index = $.inArray(key, RQ.container);
            oldkey = key;
            break;
          }
        }
      } else {
        index = $.inArray(condition, RQ.container);
        oldkey = condition;
      }
      RQ.container.splice(index, 1);
      delete RQ.containerMap[oldkey];
      if (typeof RQ.afterRemove === "function") {
        return RQ.afterRemove();
      }
    },
    kill: function(condition) {
      var key, oldkey, request, _ref;
      if (typeof condition === "object") {
        _ref = RQ.containerMap;
        for (key in _ref) {
          request = _ref[key];
          if (request === condition["request"]) {
            oldkey = key;
            break;
          }
        }
      } else {
        oldkey = condition;
      }
      if (RQ.containerMap[oldkey] !== false) {
        RQ.container[oldkey].abort();
        return RQ.remove(oldkey);
      }
    },
    killByRegex: function(condition) {
      var key, _i, _len, _ref, _results;
      _ref = RQ.container;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        _results.push(key.match(condition) ? RQ.containerMap[key] !== false ? (RQ.containerMap[key].abort(), RQ.remove(key)) : void 0 : void 0);
      }
      return _results;
    },
    showAll: function() {
      var key, request, requests, _ref;
      requests = "";
      _ref = RQ.containerMap;
      for (key in _ref) {
        request = _ref[key];
        requests += "id: " + key + ",request: " + request + "\n";
      }
      return requests;
    }
  };
  $(document).ajaxComplete(function(e, xhr, settings) {
    if (xhr.container_id != null) {
      return RQ.remove(xhr.container_id);
    }
  });
}).call(this);
