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
    @__afterHooks: {}
    @__cacheContainer: new ko.utils.IdentityMap()
    @__backup: {}
    @__equalityComparer: (a,b) ->
      primitiveTypes = {'undefined':true, 'boolean':true, 'number':true, 'string':true }
      oldValueIsPrimitive = (a is null) or (typeof(a) in primitiveTypes)
      if oldValueIsPrimitive then (a is b) else false

    # Sets default values on initialization
    constructor: ->
        @__urls = @constructor.__urls
        for own i,item of @
          if i isnt "__urls"
            if ko.isObservable(@[i])
              @[i].equalityComparer = @constructor.__equalityComparer
            @constructor.__defaults[i] = @get(i)

    # instance urls list
    __urls: {}

    # Adds or modifies a route on instance and statically
    addRoute: (id,href,isStatic = true) ->
      @__urls[id] = href
      @constructor.__urls[id] = href if isStatic is true

    # Gets an attribute value(observable or not)
    get: (attr) -> ko.utils.unwrapObservable @[attr]

    # Args must be an object containing one or more attributes and its new values
    # Additionally, detects HTML entities and unescape them
    set: (args) ->
        obj = @
        for i,item of args
            if ko.isWriteableObservable(obj[i]) 
                new_value = if typeof item is "string" and item.match(/&[^\s]*;/) isnt false then ko.utils.unescapeHtml(item) else item 
                if new_value isnt obj[i]()
                    obj[i](new_value)
            else if obj[i] isnt undefined and ko.isObservable(obj[i]) is false
                new_value = if item.match(/&[^\s]*;/) isnt false then ko.utils.unescapeHtml(item) else item 
                obj[i] = new_value
        obj

    # creates an action with HTTP POST
    doPost: (routeName,params = {},callback = null,type = "json") ->
        if routeName.match(/^http:\/\//) is null
            url = @__urls[routeName]
        else
            url = routeName
        @constructor.doPost url,params,callback,type

    # creates an action with HTTP GET
    doGet: (routeName,params = {},callback = null,type = "json") ->
        if routeName.match(/^http:\/\//) is null
            url = @__urls[routeName]
        else
            url = routeName
        @constructor.doGet url,params,callback,type

    # (static) creates an action with HTTP POST 
    @doPost: (routeName,params = {},callback = null,type = "json") ->
        if routeName.match(/^http:\/\//) is null
            url = @__parse_url(@__urls[routeName],params)
        else
            url = @__parse_url(routeName,params)
        className = @name
        ah = @__afterHooks
        RQ.add ($.post url, params, (data) ->
                try
                    ah[routeName](data) if typeof ah[routeName] is "function"
                    callback(data) if typeof callback is "function"
                catch error    
            , type
        ), "rq_#{className}_"+new Date()

    # (static) creates an action with HTTP GET
    @doGet: (routeName,params = {},callback = null,type = "json") ->
        if routeName.match(/^http:\/\//) is null
            url = @__parse_url(@__urls[routeName],params)
        else
            url = @__parse_url(routeName,params)
        className = @name
        isCache = params["__cache"] is true
        delete params["__cache"] if isCache is true
        cc = @__cacheContainer
        ah = @__afterHooks
        cached = cc.find("#{className}##{routeName}", params) if isCache is true
        if cached?
            callback(cached.data) if typeof callback is "function"
        else
            tempParams = $.extend {},params
            tempParams["__no_cache"] = new Date().getTime()
            RQ.add $.get url, tempParams, (data) ->
                    cc.push({id: "#{className}##{routeName}", params: params,data: data}) if isCache is true
                    try
                      if typeof ah[routeName] is "function"
                        ah[routeName](data)                         
                      callback(data) if typeof callback is "function"
                    catch error    
                , type
            , "rq_#{className}_"+new Date()

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
    clear: -> @set(@constructor.__defaults)

    # Refreshes model data calling show()
    refresh: (callback) ->
        @show (data) ->
            if data.status is "SUCCESS"
                @set(data)
            callback(data) if typeof callback is "function"

    # Convert whole model to JSON, adds a random attribute to avoid IE issues with GET requests
    toJSON: (options) -> ko.toJSON @clone(options)

    # Convert whole model to a plain JS object, adds a random attribute to avoid IE issues with GET requests
    toJS: (options) -> ko.toJS @clone(options)

    # Clones the model without 'private' attributes
    clone: (args = {}) ->
        transientAttributes = {'__urls': false}
        for param in @constructor.__transientParameters
            transientAttributes[param] = false
        args = $.extend(transientAttributes,args)
        temp = {}
        for own i of @
            if args[i] is true or args[i] is undefined
                temp[i] = @get(i)
        temp
    
    # Stores the actual model values in a temporary variable
    backup: -> @constructor.__backup = @toJS()

    # Restores the model values in a temporary variable
    restore: ->
      @set @constructor.__backup
      @constructor.__backup = {}
      @

    # Disconnects the model temporarily of binding notifications
    start_transaction: ->
      for own i,item of @
        if typeof @[i].equalityComparer is "function"
          @[i].equalityComparer = -> true

    # Reconnects the model with subscribers and notifies them   
    commit: ->
      for own i,item of @
        if typeof @[i].equalityComparer is "function"
          @[i].equalityComparer = @constructor.__equalityComparer
          @[i].valueHasMutated() if typeof @[i].valueHasMutated is "function"

    # A simple convention: if model.id is blank, then it's new
    isNew: ->
        value = @get("id")
        value is null or value is undefined or value is ""

    # Override this with your own validation method returning true or false
    validate: -> true

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
        a = document.createElement "a"
        a.href = url
        a.pathname = a.pathname.replace /:([a-zA-Z0-9_]+)/g, (match) ->
          attr = match.substring(1)
          value = params[attr]
          delete params[attr]
          value
        link = a.href
        a = null
        link

    # Starts an AJAX request to create the entity using the "create" URL
    create: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        @doPost "create",params,callback

    # Starts an AJAX request to update the entity using the "update" URL
    update: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        @doPost "update",params,callback

    # Starts an AJAX request to remove the entity using the "destroy" URL
    destroy: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        @doPost "destroy",params,callback

    # Fetch by model ID using the "show" URL
    show: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,{id: @get("id")})
        @doGet "show",params,callback

    # Fetch all using the "index" URL
    index: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        @doGet "index",params,callback

    # (static) Starts an AJAX request to create the entity using the "create" URL
    @create: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        @doPost "create",params,callback

    # (static) Starts an AJAX request to update the entity using the "update" URL
    @update: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        @doPost "update",params,callback

    # (static) Starts an AJAX request to remove the entity using the "destroy" URL
    @destroy: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        @doPost "destroy",params,callback

    # (static) Fetch by model ID using the "show" URL
    @show: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        @doGet "show",params,callback

    # (static) Fetch all using the "index" URL
    @index: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        @doGet "index",params,callback

    # (static) Abort all requests of this model
    @killAllRequests: -> RQ.killByRegex /^rq_#{@name}_/
