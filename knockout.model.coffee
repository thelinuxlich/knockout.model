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

    # Remember to call super(defaults,urls) on your models constructor
    constructor: (defaults,urls) ->
        @__defaults = if typeof defaults is "object" then defaults else {}
        @__urls = if typeof urls is "object" then urls else {}
        @set(@__defaults)

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

    # Clear all attributes and set default values
    clear: ->
        values = {}
        for own i,item of @
            if i isnt "__defaults" and i isnt "__urls"
                switch(typeof @get(i))
                    when "string" then values[i] = (if @__defaults[i] isnt undefined then @__defaults[i] else "")
                    when "number" then values[i] = (if @__defaults[i] isnt undefined then @__defaults[i] else 0)
                    when "boolean" then values[i] = (if @__defaults[i] isnt undefined then @__defaults[i] else false)
                    when "object"
                        if toString.call() is "[object Array]"
                            values[i] = (if @__defaults[i] isnt undefined then @__defaults[i] else [])
        @set(values)

    # Convert whole model to JSON, adds a random attribute to avoid IE issues with GET requests
    toJSON: (options) ->
        temp = @clone(options)
        temp["__no_cache"] = new Date()
        ko.toJSON(temp)

    # Convert whole model to a plain JS object, adds a random attribute to avoid IE issues with GET requests
    toJS: (options) ->
        temp = @clone(options)
        temp["__no_cache"] = new Date()
        ko.toJS(temp)

    # Clones the model without 'private' attributes
    clone: (args) ->
        temp = {}
        args = args or {}
        options = $.extend({"__defaults": false,"__urls": false},args)
        for own i of @
            if options[i] is true or options[i] is undefined
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
    __generate_request_parameters: ->
        params = {}
        callback = null
        if typeof arguments[0] is "function"
            callback = arguments[0]
        else if typeof arguments[0] is "object"
            params = arguments[0]
            if typeof arguments[1] is "function"
                callback = arguments[1]
        [params,callback]


    # Starts an AJAX request to create the entity using the "post" URL
    create: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add $.post @__urls["post"], params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Starts an AJAX request to update the entity using the "put" URL
    update: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,@toJS())
        RQ.add $.post @__urls["put"], params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Starts an AJAX request to remove the entity using the "delete" URL
    destroy: ->
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,{id: @get("id")})
        RQ.add $.post @__urls["delete"], params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Fetch by model ID using the "get" URL
    fetchOne: ->
        __no_cache = new Date()
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,{id: @get("id"),foo: __no_cache})
        RQ.add $.getJSON @__urls["get"], params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Fetch all using the "get" URL
    fetchAll: ->
        __no_cache = new Date()
        [params,callback] = @__generate_request_parameters.apply(@,arguments)
        params = $.extend(params,{foo: __no_cache})
        RQ.add $.getJSON @__urls["get"], params, (data) ->
            callback(data) if typeof callback is "function"
        , "rq_#{@constructor.name}_"+new Date()

    # Abort all requests of this model
    killAllRequests: ->
        RQ.killByRegex /^rq_#{@constructor.name}_/

