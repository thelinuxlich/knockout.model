function Ctor(Parent, memberInit) {
  if (!memberInit) {
    memberInit = Parent;
    Parent = function(){};
  }
  var F = function(c) {
    if (this.init && c !== Ctor) {
      this.init.apply(this, arguments);
    }
  }
  memberInit.call(F.prototype = new Parent(Ctor), Parent.prototype);
  return F;
}


var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty;

ko.utils.IdentityMap = function() {
  this.find = function(id, params) {
    return $.grep(this, function(d) {
      return d.id === id && ko.utils.stringifyJson(d.params) === ko.utils.stringifyJson(params);
    })[0];
  };
  return this;
};

ko.utils.IdentityMap.prototype = new Array();

ko.utils.unescapeHtml = function(str) {
  var result, temp;
  if (str.length > 0) {
    temp = document.createElement("div");
    temp.innerHTML = str;
    result = temp.childNodes[0].nodeValue;
    temp.removeChild(temp.firstChild);
    return result;
  } else {
    return str;
  }
};

var KnockoutModel = Ctor(function() {

  var __urls = {},__defaults = {},__transientParameters = [],__afterHooks = {},__cacheContainer = new ko.utils.IdentityMap(),__backup = {};

  var __equalityComparer = function(a, b) {
    var oldValueIsPrimitive, primitiveTypes, _ref;
    primitiveTypes = {
      'undefined': true,
      'boolean': true,
      'number': true,
      'string': true
    };
    oldValueIsPrimitive = (a === null) || (_ref = typeof a, __indexOf.call(primitiveTypes, _ref) >= 0);
    if (oldValueIsPrimitive) {
      return a === b;
    } else {
      return false;
    }
  };

  this.init = function() {
    var i, item;
    this.__urls = __urls;
    for (i in this) {
      if (!__hasProp.call(this, i)) continue;
      item = this[i];
      if (i !== "__urls") {
        if (ko.isObservable(this[i])) {
          this[i].equalityComparer = __equalityComparer;
        }
        __defaults[i] = this.get(i);
      }
    }
  }

  this.__urls = {};

  this.addRoute = function(id, href, isStatic) {
    if (isStatic == null) {
      isStatic = true;
    }
    this.__urls[id] = href;
    if (isStatic === true) {
      return __urls[id] = href;
    }
  };

  this.get = function(attr) {
    return ko.utils.unwrapObservable(this[attr]);
  };

  this.set = function(args) {
    var i, item, new_value, obj;
    obj = this;
    for (i in args) {
      item = args[i];
      if (ko.isWriteableObservable(obj[i])) {
        new_value = typeof item === "string" && item.match(/&[^\s]*;/) !== false ? ko.utils.unescapeHtml(item) : item;
        if (new_value !== obj[i]()) {
          obj[i](new_value);
        }
      } else if (obj[i] !== void 0 && ko.isObservable(obj[i]) === false) {
        new_value = item.match(/&[^\s]*;/) !== false ? ko.utils.unescapeHtml(item) : item;
        obj[i] = new_value;
      }
    }
    return obj;
  };

  this.doPost = function(routeName, params, callback, type) {
    var url;
    if (params == null) {
      params = {};
    }
    if (callback == null) {
      callback = null;
    }
    if (type == null) {
      type = "json";
    }
    if (routeName.match(/^https?:\/\//) === null) {
      url = this.__urls[routeName];
    } else {
      url = routeName;
    }
    return doPost(url, params, callback, type);
  };

  this.doGet = function(routeName, params, callback, type) {
    var url;
    if (params == null) {
      params = {};
    }
    if (callback == null) {
      callback = null;
    }
    if (type == null) {
      type = "json";
    }
    if (routeName.match(/^https?:\/\//) === null) {
      url = this.__urls[routeName];
    } else {
      url = routeName;
    }
    return doGet(url, params, callback, type);
  };

  var doPost = function(routeName, params, callback, type) {
    var ah, className, url;
    if (params == null) {
      params = {};
    }
    if (callback == null) {
      callback = null;
    }
    if (type == null) {
      type = "json";
    }
    if (routeName.match(/^https?:\/\//) === null) {
      url = this.__parse_url(this.__urls[routeName], params);
    } else {
      url = this.__parse_url(routeName, params);
    }
    className = this.name;
    ah = this.__afterHooks;
    return RQ.add($.post(url, params, function(data) {
      try {
        if (typeof ah[routeName] === "function") {
          ah[routeName](data);
        }
        if (typeof callback === "function") {
          return callback(data);
        }
      } catch (error) {

      }
    }, type), ("rq_" + className + "_") + new Date());
  };

  var doGet = function(routeName, params, callback, type) {
    var ah, cached, cc, className, isCache, tempParams, url;
    if (params == null) {
      params = {};
    }
    if (callback == null) {
      callback = null;
    }
    if (type == null) {
      type = "json";
    }
    if (routeName.match(/^https?:\/\//) === null) {
      url = this.__parse_url(this.__urls[routeName], params);
    } else {
      url = this.__parse_url(routeName, params);
    }
    className = this.name;
    isCache = params["__cache"] === true;
    if (isCache === true) {
      delete params["__cache"];
    }
    cc = this.__cacheContainer;
    ah = this.__afterHooks;
    if (isCache === true) {
      cached = cc.find("" + className + "#" + routeName, params);
    }
    if (cached != null) {
      if (typeof callback === "function") {
        return callback(cached.data);
      }
    } else {
      tempParams = $.extend({}, params);
      tempParams["__no_cache"] = new Date().getTime();
      return RQ.add($.get(url, tempParams, function(data) {
        if (isCache === true) {
          cc.push({
            id: "" + className + "#" + routeName,
            params: params,
            data: data
          });
        }
        try {
          if (typeof ah[routeName] === "function") {
            ah[routeName](data);
          }
          if (typeof callback === "function") {
            return callback(data);
          }
        } catch (error) {

        }
      }, type, ("rq_" + className + "_") + new Date()));
    }
  };

  var createCollection = function(data, callback) {
    var collection, item, obj, _i, _len;
    collection = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      item = data[_i];
      obj = new this;
      if (typeof callback === "function") {
        obj.set(callback(item));
      } else {
        obj.set(item);
      }
      collection.push(obj);
    }
    return collection;
  };

  this.clear = function() {
    return this.set(__defaults);
  };

  this.refresh = function(callback) {
    return this.show(function(data) {
      if (data.status === "SUCCESS") {
        this.set(data);
      }
      if (typeof callback === "function") {
        return callback(data);
      }
    });
  };

  this.toJSON = function(options) {
    return ko.toJSON(this.clone(options));
  };

  this.toJS = function(options) {
    return ko.toJS(this.clone(options));
  };

  this.clone = function(args) {
    var i, param, temp, transientAttributes, _i, _len, _ref;
    if (args == null) {
      args = {};
    }
    transientAttributes = {
      '__urls': false
    };
    _ref = __transientParameters;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      param = _ref[_i];
      transientAttributes[param] = false;
    }
    args = $.extend(transientAttributes, args);
    temp = {};
    for (i in this) {
      if (!__hasProp.call(this, i)) continue;
      if (args[i] === true || args[i] === void 0) {
        temp[i] = this.get(i);
      }
    }
    return temp;
  };

  this.backup = function() {
    return __backup = this.toJS();
  };

  this.restore = function() {
    this.set(__backup);
    __backup = {};
    return this;
  };

  this.start_transaction = function() {
    var i, item, _results;
    _results = [];
    for (i in this) {
      if (!__hasProp.call(this, i)) continue;
      item = this[i];
      if (typeof this[i].equalityComparer === "function") {
        _results.push(this[i].equalityComparer = function() {
          return true;
        });
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  this.commit = function() {
    var i, item, _results;
    _results = [];
    for (i in this) {
      if (!__hasProp.call(this, i)) continue;
      item = this[i];
      if (typeof this[i].equalityComparer === "function") {
        this[i].equalityComparer = __equalityComparer;
        if (typeof this[i].valueHasMutated === "function") {
          _results.push(this[i].valueHasMutated());
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  this.isNew = function() {
    var value;
    value = this.get("id");
    return value === null || value === void 0 || value === "";
  };

  this.validate = function() {
    return true;
  };

  this.save = function() {
    var callback, params, _ref;
    if (this.validate() === true) {
      if (this.isNew() === true) {
        return this.create.apply(this, arguments);
      } else {
        return this.update.apply(this, arguments);
      }
    } else {
      _ref = __generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      if (typeof callback === "function") {
        return callback({
          status: "ERROR",
          message: "Invalid object"
        });
      }
    }
  };

  var __generate_request_parameters = function() {
    var callback, params;
    params = {};
    callback = null;
    if (typeof arguments[0] === "function") {
      callback = arguments[0];
    } else if (typeof arguments[0] === "object") {
      params = arguments[0];
      if (typeof arguments[1] === "function") {
        callback = arguments[1];
      }
    }
    return [params, callback];
  };

  var __parse_url = function(url, params) {
    var a, link;
    a = document.createElement("a");
    a.href = url;
    a.pathname = a.pathname.replace(/:([a-zA-Z0-9_]+)/g, function(match) {
      var attr, value;
      attr = match.substring(1);
      value = params[attr];
      delete params[attr];
      return value;
    });
    link = a.href;
    a = null;
    return link;
  };

  this.create = function() {
    var callback, params, _ref;
    _ref = __generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    params = $.extend(params, this.toJS());
    return this.doPost("create", params, callback);
  };

  this.update = function() {
    var callback, params, _ref;
    _ref = __generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    params = $.extend(params, this.toJS());
    return this.doPost("update", params, callback);
  };

  this.destroy = function() {
    var callback, params, _ref;
    _ref = __generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    params = $.extend(params, this.toJS());
    return this.doPost("destroy", params, callback);
  };

  this.show = function() {
    var callback, params, _ref;
    _ref = __generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    params = $.extend(params, {
      id: this.get("id")
    });
    return this.doGet("show", params, callback);
  };

  this.index = function() {
    var callback, params, _ref;
    _ref = __generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    return this.doGet("index", params, callback);
  };

  var create = function() {
    var callback, params, _ref;
    _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    return this.doPost("create", params, callback);
  };

  var update = function() {
    var callback, params, _ref;
    _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    return this.doPost("update", params, callback);
  };

  var destroy = function() {
    var callback, params, _ref;
    _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    return this.doPost("destroy", params, callback);
  };

  var show = function() {
    var callback, params, _ref;
    _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    return this.doGet("show", params, callback);
  };

  var index = function() {
    var callback, params, _ref;
    _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
    return this.doGet("index", params, callback);
  };

  var killAllRequests = function() {
    return RQ.killByRegex(/^rq_#{@name}_/);
  };
});
