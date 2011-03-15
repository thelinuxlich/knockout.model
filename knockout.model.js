(function() {
  var __hasProp = Object.prototype.hasOwnProperty;
  ko.utils.IdentityMap = function() {
    return this.find = function(id, params) {
      return $.grep(this, function(d) {
        return d.id === id && ko.utils.stringifyJson(d.params) === ko.utils.stringifyJson(params);
      })[0];
    };
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
    KnockoutModel.__cacheContainer = new ko.utils.IdentityMap();
    function KnockoutModel() {
      this.set(this.constructor.__defaults);
    }
    KnockoutModel.prototype.get = function(attr) {
      return ko.utils.unwrapObservable(this[attr]);
    };
    KnockoutModel.prototype.set = function(args) {
      var i, item;
      for (i in args) {
        if (!__hasProp.call(args, i)) continue;
        item = args[i];
        if (ko.isWriteableObservable(this[i])) {
          this[i](typeof item === "string" && item.match(/^&[^\s]*;$/) ? ko.utils.unescapeHtml(item) : item);
        } else if (this[i] !== void 0) {
          this[i] = typeof item === "string" && item.match(/^&[^\s]*;$/) ? ko.utils.unescapeHtml(item) : item;
        }
      }
      return this;
    };
    KnockoutModel.createCollection = function(data) {
      var collection, item, obj, _i, _len;
      collection = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        item = data[_i];
        obj = new this;
        obj.set(item);
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
            if (toString.call() === "[object Array]") {
              values[i] = (this.constructor.__defaults[i] !== void 0 ? this.constructor.__defaults[i] : []);
            }
        }
      }
      return this.set(values);
    };
    KnockoutModel.prototype.toJSON = function(options) {
      var temp;
      temp = this.clone(options);
      return ko.toJSON(temp);
    };
    KnockoutModel.prototype.toJS = function(options) {
      var temp;
      temp = this.clone(options);
      return ko.toJS(temp);
    };
    KnockoutModel.prototype.clone = function(args) {
      var i, temp;
      if (args == null) {
        args = {};
      }
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
      if (this.validate() === true) {
        if (this.isNew() === true) {
          return this.create.apply(this, arguments);
        } else {
          return this.update.apply(this, arguments);
        }
      } else {
        return callback({
          status: "ERROR",
          message: "Invalid object"
        });
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
      var fixed_param, fixed_params, _i, _len;
      fixed_params = url.match(/:[a-zA-Z0-9_]+/);
      if ((fixed_params != null) && fixed_params.length > 0) {
        for (_i = 0, _len = fixed_params.length; _i < _len; _i++) {
          fixed_param = fixed_params[_i];
          url = url.replace(fixed_param, params[fixed_param.substring(1)]);
        }
      }
      return url;
    };
    KnockoutModel.prototype.create = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return RQ.add($.post(this.constructor.__parse_url(this.constructor.__urls["create"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.constructor.name + "_") + new Date()));
    };
    KnockoutModel.prototype.update = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return RQ.add($.post(this.constructor.__parse_url(this.constructor.__urls["update"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.constructor.name + "_") + new Date()));
    };
    KnockoutModel.prototype.destroy = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return RQ.add($.post(this.constructor.__parse_url(this.constructor.__urls["destroy"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.constructor.name + "_") + new Date()));
    };
    KnockoutModel.prototype.show = function() {
      var cached, callback, isCache, params, tempParams, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      isCache = (params != null) && params["__cache"] === true;
      if (isCache === true) {
        cached = this.constructor.__cacheContainer.find("" + this.name + "#show", params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        delete params["__cache"];
        tempParams = params;
        tempParams["__no_cache"] = new Date().getTime();
        return RQ.add($.getJSON(this.constructor.__parse_url(this.construtor.__urls["show"], params), tempParams, function(data) {
          if (isCache === true) {
            this.constructor.__cacheContainer.push({
              id: "" + this.constructor.name + "#show",
              params: params,
              data: data
            });
          }
          if (typeof callback === "function") {
            return callback(data);
          }
        }, ("rq_" + this.constructor.name + "_") + new Date()));
      }
    };
    KnockoutModel.prototype.index = function() {
      var cached, callback, isCache, params, tempParams, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      isCache = (params != null) && params["__cache"] === true;
      if (isCache === true) {
        cached = this.constructor.__cacheContainer.find("" + this.name + "#index", params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        delete params["__cache"];
        tempParams = params;
        tempParams["__no_cache"] = new Date().getTime();
        return RQ.add($.getJSON(this.constructor.__parse_url(this.constructor.__urls["index"], params), tempParams, function(data) {
          if (isCache === true) {
            this.constructor.__cacheContainer.push({
              id: "" + this.constructor.name + "#index",
              params: params,
              data: data
            });
          }
          if (typeof callback === "function") {
            return callback(data);
          }
        }, ("rq_" + this.constructor.name + "_") + new Date()));
      }
    };
    KnockoutModel.create = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return RQ.add($.post(this.__parse_url(this.__urls["create"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.name + "_") + new Date()));
    };
    KnockoutModel.update = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return RQ.add($.post(this.__parse_url(this.__urls["update"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.name + "_") + new Date()));
    };
    KnockoutModel.destroy = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return RQ.add($.post(this.__parse_url(this.__urls["destroy"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.name + "_") + new Date()));
    };
    KnockoutModel.show = function() {
      var cached, callback, isCache, params, tempParams, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      isCache = (params != null) && params["__cache"] === true;
      if (isCache === true) {
        cached = this.__cacheContainer.find("" + this.name + "#show", params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        delete params["__cache"];
        tempParams = params;
        tempParams["__no_cache"] = new Date().getTime();
        return RQ.add($.getJSON(this.__parse_url(this.__urls["show"], params), tempParams, function(data) {
          if (isCache === true) {
            this.__cacheContainer.push({
              id: "" + this.name + "#show",
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
    KnockoutModel.index = function() {
      var cached, callback, isCache, params, tempParams, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      isCache = (params != null) && params["__cache"] === true;
      if (isCache === true) {
        cached = this.__cacheContainer.find("" + this.name + "#index", params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        delete params["__cache"];
        tempParams = params;
        tempParams["__no_cache"] = new Date().getTime();
        return RQ.add($.getJSON(this.__parse_url(this.__urls["index"], params), tempParams, function(data) {
          if (isCache === true) {
            this.__cacheContainer.push({
              id: "" + this.name + "#index",
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
    KnockoutModel.killAllRequests = function() {
      return RQ.killByRegex(/^rq_#{@name}_/);
    };
    return KnockoutModel;
  })();
}).call(this);
