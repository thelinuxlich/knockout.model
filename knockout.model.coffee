# Intercept writable dependent observables with belongsTo
Function.prototype.interceptRelation = (callback) ->
        underlyingObservable = @
        ko.dependentObservable
            read: ->
                if underlyingObservable.__newRelationObject is true
                    underlyingObservable().refresh()
                underlyingObservable
            write: (value) -> callback.call underlyingObservable,value
                
# Intercept writable dependent observables with hasMany
Function.prototype.interceptHasManyRelation = (callbackRead,callbackWrite) ->
    underlyingObservable = @
    obs = ko.dependentObservable
        read: -> callbackRead.call(underlyingObservable)
        write: (value) -> callbackWrite.call(underlyingObservable,value)

    ko.utils.arrayForEach ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], (methodName) ->
        obs[methodName] = ->
            methodCallResult = underlyingObservable[methodName].apply(underlyingObservable(), arguments)
            underlyingObservable.valueHasMutated()
            methodCallResult

    obs.slice = -> underlyingObservable[methodName].apply(underlyingObservable(), arguments)

    obs.refresh = ->
        obs.__newRelationObject = true
        obs()

    obs.remove = (valueOrPredicate) ->
        underlyingArray = underlyingObservable()
        remainingValues = []
        removedValues = []
        predicate = if typeof valueOrPredicate is "function" then valueOrPredicate else (value) -> value is valueOrPredicate
        for i in [0..underlyingArray.length -1]
            value = underlyingArray[i]
            if (!predicate(value))
                remainingValues.push(value)
            else
                removedValues.push(value)
        underlyingObservable(remainingValues)
        removedValues

    obs.removeAll = (arrayOfValues) ->
        # If you passed zero args, we remove everything
        if (arrayOfValues is undefined) 
            allValues = underlyingObservable()
            underlyingObservable([])
            return allValues

        # If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return []
        elements = underlyingObservable.remove (value) ->
            ko.utils.arrayIndexOf(arrayOfValues, value) >= 0
        elements

    obs.indexOf = (item) ->
        underlyingArray = underlyingObservable()
        ko.utils.arrayIndexOf(underlyingArray, item)

# Cache implementation using the IdentityMap pattern
ko.utils.IdentityMap = ->

    #Simple object comparison by value
    @find = (id,params) ->
        $.grep(@,(d) ->
            d.id is id and ko.utils.stringifyJson(d.params) is ko.utils.stringifyJson(params)
        )[0]
    @
ko.utils.IdentityMap.prototype = new Array()

# Helper function
ko.utils.unescapeHtml = (str) ->
  if str.length > 0
    temp = document.createElement "div"
    temp.innerHTML = str
    result = temp.childNodes[0].nodeValue
    temp.removeChild temp.firstChild
    result
  else
    str

# Base model
class @KnockoutModel

    # Override these static values on your model
    @__urls: {}
    @__defaults: {}
    @__transientParameters: []
    @__cacheContainer: new ko.utils.IdentityMap()

    # Sets default values on initialization
    constructor: ->
        @set(@constructor.__defaults)

    # Gets an attribute value(observable or not)
    get: (attr) ->
        ko.utils.unwrapObservable @[attr]

    # Args must be an object containing one or more attributes and its new values
    # Additionally, detects HTML entities and unescape them
    set: (args) ->
        for own i,item of args
            if ko.isWriteableObservable(@[i])
                if @[i].__fromRelationship is true
                    obj = @[i]()
                    if toString.call(obj) is "[object Array]"
                        @[i](i)
                    else
                        obj().set item
                else
                    @[i](if typeof item is "string" and item.match(/^&[^\s]*;$/) then ko.utils.unescapeHtml(item) else item)
            else if @[i] isnt undefined
                @[i] = if typeof item is "string" and item.match(/^&[^\s]*;$/) then ko.utils.unescapeHtml(item) else item

        @__newRelationObject = false if @__fromRelationship is true and @validate() is true
        @

    # returns an attribute containing the owner in this relation
    belongsTo: (relationName,args) ->
        args = args or {}
        if !args["class"]?
            args["class"] = relationName.charAt(0).toUpperCase() + relationName.slice(1)
        obj_owner = eval("new #{args['class']}()")
        that = @
        @[relationName] = ko.observable(obj_owner).interceptRelation (value) ->
            @().set(value)
        @[relationName].__fromRelationship = true
        @[relationName].__newRelationObject = true

    # returns an attribute containing the array of children in this relation
    hasMany: (relationName,args) ->
        args = args or {}
        if !args["class"]?
            args["class"] = relationName.charAt(0).toUpperCase() + relationName.slice(1)
        obj_child = eval(args['class'])
        that = @
        @[relationName] = ko.observable([]).interceptHasManyRelation ->
            if that[relationName].__newRelationObject = true and that.isNew() is false
                params = {}
                params[that.construtor.name.toLowerCase()+"_id"] = that.get("id")
                obj_child.index params, (response) ->
                    if response?
                        that[relationName] obj_child.createCollection response,(item) ->
                            item.__relationLink = that[relationName]
                    that[relationName].__newRelationObject = false
            else
                @
        , (value) ->
            @ $.map value, (i,item) ->
                item.__relationLink = that[relationName]
        @[relationName].__childObject = obj_child
        @[relationName].__fromRelationship = true
        @[relationName].__newRelationObject = true

    # (static) Returns an array of objects using the data param(another array of data)
    @createCollection: (data,callback) ->
        collection = []
        for item in data
            obj = new @
            if typeof callback is "function"
                obj.set(callback(item))
            else
                obj.set(item)
            collection.push(obj)
        collection

    # Clear all attributes and set default values
    clear: ->
        values = {}
        for own i,item of @
            switch(typeof @get(i))
                when "string" then values[i] = (if @constructor.__defaults[i] isnt undefined then @constructor.__defaults[i] else "")
                when "number" then values[i] = (if @constructor.__defaults[i] isnt undefined then @constructor.__defaults[i] else 0)
                when "boolean" then values[i] = (if @constructor.__defaults[i] isnt undefined then @constructor.__defaults[i] else false)
                when "object"
                    if @[i].__fromRelationship is true
                        obj = @get(i)
                        if toString.call(obj) is "[object Array]"
                            values[i] = []
                        else
                            values[i] = null
                    else if toString.call(@get(i)) is "[object Array]"
                        values[i] = (if @constructor.__defaults[i] isnt undefined then @constructor.__defaults[i] else [])
        @set(values)

    # Refreshes model data calling show()
    refresh: ->
        @show {id: @get("id")}, (data) ->
            @set(data)

    # Convert whole model to JSON, adds a random attribute to avoid IE issues with GET requests
    toJSON: (options) ->
        temp = @clone(options)
        ko.toJSON(temp)

    # Convert whole model to a plain JS object, adds a random attribute to avoid IE issues with GET requests
    toJS: (options) ->
        temp = @clone(options)
        ko.toJS(temp)

    # Clones the model without 'private' attributes
    clone: (args = {}) ->
        transientAttributes = {"__relationLink": false,"__newRelationObject": false,"__fromRelationship": false,"__childObject": false}
        for param in @constructor.__transientParameters
            transientAttributes[param] = false
        args = $.extend(transientAttributes,args)
        temp = {}
        for own i of @
            if args[i] is true or args[i] is undefined
                temp[i] = @get(i)
        temp

    # A simple convention: if model.id is blank, then it's new
    isNew: ->
        value = @get("id")
        value? && value isnt ""

    # Override this with your own validation method returning true or false
    validate: ->
        true

    # Validate the model then check if it's new(call create) or existing(call update)
    save: ->
        if @validate() is true
            if @isNew() is true then @create.apply(@,arguments) else @update.apply(@,arguments)
        else
            callback {status: "ERROR",message: "Invalid object"}

    # Helper for all standard request methods
    # First parameter is a object containing additional parameters to send via AJAX
    # Second parameter is a callback to execute after request is finished
    @__generate_request_parameters: ->
        params = {}
        callback = null
        if typeof arguments[0] is "function"
            callback = arguments[0]
        else if typeof arguments[0] is "object"
            params = arguments[0]
            if typeof arguments[1] is "function"
                callback = arguments[1]
        [params,callback]

    # parses an url(Sinatra-like style with :parameters)
    @__parse_url: (url,params) ->
      fixed_params = url.match /:[a-zA-Z0-9_]+/
      if fixed_params? and fixed_params.length > 0
        url = url.replace fixed_param,params[fixed_param.substring(1)] for fixed_param in fixed_params
      url

    # Starts an AJAX request to create the entity using the "create" URL
    create: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add ($.post @constructor.__parse_url(@constructor.__urls["create"],params), params, (data) ->
                callback(data) if typeof callback is "function"
            , "json"
        ), "rq_#{@constructor.name}_"+new Date()

    # Starts an AJAX request to update the entity using the "update" URL
    update: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add ($.post @constructor.__parse_url(@constructor.__urls["update"],params), params, (data) ->
                callback(data) if typeof callback is "function"
            , "json"
        ), "rq_#{@constructor.name}_"+new Date()

    # Starts an AJAX request to remove the entity using the "destroy" URL
    destroy: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add ($.post @constructor.__parse_url(@constructor.__urls["destroy"],params), params, (data) ->
                if data? and data.status is "SUCCESS" and @__relationLink?
                    @__relationLink.remove (item) ->
                        item.id is @get("id")
                callback(data) if typeof callback is "function"
            , "json"    
        ), "rq_#{@constructor.name}_"+new Date()

    # Fetch by model ID using the "show" URL
    show: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        isCache = params? and params["__cache"] is true
        delete params["__cache"] if isCache is true
        cached = @constructor.__cacheContainer.find("#{@constructor.name}#show", params) if isCache is true
        if cached?
            callback(cached.data) if typeof callback is "function"
        else
            tempParams = $.extend {},params
            tempParams["__no_cache"] = new Date().getTime()
            RQ.add $.getJSON @constructor.__parse_url(@construtor.__urls["show"],params), tempParams, (data) ->
                @constructor.__cacheContainer.push({id: "#{@constructor.name}#show", params: params,data: data}) if isCache is true
                callback(data) if typeof callback is "function"
            , "rq_#{@constructor.name}_"+new Date()

    # Fetch all using the "index" URL
    index: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        isCache = params? and params["__cache"] is true
        delete params["__cache"] if isCache is true
        cached = @constructor.__cacheContainer.find("#{@constructor.name}#index", params) if isCache is true
        if cached?
            callback(cached.data) if typeof callback is "function"
        else
            tempParams = $.extend {},params
            tempParams["__no_cache"] = new Date().getTime()
            RQ.add $.getJSON @constructor.__parse_url(@constructor.__urls["index"],params), tempParams, (data) ->
                @constructor.__cacheContainer.push({id: "#{@constructor.name}#index", params: params,data: data}) if isCache is true
                callback(data) if typeof callback is "function"
            , "rq_#{@constructor.name}_"+new Date()

    # (static) Starts an AJAX request to create the entity using the "create" URL
    @create: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        RQ.add ($.post @__parse_url(@__urls["create"],params), params, (data) ->
                callback(data) if typeof callback is "function"
            , "json"
        ), "rq_#{@name}_"+new Date()

    # (static) Starts an AJAX request to update the entity using the "update" URL
    @update: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        RQ.add ($.post @__parse_url(@__urls["update"],params), params, (data) ->
                callback(data) if typeof callback is "function"
            , "json"
        ), "rq_#{@name}_"+new Date()

    # (static) Starts an AJAX request to remove the entity using the "destroy" URL
    @destroy: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        RQ.add ($.post @__parse_url(@__urls["destroy"],params), params, (data) ->
                callback(data) if typeof callback is "function"
            , "json"
        ), "rq_#{@name}_"+new Date()

    # (static) Fetch by model ID using the "show" URL
    @show: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        isCache = params? and params["__cache"] is true
        delete params["__cache"] if isCache is true
        cached = @__cacheContainer.find("#{@name}#show", params) if isCache is true
        if cached?
            callback(cached.data) if typeof callback is "function"
        else
            tempParams = $.extend {},params
            tempParams["__no_cache"] = new Date().getTime()
            RQ.add $.getJSON @__parse_url(@__urls["show"],params), tempParams, (data) =>
                @__cacheContainer.push({id: "#{@name}#show", params: params,data: data}) if isCache is true
                callback(data) if typeof callback is "function"
            , "rq_#{@name}_"+new Date()

    # (static) Fetch all using the "index" URL
    @index: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        isCache = params? and params["__cache"] is true
        delete params["__cache"] if isCache is true
        cached = @__cacheContainer.find("#{@name}#index", params) if isCache is true
        if cached?
            callback(cached.data) if typeof callback is "function"
        else
            tempParams = $.extend {},params
            tempParams["__no_cache"] = new Date().getTime()
            RQ.add $.getJSON @__parse_url(@__urls["index"],params), tempParams, (data) =>
                @__cacheContainer.push {id: "#{@name}#index", params: params,data: data} if isCache is true
                callback(data) if typeof callback is "function"
            , "rq_#{@name}_"+new Date()

    # (static) Abort all requests of this model
    @killAllRequests: ->
        RQ.killByRegex /^rq_#{@name}_/

