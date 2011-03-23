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
        @__urls = @constructor.__urls
        @set(@constructor.__defaults)
    
    # Adds or modifies a route on instance and stactically
    addRoute: (id,href) ->
      @__urls[id] = href
      @constructor.__urls[id] = href

    # Gets an attribute value(observable or not)
    get: (attr) ->
        ko.utils.unwrapObservable @[attr]

    # Args must be an object containing one or more attributes and its new values
    # Additionally, detects HTML entities and unescape them
    set: (args) ->
        for own i,item of args
            if ko.isWriteableObservable(@[i])
                @[i](if typeof item is "string" and item.match(/&[^\s]*;/) then ko.utils.unescapeHtml(item) else item)
            else if @[i] isnt undefined
                @[i] = if typeof item is "string" and item.match(/&[^\s]*;/) then ko.utils.unescapeHtml(item) else item

        @

    # creates an action with HTTP POST
    postAction: (routeName,options) ->
        options = options or {}
        @[routeName] = ->
            [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
            params = $.extend(params,@toJS())
            url = @constructor.__parse_url(@__urls[routeName],params)
            RQ.add ($.post url, params, (data) ->
                    callback(data) if typeof callback is "function"
                , "json"
            ), "rq_#{@constructor.name}_"+new Date()
        if options["static"] is true
            @constructor[routeName] = ->
                [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
                url = @__parse_url(@__urls[routeName],params)
                RQ.add ($.post url, params, (data) ->
                        callback(data) if typeof callback is "function"
                    , "json"
                ), "rq_#{@name}_"+new Date()

    # creates an action with HTTP GET
    getAction: (routeName,options) ->
        options = options or {}
        @[routeName] = ->
            [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
            isCache = params? and params["__cache"] is true
            delete params["__cache"] if isCache is true
            cached = @constructor.__cacheContainer.find("#{@constructor.name}##{routeName}", params) if isCache is true
            if cached?
                callback(cached.data) if typeof callback is "function"
            else
                tempParams = $.extend {},params
                tempParams["__no_cache"] = new Date().getTime()
                url = @constructor.__parse_url(@__urls[routeName],tempParams)
                RQ.add $.getJSON url, tempParams, (data) ->
                    @constructor.__cacheContainer.push({id: "#{@constructor.name}##{routeName}", params: params,data: data}) if isCache is true
                    callback(data) if typeof callback is "function"
                , "rq_#{@constructor.name}_"+new Date()
        if options["static"] is true
            [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
            isCache = params? and params["__cache"] is true
            delete params["__cache"] if isCache is true
            cached = @__cacheContainer.find("#{@name}##{routeName}", params) if isCache is true
            if cached?
                callback(cached.data) if typeof callback is "function"
            else
                tempParams = $.extend {},params
                tempParams["__no_cache"] = new Date().getTime()
                url = @__parse_url(@__urls[routeName],tempParams)
                RQ.add $.getJSON url, tempParams, (data) ->
                    @__cacheContainer.push({id: "#{@name}##{routeName}", params: params,data: data}) if isCache is true
                    callback(data) if typeof callback is "function"
                , "rq_#{@name}_"+new Date()

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
                    values[i] = (if @constructor.__defaults[i] isnt undefined then @constructor.__defaults[i] else [])
        @set(values)

    # Refreshes model data calling show()
    refresh: (callback) ->
        @show {id: @get("id")}, (data) ->
            if data.status is "SUCCESS"
                @set(data)
            callback(data) if typeof callback is "function"

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
        transientAttributes = {}
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
            [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
            callback {status: "ERROR",message: "Invalid object"} if typeof callback is "function"

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
        url.replace /:([a-zA-Z0-9_]+)/g, (match) ->
            attr = match.substring(1)
            value = param[attr]
            delete param[attr]
            value

    # Starts an AJAX request to create the entity using the "create" URL
    create: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        url = @constructor.__parse_url(@__urls["create"],params)
        RQ.add ($.post url, params, (data) ->
                callback(data) if typeof callback is "function"
            , "json"
        ), "rq_#{@constructor.name}_"+new Date()

    # Starts an AJAX request to update the entity using the "update" URL
    update: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        url = @constructor.__parse_url(@__urls["update"],params)
        RQ.add ($.post url, params, (data) ->
                callback(data) if typeof callback is "function"
            , "json"
        ), "rq_#{@constructor.name}_"+new Date()

    # Starts an AJAX request to remove the entity using the "destroy" URL
    destroy: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add ($.post @constructor.__parse_url(@__urls["destroy"],params), params, (data) ->
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
            RQ.add $.getJSON @constructor.__parse_url(@__urls["show"],params), tempParams, (data) ->
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
            RQ.add $.getJSON @constructor.__parse_url(@__urls["index"],params), tempParams, (data) ->
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
