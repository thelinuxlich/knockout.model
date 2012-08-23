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
* ATTENTION! This version is not retrocompatible! Changes were made to ensure a better experience without Coffeescript!
* Override the __urls attribute to set your RESTful routes
* The values you set on the attributes will be default when you call obj.clear()
* Override the __transientParameters attribute to set values that will not save(convert to json or to js)
* You can pass {__cache: true} to index(),show() or doGet() alongside other request parameters to search local cache before triggering an AJAX request
* Override the __afterHooks attribute with a object containing callbacks to run after a route is invoked

## Model Methods
* obj.get(attr) - Gets the attribute value(whether observable or not)
* obj.set(object_with_values) - Sets attribute(s) value(s)(whether observable or not)
* obj.refresh(callback) - Loads model data from show url and sets itself with it
* obj.clear() - Clears all attributes(whether observable or not) and sets default values after
* obj.toJSON(obj) - Converts whole model to JSON format, optional parameter containing an object with attributes to be serialized(Example: {id: true,name:false})
* obj.toJS(obj) - Converts whole model to JS object representation, optional parameter containing an object with attributes to be serialized(Example: {id: true,name:false})
* obj.isNew() - True if model.id is empty, false if isn't
* obj.validate() - Implement your own function returning true or false
* obj.save(params,callback) - Creates or updates a model instance, calling validate() before
* obj.create(params,callback) - Creates a model instance on the server, using the "create" key from the url object
* obj.update(params,callback) - Updates an existing model instance on the server, using the "update" key from the url object
* obj.destroy(params,callback) - Deletes an existing model instance on the server, using the "destroy" key from the url object
* obj.show(params,callback) - Fetches a model data(usually based on id) from the server, using the "show" key from the url object
* obj.index(params,callback) - Fetches all model data from the server, using the "index" key from the url object
* obj.addRoute(id,href,static = true) - Adds/modifies a route on __urls object. Third parameter also adds the route to static routes.
* obj.doGet(route_id_or_url,params,callback,type="json") - Creates a new AJAX GET request with the same pattern of the standard routes.
* obj.doPost(route_id_or_url,params,callback,type="json") - Creates a new AJAX POST request with the same pattern of the standard routes.
* obj.start_transaction() - Disconnects the model of subscribers temporarily
* obj.commit() - Reconnects the model with its subscribers and notifies them
* obj.backup() - Stores all model values in a temporary internal objects
* obj.restore() - Restores all model values saved with obj.backup()

## Example(see docs for more details):
    var Employee = Ctor(KoModel, function(super) { // inheriting KoModel to boost your own models!
        this.__urls = {
            "index": "http://#{window.location.host}/employees",
            "show": "http://#{window.location.host}/employees/:id",
            "create": "http://#{window.location.host}/employees/post",
            "update": "http://#{window.location.host}/employees/put",
            "destroy": "http://#{window.location.host}/employees/delete"
        }

        // We won't send status_text attribute to the server
        this.__transientParameters = ["status_text"];

        // An example of callback for automatically setting the model id after create
        this.__afterHooks: {
            "create": function(response) {	this.id(response.id) }
        }

        this.id = ko.observable("");
        this.name = ko.observable("John Doe");
        this.surname = ko.observable("");
        this.fullname = ko.computed(function() {
            return this.name() + " " + this.surname();
        }, this);
        this.birth_date = ko.observable("");
        this.address = ko.observable("");
        this.phone = ko.observable("");
        this.status = ko.observable("E");
        this.status_text = ko.computed(function() {
             if(this.status() === "E") {
                return "enabled"; 
             } else {   
                return "disabled";
             }
        }, this);
        super.init.call(this); // if you want the this.__defaults applied to your model instance, call super.init.call(this)

        this.validate = function() {
            return(this.name() !== "" && this.surname() !== "" && this.birth_date() !== "");
        }
    });
