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
* You need to call super() on your coffee class constructor, optionally passing a "defaults" object and a "urls" object

## Model Methods
* .get(attr) - Gets the attribute value(whether observable or not)
* .set(object_with_values) - Sets attribute(s) value(s)(whether observable or not)
* .clear() - Clears all attributes(whether observable or not) and sets default values after
* .toJSON() - Converts whole model to JSON format
* .toJS() - Converts whole model to JS object representation
* .isNew() - True if model.id is empty, false if isn't
* .validate() - Implement your own function returning true or false
* .save(extra_params) - Creates or updates a model instance, calling validate() before
* .create(extra_params) - Creates a model instance on the server, using the "create" key from the url object
* .update(extra_params) - Updates an existing model instance on the server, using the "update" key from the url object
* .destroy(extra_params) - Deletes an existing model instance on the server, using the "destroy" key from the url object
* .show(extra_params) - Fetches a model data(usually based on id) from the server, using the "show" key from the url object
* .index(extra_params) - Fetches all model data from the server, using the "index" key from the url object
* .killAllRequests() - Aborts all AJAX requests of this model

## Example(see docs for more details):
    class @Employee extends KnockoutModel

        constructor: (defaults) ->
            @id = ko.observable ""
            @name = ko.observable ""
            @surname = ko.observable ""
            @fullname = ko.dependentObservable(-> @name() + " " + @surname()), @
            @birth_date = ko.observable ""
            @address = ko.observable ""
            @phone = ko.observable ""
            urls =
                "index": "http://#{window.location.host}/employees"
                "show": "http://#{window.location.host}/employees/:id"
                "post": "http://#{window.location.host}/employees/post"
                "put": "http://#{window.location.host}/employees/put"
                "delete": "http://#{window.location.host}/employees/delete"
            super(defaults,urls)

        validate: ->
            @name() isnt "" and @surname() isnt "" and @birth_date() isnt "" and
                    @address() isnt ""

