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
      var i, item;
      this.__urls = this.constructor.__urls;
      for (i in this) {
        if (!__hasProp.call(this, i)) continue;
        item = this[i];
        if (i !== "__urls") {
          this.constructor.__defaults[i] = this.get(i);
        }
      }
    }
    KnockoutModel.prototype.__urls = {};
    KnockoutModel.prototype.addRoute = function(id, href, isStatic) {
      if (isStatic == null) {
        isStatic = true;
      }
      this.__urls[id] = href;
      if (isStatic === true) {
        return this.constructor.__urls[id] = href;
      }
    };
    KnockoutModel.prototype.get = function(attr) {
      return ko.utils.unwrapObservable(this[attr]);
    };
    KnockoutModel.prototype.set = function(args) {
      var i, item, new_value, obj;
      obj = this;
      for (i in args) {
        item = args[i];
        if (ko.isWriteableObservable(obj[i])) {
          new_value = typeof item === "string" && item.match(/&[^\s]*;/) === false ? ko.utils.unescapeHtml(item) : item;
          if (new_value !== obj[i]()) {
            obj[i](new_value);
          }
        } else if (obj[i] !== void 0 && ko.isObservable(obj[i]) === false) {
          new_value = item.match(/&[^\s]*;/) === false ? ko.utils.unescapeHtml(item) : item;
          obj[i] = new_value;
        }
      }
      return obj;
    };
    KnockoutModel.prototype.doPost = function(routeName, params, callback, type) {
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
      if (routeName.match(/^http:\/\//) === null) {
        url = this.__urls[routeName];
      } else {
        url = routeName;
      }
      return this.constructor.doPost(url, params, callback, type);
    };
    KnockoutModel.prototype.doGet = function(routeName, params, callback, type) {
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
      if (routeName.match(/^http:\/\//) === null) {
        url = this.__urls[routeName];
      } else {
        url = routeName;
      }
      return this.constructor.doGet(url, params, callback, type);
    };
    KnockoutModel.doPost = function(routeName, params, callback, type) {
      var className, url;
      if (params == null) {
        params = {};
      }
      if (callback == null) {
        callback = null;
      }
      if (type == null) {
        type = "json";
      }
      if (routeName.match(/^http:\/\//) === null) {
        url = this.__parse_url(this.__urls[routeName], params);
      } else {
        url = this.__parse_url(routeName, params);
      }
      className = this.name;
      return RQ.add($.post(url, params, function(data) {
        try {
          if (typeof callback === "function") {
            return callback(data);
          }
        } catch (error) {

        }
      }, type), ("rq_" + className + "_") + new Date());
    };
    KnockoutModel.doGet = function(routeName, params, callback, type) {
      var cached, cc, className, isCache, tempParams, url;
      if (params == null) {
        params = {};
      }
      if (callback == null) {
        callback = null;
      }
      if (type == null) {
        type = "json";
      }
      if (routeName.match(/^http:\/\//) === null) {
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
            if (typeof callback === "function") {
              return callback(data);
            }
          } catch (error) {

          }
        }, type, ("rq_" + className + "_") + new Date()));
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
      return this.set(this.constructor.__defaults);
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
      return value === null || value === void 0 || value === "";
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
