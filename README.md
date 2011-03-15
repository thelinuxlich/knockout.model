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

## Model Methods
* obj.get(attr) - Gets the attribute value(whether observable or not)
* obj.set(object_with_values) - Sets attribute(s) value(s)(whether observable or not)
* obj.clear() - Clears all attributes(whether observable or not) and sets default values after
* obj.toJSON() - Converts whole model to JSON format
* obj.toJS() - Converts whole model to JS object representation
* obj.isNew() - True if model.id is empty, false if isn't
* obj.validate() - Implement your own function returning true or false
* obj.save(extra_params) - Creates or updates a model instance, calling validate() before
* obj.create(extra_params) - Creates a model instance on the server, using the "create" key from the url object
* obj.update(extra_params) - Updates an existing model instance on the server, using the "update" key from the url object
* obj.destroy(extra_params) - Deletes an existing model instance on the server, using the "destroy" key from the url object
* obj.show(extra_params) - Fetches a model data(usually based on id) from the server, using the "show" key from the url object
* obj.index(extra_params) - Fetches all model data from the server, using the "index" key from the url object
* Model.killAllRequests() - Aborts all AJAX requests of this model (static method)
* Model.createCollection(data) - Creates a collection of model objects instantiating one-by-one with the data array (static)
* Model.create(params) - Same as obj.create() but static
* Model.update(params) - Same as obj.update() but static
* Model.destroy(params) - Same as obj.destroy() but static
* Model.show(params) - Same as obj.show() but static (Ex.: Employee.show({id: 1}))
* Model.index(params) - Same as obj.index() but static

## Example(see docs for more details):
    class @Employee extends KnockoutModel
        @__urls =
                "index": "http://#{window.location.host}/employees"
                "show": "http://#{window.location.host}/employees/:id"
                "post": "http://#{window.location.host}/employees/post"
                "put": "http://#{window.location.host}/employees/put"
                "delete": "http://#{window.location.host}/employees/delete"

        @__defaults
                "name": "John Doe"

        constructor: ->
            @id = ko.observable ""
            @name = ko.observable ""
            @surname = ko.observable ""
            @fullname = ko.dependentObservable(-> @name() + " " + @surname()), @
            @birth_date = ko.observable ""
            @address = ko.observable ""
            @phone = ko.observable ""

        validate: ->
            @name() isnt "" and @surname() isnt "" and @birth_date() isnt "" and
                    @address() isnt ""

