# Knockout.model plugin
Copyright 2011, Alisson Cavalcante Agiani

Licensed under the MIT license.

http://github.com/thelinuxlich/knockout.model/MIT-LICENSE.txt

Date: Fri Mar 04 14:00:29 2011 -0300

## Files:
* knockout.model.js

## Dependencies:
* jQuery 1.4.2+
* reqman.js at https://github.com/thelinuxlich/reqman.js
* Knockout 1.1+

## Howto
* This plugin was created with Coffeescript class approach, so you should use it too or you'll have to write a lot of ugly javascript
* Override the __urls attribute to set your RESTful routes
* Override the __defaults attribute to set default values on model instance
* Override the __transientParameters attribute to set values that will not save(convert to json or to js)
* You can pass {__cache: true} to index() and show() alongside other request parameters to search local cache before triggering an AJAX request

## Model Methods
* obj.get(attr) - Gets the attribute value(whether observable or not)
* obj.set(object_with_values) - Sets attribute(s) value(s)(whether observable or not)
* obj.refresh(callback) - Loads model data from show url and sets itself with it
* obj.clear() - Clears all attributes(whether observable or not) and sets default values after
* obj.toJSON() - Converts whole model to JSON format
* obj.toJS() - Converts whole model to JS object representation
* obj.isNew() - True if model.id is empty, false if isn't
* obj.validate() - Implement your own function returning true or false
* obj.save(params,callback) - Creates or updates a model instance, calling validate() before
* obj.create(params,callback) - Creates a model instance on the server, using the "create" key from the url object
* obj.update(params,callback) - Updates an existing model instance on the server, using the "update" key from the url object
* obj.destroy(params,callback) - Deletes an existing model instance on the server, using the "destroy" key from the url object
* obj.show(params,callback) - Fetches a model data(usually based on id) from the server, using the "show" key from the url object
* obj.index(params,callback) - Fetches all model data from the server, using the "index" key from the url object
* obj.addRoute(id,href) - Adds/modifies a route on __urls object
* obj.getAction(id,options) - Creates a new GET action with the same pattern of the standard routes. First parameter is the __urls key of the route, options are:
** static: true/false - creates the action as static too
* obj.getAction(id,options) - Creates a new POST action with the same pattern of the standard routes. First parameter is the __urls key of the route, options are:
** static: true/false - creates the action as static too
* Model.killAllRequests() - Aborts all AJAX requests of this model (static method)
* Model.createCollection(data,transformFunction) - Creates a collection of model objects instantiating one-by-one with the data array, second parameter is a callback for customizing each item from data (static)
* Model.create(params,callback) - Same as obj.create() but static
* Model.update(params,callback) - Same as obj.update() but static
* Model.destroy(params,callback) - Same as obj.destroy() but static
* Model.show(params,callback) - Same as obj.show() but static (Ex.: Employee.show({id: 1},function(data){ //your code here. }))
* Model.index(params,callback) - Same as obj.index() but static

## Example(see docs for more details):
    class @Employee extends KnockoutModel
        @__urls:
                "index": "http://#{window.location.host}/employees"
                "show": "http://#{window.location.host}/employees/:id"
                "create": "http://#{window.location.host}/employees/post"
                "update": "http://#{window.location.host}/employees/put"
                "destroy": "http://#{window.location.host}/employees/delete"

        @__defaults:
                "name": "John Doe"

        # We won't send status_text attribute to the server
        @__transientParameters: ["status_text"]

        constructor: ->
            @id = ko.observable ""
            @name = ko.observable ""
            @surname = ko.observable ""
            @fullname = ko.dependentObservable(-> @name() + " " + @surname()), @
            @birth_date = ko.observable ""
            @address = ko.observable ""
            @phone = ko.observable ""
            @status = ko.observable "E"
            @status_text = ko.dependentObservable(-> if @status() is "E" then "enabled" else "disabled"), @
            super() # if you want the @__defaults applied to your model instance, call super() or @set @constructor.__defaults

        validate: ->
            @name() isnt "" and @surname() isnt "" and @birth_date() isnt "" and
                    @address() isnt ""

