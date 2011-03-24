(function() {
  var __hasProp = Object.prototype.hasOwnProperty;
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
  this.KnockoutModel = (function() {
    KnockoutModel.__urls = {};
    KnockoutModel.__defaults = {};
    KnockoutModel.__transientParameters = [];
    KnockoutModel.__cacheContainer = new ko.utils.IdentityMap();
    function KnockoutModel() {
      this.__urls = this.constructor.__urls;
      this.set(this.constructor.__defaults);
    }
    KnockoutModel.prototype.__urls = {};
    KnockoutModel.prototype.addRoute = function(id, href, static) {
      if (static == null) {
        static = true;
      }
      this.__urls[id] = href;
      if (static === true) {
        return this.constructor.__urls[id] = href;
      }
    };
    KnockoutModel.prototype.get = function(attr) {
      return ko.utils.unwrapObservable(this[attr]);
    };
    KnockoutModel.prototype.set = function(args) {
      var i, item;
      for (i in args) {
        if (!__hasProp.call(args, i)) continue;
        item = args[i];
        if (ko.isWriteableObservable(this[i])) {
          this[i](typeof item === "string" && item.match(/&[^\s]*;/) ? ko.utils.unescapeHtml(item) : item);
        } else if (this[i] !== void 0) {
          this[i] = typeof item === "string" && item.match(/&[^\s]*;/) ? ko.utils.unescapeHtml(item) : item;
        }
      }
      return this;
    };
    KnockoutModel.prototype.doPost = function(routeName, params, callback) {
      var url;
      if (params == null) {
        params = {};
      }
      if (callback == null) {
        callback = null;
      }
      if (routeName.match(/^http:\/\//) === null) {
        url = this.__urls[routeName];
      } else {
        url = routeName;
      }
      return this.constructor.doPost(url, params, callback);
    };
    KnockoutModel.prototype.doGet = function(routeName, params, callback) {
      var url;
      if (params == null) {
        params = {};
      }
      if (callback == null) {
        callback = null;
      }
      if (routeName.match(/^http:\/\//) === null) {
        url = this.__urls[routeName];
      } else {
        url = routeName;
      }
      return this.constructor.doGet(url, params, callback);
    };
    KnockoutModel.doPost = function(routeName, params, callback) {
      var url;
      if (params == null) {
        params = {};
      }
      if (callback == null) {
        callback = null;
      }
      if (routeName.match(/^http:\/\//) === null) {
        url = this.__parse_url(this.__urls[routeName], params);
      } else {
        url = this.__parse_url(routeName, params);
      }
      return RQ.add($.post(url, params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, "json"), ("rq_" + this.name + "_") + new Date());
    };
    KnockoutModel.doGet = function(routeName, params, callback) {
      var cached, cc, isCache, tempParams, url;
      if (params == null) {
        params = {};
      }
      if (callback == null) {
        callback = null;
      }
      if (routeName.match(/^http:\/\//) === null) {
        url = this.__parse_url(this.__urls[routeName], params);
      } else {
        url = this.__parse_url(routeName, params);
      }
      isCache = params["__cache"] === true;
      if (isCache === true) {
        delete params["__cache"];
      }
      cc = this.__cacheContainer;
      if (isCache === true) {
        cached = cc.find("" + this.name + "#" + routeName, params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        tempParams = $.extend({}, params);
        tempParams["__no_cache"] = new Date().getTime();
        return RQ.add($.getJSON(url, tempParams, function(data) {
          if (isCache === true) {
            cc.push({
              id: "" + this.name + "#" + routeName,
              params: params,
              data: data
            });
          }
          if (typeof callback === "function") {
            return callback(data);
          }
        }, ("rq_" + this.name + "_") + new Date()));
      }
    };
    KnockoutModel.createCollection = function(data, callback) {
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
    KnockoutModel.prototype.clear = function() {
      var i, item, values;
      values = {};
      for (i in this) {
        if (!__hasProp.call(this, i)) continue;
        item = this[i];
        if (i !== "__urls") {
          switch (typeof this.get(i)) {
            case "string":
              values[i] = (this.constructor.__defaults[i] !== void 0 ? this.constructor.__defaults[i] : "");
              break;
            case "number":
              values[i] = (this.constructor.__defaults[i] !== void 0 ? this.constructor.__defaults[i] : 0);
              break;
            case "boolean":
              values[i] = (this.constructor.__defaults[i] !== void 0 ? this.constructor.__defaults[i] : false);
              break;
            case "object":
              values[i] = (this.constructor.__defaults[i] !== void 0 ? this.constructor.__defaults[i] : []);
          }
        }
      }
      return this.set(values);
    };
    KnockoutModel.prototype.refresh = function(callback) {
      return this.show(function(data) {
        if (data.status === "SUCCESS") {
          this.set(data);
        }
        if (typeof callback === "function") {
          return callback(data);
        }
      });
    };
    KnockoutModel.prototype.toJSON = function(options) {
      return ko.toJSON(this.clone(options));
    };
    KnockoutModel.prototype.toJS = function(options) {
      return ko.toJS(this.clone(options));
    };
    KnockoutModel.prototype.clone = function(args) {
      var i, param, temp, transientAttributes, _i, _len, _ref;
      if (args == null) {
        args = {};
      }
      transientAttributes = {
        '__urls': false
      };
      _ref = this.constructor.__transientParameters;
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
    KnockoutModel.prototype.isNew = function() {
      var value;
      value = this.get("id");
      return (value != null) && value !== "";
    };
    KnockoutModel.prototype.validate = function() {
      return true;
    };
    KnockoutModel.prototype.save = function() {
      var callback, params, _ref;
      if (this.validate() === true) {
        if (this.isNew() === true) {
          return this.create.apply(this, arguments);
        } else {
          return this.update.apply(this, arguments);
        }
      } else {
        _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
        if (typeof callback === "function") {
          return callback({
            status: "ERROR",
            message: "Invalid object"
          });
        }
      }
    };
    KnockoutModel.__generate_request_parameters = function() {
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
    KnockoutModel.__parse_url = function(url, params) {
      return url.replace(/:([a-zA-Z0-9_]+)/g, function(match) {
        var value;
        params[match.substring(1)];
        value = params[attr];
        delete params[attr];
        return value;
      });
    };
    KnockoutModel.prototype.create = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return this.doPost("create", params, callback);
    };
    KnockoutModel.prototype.update = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return this.doPost("update", params, callback);
    };
    KnockoutModel.prototype.destroy = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return this.doPost("destroy", params, callback);
    };
    KnockoutModel.prototype.show = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, {
        id: this.get("id")
      });
      return this.doGet("show", params, callback);
    };
    KnockoutModel.prototype.index = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return this.doGet("index", params, callback);
    };
    KnockoutModel.create = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return this.doPost("create", params, callback);
    };
    KnockoutModel.update = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return this.doPost("update", params, callback);
    };
    KnockoutModel.destroy = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return this.doPost("destroy", params, callback);
    };
    KnockoutModel.show = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return this.doGet("show", params, callback);
    };
    KnockoutModel.index = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return this.doGet("index", params, callback);
    };
    KnockoutModel.killAllRequests = function() {
      return RQ.killByRegex(/^rq_#{@name}_/);
    };
    return KnockoutModel;
  })();
}).call(this);
