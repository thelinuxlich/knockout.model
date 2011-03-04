(function() {
  var __hasProp = Object.prototype.hasOwnProperty;
  this.KnockoutModel = (function() {
    function KnockoutModel(defaults, urls) {
      this.__defaults = typeof defaults === "object" ? defaults : {};
      this.__urls = typeof urls === "object" ? urls : {};
      this.set(this.__defaults);
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
          this[i](typeof item === "string" && item.match(/^&[^\s]*;$/) ? item.unescapeHtml() : item);
        } else if (this[i] !== void 0) {
          this[i] = typeof item === "string" && item.match(/^&[^\s]*;$/) ? item.unescapeHtml() : item;
        }
      }
      return this;
    };
    KnockoutModel.prototype.clear = function() {
      var i, item, values;
      values = {};
      for (i in this) {
        if (!__hasProp.call(this, i)) continue;
        item = this[i];
        if (i !== "__defaults" && i !== "__urls") {
          switch (typeof this.get(i)) {
            case "string":
              values[i] = (this.__defaults[i] !== void 0 ? this.__defaults[i] : "");
              break;
            case "number":
              values[i] = (this.__defaults[i] !== void 0 ? this.__defaults[i] : 0);
              break;
            case "boolean":
              values[i] = (this.__defaults[i] !== void 0 ? this.__defaults[i] : false);
              break;
            case "object":
              if (toString.call() === "[object Array]") {
                values[i] = (this.__defaults[i] !== void 0 ? this.__defaults[i] : []);
              }
          }
        }
      }
      return this.set(values);
    };
    KnockoutModel.prototype.toJSON = function(options) {
      var temp;
      temp = this.clone(options);
      temp["__no_cache"] = new Date();
      return ko.toJSON(temp);
    };
    KnockoutModel.prototype.toJS = function(options) {
      var temp;
      temp = this.clone(options);
      temp["__no_cache"] = new Date();
      return ko.toJS(temp);
    };
    KnockoutModel.prototype.clone = function(args) {
      var i, options, temp;
      temp = {};
      args = args || {};
      options = $.extend({
        "__defaults": false,
        "__urls": false
      }, args);
      for (i in this) {
        if (!__hasProp.call(this, i)) continue;
        if (options[i] === true || options[i] === void 0) {
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
    KnockoutModel.prototype.__generate_request_parameters = function() {
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
    KnockoutModel.prototype.create = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return RQ.add($.post(this.__urls["post"], params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.constructor.name + "_") + new Date()));
    };
    KnockoutModel.prototype.update = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return RQ.add($.post(this.__urls["put"], params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.constructor.name + "_") + new Date()));
    };
    KnockoutModel.prototype.destroy = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, {
        id: this.get("id")
      });
      return RQ.add($.post(this.__urls["delete"], params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.constructor.name + "_") + new Date()));
    };
    KnockoutModel.prototype.fetchOne = function() {
      var callback, params, __no_cache, _ref;
      __no_cache = new Date();
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, {
        id: this.get("id")
      });
      return RQ.add($.getJSON(this.__urls["get"] + "?foo=" + __no_cache, {
        id: this.get("id")
      }, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.constructor.name + "_") + new Date()));
    };
    KnockoutModel.prototype.fetchAll = function() {
      var callback, params, __no_cache, _ref;
      __no_cache = new Date();
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return RQ.add($.getJSON(this.__urls["get"] + "?foo=" + __no_cache, params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, ("rq_" + this.constructor.name + "_") + new Date()));
    };
    KnockoutModel.prototype.killAllRequests = function() {
      return RQ.killByRegex(/^rq_#{@constructor.name}_/);
    };
    return KnockoutModel;
  })();
}).call(this);
