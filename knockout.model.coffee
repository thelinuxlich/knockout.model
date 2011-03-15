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
                @[i](if typeof item is "string" and item.match(/^&[^\s]*;$/) then ko.utils.unescapeHtml(item) else item)
            else if @[i] isnt undefined
                @[i] = if typeof item is "string" and item.match(/^&[^\s]*;$/) then ko.utils.unescapeHtml(item) else item
        @

    # (static) Returns an array of objects using the data param(another array of data)
    @createCollection: (data) ->
        collection = []
        for item in data
            collection.push new(@).set(item)
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
                    if toString.call() is "[object Array]"
                        values[i] = (if @constructor.__defaults[i] isnt undefined then @constructor.__defaults[i] else [])
        @set(values)

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
        url.replace fixed_param,params[fixed_param.substring(1)] for fixed_param in fixed_params

    # Starts an AJAX request to create the entity using the "create" URL
    create: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add $.post @constructor.__parse_url(@constructor.__urls["create"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Starts an AJAX request to update the entity using the "update" URL
    update: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add $.post @constructor.__parse_url(@constructor.__urls["update"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Starts an AJAX request to remove the entity using the "destroy" URL
    destroy: ->
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add $.post @constructor.__parse_url(@constructor.__urls["destroy"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Fetch by model ID using the "show" URL
    show: ->
        __no_cache = new Date()
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,{foo: __no_cache})
        RQ.add $.getJSON @constructor.__parse_url(@constructor.__urls["show"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Fetch all using the "index" URL
    index: ->
        __no_cache = new Date()
        [params,callback] = @constructor.__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,{foo: __no_cache})
        RQ.add $.getJSON @constructor.__parse_url(@constructor.__urls["index"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # (static) Starts an AJAX request to create the entity using the "create" URL
    @create: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        RQ.add $.post @__parse_url(@__urls["create"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@name}_"+new Date()

    # (static) Starts an AJAX request to update the entity using the "update" URL
    @update: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        RQ.add $.post @__parse_url(@__urls["update"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@name}_"+new Date()

    # (static) Starts an AJAX request to remove the entity using the "destroy" URL
    @destroy: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        RQ.add $.post @__parse_url(@__urls["destroy"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@name}_"+new Date()

    # (static) Fetch by model ID using the "show" URL
    @show: ->
        __no_cache = new Date()
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,{foo: __no_cache})
        RQ.add $.getJSON @__parse_url(@__urls["show"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@name}_"+new Date()

    # (static) Fetch all using the "index" URL
    @index: ->
        __no_cache = new Date()
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,{foo: __no_cache})
        RQ.add $.getJSON @__parse_url(@__urls["index"],params), params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@name}_"+new Date()

    # (static) Abort all requests of this model
    @killAllRequests: ->
        RQ.killByRegex /^rq_#{@name}_/

