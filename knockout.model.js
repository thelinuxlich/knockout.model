(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Function.prototype.interceptRelation = function(callback) {
    var underlyingObservable;
    underlyingObservable = this;
    return ko.dependentObservable({
      read: function() {
        if (underlyingObservable.__newRelationObject === true) {
          underlyingObservable().refresh();
        }
        return underlyingObservable;
      },
      write: function(value) {
        return callback.call(underlyingObservable, value);
      }
    });
  };
  Function.prototype.interceptHasManyRelation = function(callbackRead, callbackWrite) {
    var obs, underlyingObservable;
    underlyingObservable = this;
    obs = ko.dependentObservable({
      read: function() {
        return callbackRead.call(underlyingObservable);
      },
      write: function(value) {
        return callbackWrite.call(underlyingObservable, value);
      }
    });
    ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(methodName) {
      return obs[methodName] = function() {
        var methodCallResult;
        methodCallResult = underlyingObservable[methodName].apply(underlyingObservable(), arguments);
        underlyingObservable.valueHasMutated();
        return methodCallResult;
      };
    });
    obs.slice = function() {
      return underlyingObservable[methodName].apply(underlyingObservable(), arguments);
    };
    obs.refresh = function() {
      obs.__newRelationObject = true;
      return obs();
    };
    obs.remove = function(valueOrPredicate) {
      var i, predicate, remainingValues, removedValues, underlyingArray, value, _ref;
      underlyingArray = underlyingObservable();
      remainingValues = [];
      removedValues = [];
      predicate = typeof valueOrPredicate === "function" ? valueOrPredicate : function(value) {
        return value === valueOrPredicate;
      };
      for (i = 0, _ref = underlyingArray.length(-1); (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        value = underlyingArray[i];
        if (!predicate(value)) {
          remainingValues.push(value);
        } else {
          removedValues.push(value);
        }
      }
      underlyingObservable(remainingValues);
      return removedValues;
    };
    obs.removeAll = function(arrayOfValues) {
      var allValues, elements;
      if (arrayOfValues === void 0) {
        allValues = underlyingObservable();
        underlyingObservable([]);
        return allValues;
      }
      if (!arrayOfValues) {
        return [];
      }
      elements = underlyingObservable.remove(function(value) {
        return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
      });
      return elements;
    };
    return obs.indexOf = function(item) {
      var underlyingArray;
      underlyingArray = underlyingObservable();
      return ko.utils.arrayIndexOf(underlyingArray, item);
    };
  };
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
      this.set(this.constructor.__defaults);
    }
    KnockoutModel.prototype.get = function(attr) {
      return ko.utils.unwrapObservable(this[attr]);
    };
    KnockoutModel.prototype.set = function(args) {
      var i, item, obj;
      for (i in args) {
        if (!__hasProp.call(args, i)) continue;
        item = args[i];
        if (ko.isWriteableObservable(this[i])) {
          if (this[i].__fromRelationship === true) {
            obj = this[i]();
            if (toString.call(obj) === "[object Array]") {
              this[i](i);
            } else {
              obj().set(item);
            }
          } else {
            this[i](typeof item === "string" && item.match(/^&[^\s]*;$/) ? ko.utils.unescapeHtml(item) : item);
          }
        } else if (this[i] !== void 0) {
          this[i] = typeof item === "string" && item.match(/^&[^\s]*;$/) ? ko.utils.unescapeHtml(item) : item;
        }
      }
      if (this.__fromRelationship === true && this.validate() === true) {
        this.__newRelationObject = false;
      }
      return this;
    };
    KnockoutModel.prototype.belongsTo = function(relationName, args) {
      var obj_owner, that;
      args = args || {};
      if (!(args["class"] != null)) {
        args["class"] = relationName.charAt(0).toUpperCase() + relationName.slice(1);
      }
      obj_owner = eval("new " + args['class'] + "()");
      that = this;
      this[relationName] = ko.observable(obj_owner).interceptRelation(function(value) {
        return this().set(value);
      });
      this[relationName].__fromRelationship = true;
      return this[relationName].__newRelationObject = true;
    };
    KnockoutModel.prototype.hasMany = function(relationName, args) {
      var obj_child, that;
      args = args || {};
      if (!(args["class"] != null)) {
        args["class"] = relationName.charAt(0).toUpperCase() + relationName.slice(1);
      }
      obj_child = eval(args['class']);
      that = this;
      this[relationName] = ko.observable([]).interceptHasManyRelation(function() {
        var params;
        if (that[relationName].__newRelationObject = true && that.isNew() === false) {
          params = {};
          params[that.construtor.name.toLowerCase() + "_id"] = that.get("id");
          return obj_child.index(params, function(response) {
            if (response != null) {
              that[relationName](obj_child.createCollection(response, function(item) {
                return item.__relationLink = that[relationName];
              }));
            }
            return that[relationName].__newRelationObject = false;
          });
        } else {
          return this;
        }
      }, function(value) {
        return this($.map(value, function(i, item) {
          return item.__relationLink = that[relationName];
        }));
      });
      this[relationName].__childObject = obj_child;
      this[relationName].__fromRelationship = true;
      return this[relationName].__newRelationObject = true;
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
      var i, item, obj, values;
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
            if (this[i].__fromRelationship === true) {
              obj = this.get(i);
              if (toString.call(obj) === "[object Array]") {
                values[i] = [];
              } else {
                values[i] = null;
              }
            } else if (toString.call(this.get(i)) === "[object Array]") {
              values[i] = (this.constructor.__defaults[i] !== void 0 ? this.constructor.__defaults[i] : []);
            }
        }
      }
      return this.set(values);
    };
    KnockoutModel.prototype.refresh = function() {
      return this.show({
        id: this.get("id")
      }, function(data) {
        return this.set(data);
      });
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
      var i, param, temp, transientAttributes, _i, _len, _ref;
      if (args == null) {
        args = {};
      }
      transientAttributes = {
        "__relationLink": false,
        "__newRelationObject": false,
        "__fromRelationship": false,
        "__childObject": false
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
      }, "json"), ("rq_" + this.constructor.name + "_") + new Date());
    };
    KnockoutModel.prototype.update = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return RQ.add($.post(this.constructor.__parse_url(this.constructor.__urls["update"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, "json"), ("rq_" + this.constructor.name + "_") + new Date());
    };
    KnockoutModel.prototype.destroy = function() {
      var callback, params, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      params = $.extend(params, this.toJS());
      return RQ.add($.post(this.constructor.__parse_url(this.constructor.__urls["destroy"], params), params, function(data) {
        if ((data != null) && data.status === "SUCCESS" && (this.__relationLink != null)) {
          this.__relationLink.remove(function(item) {
            return item.id === this.get("id");
          });
        }
        if (typeof callback === "function") {
          return callback(data);
        }
      }, "json"), ("rq_" + this.constructor.name + "_") + new Date());
    };
    KnockoutModel.prototype.show = function() {
      var cached, callback, isCache, params, tempParams, _ref;
      _ref = this.constructor.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      isCache = (params != null) && params["__cache"] === true;
      if (isCache === true) {
        delete params["__cache"];
      }
      if (isCache === true) {
        cached = this.constructor.__cacheContainer.find("" + this.constructor.name + "#show", params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        tempParams = $.extend({}, params);
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
        delete params["__cache"];
      }
      if (isCache === true) {
        cached = this.constructor.__cacheContainer.find("" + this.constructor.name + "#index", params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        tempParams = $.extend({}, params);
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
      }, "json"), ("rq_" + this.name + "_") + new Date());
    };
    KnockoutModel.update = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return RQ.add($.post(this.__parse_url(this.__urls["update"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, "json"), ("rq_" + this.name + "_") + new Date());
    };
    KnockoutModel.destroy = function() {
      var callback, params, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      return RQ.add($.post(this.__parse_url(this.__urls["destroy"], params), params, function(data) {
        if (typeof callback === "function") {
          return callback(data);
        }
      }, "json"), ("rq_" + this.name + "_") + new Date());
    };
    KnockoutModel.show = function() {
      var cached, callback, isCache, params, tempParams, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      isCache = (params != null) && params["__cache"] === true;
      if (isCache === true) {
        delete params["__cache"];
      }
      if (isCache === true) {
        cached = this.__cacheContainer.find("" + this.name + "#show", params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        tempParams = $.extend({}, params);
        tempParams["__no_cache"] = new Date().getTime();
        return RQ.add($.getJSON(this.__parse_url(this.__urls["show"], params), tempParams, __bind(function(data) {
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
        }, this), ("rq_" + this.name + "_") + new Date()));
      }
    };
    KnockoutModel.index = function() {
      var cached, callback, isCache, params, tempParams, _ref;
      _ref = this.__generate_request_parameters.apply(this, arguments), params = _ref[0], callback = _ref[1];
      isCache = (params != null) && params["__cache"] === true;
      if (isCache === true) {
        delete params["__cache"];
      }
      if (isCache === true) {
        cached = this.__cacheContainer.find("" + this.name + "#index", params);
      }
      if (cached != null) {
        if (typeof callback === "function") {
          return callback(cached.data);
        }
      } else {
        tempParams = $.extend({}, params);
        tempParams["__no_cache"] = new Date().getTime();
        return RQ.add($.getJSON(this.__parse_url(this.__urls["index"], params), tempParams, __bind(function(data) {
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
        }, this), ("rq_" + this.name + "_") + new Date()));
      }
    };
    KnockoutModel.killAllRequests = function() {
      return RQ.killByRegex(/^rq_#{@name}_/);
    };
    return KnockoutModel;
  })();
}).call(this);
