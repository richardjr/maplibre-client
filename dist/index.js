"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaplibreClient = void 0;
var maplibre_gl_1 = require("maplibre-gl");
// @ts-ignore
var mapbox_gl_draw_1 = require("@mapbox/mapbox-gl-draw");
// @ts-ignore
var turf = require("@turf/turf");
var defaultLayers = ["data"];
// Maplibre Client
var MaplibreClient = /** @class */ (function () {
    function MaplibreClient(options) {
        var _this = this;
        this.queue = [];
        this.loaded = false;
        this.debug = false;
        this.geojson = {};
        this.events = [];
        // Draw line mode
        this.draw_point_mode = "add";
        this.draw_actual_points = [];
        this.draw_history = [];
        this.moving_point = null;
        this.drawProperties = {};
        this.history = [];
        this.options = options;
        this.map = new maplibre_gl_1.Map({
            container: 'map',
            style: this.options.style || '/mapfiles/?file=cartodb-xyz.json',
            center: this.options.center || [-0.9307443, 50.7980974],
            zoom: this.options.zoom || 10,
            minZoom: this.options.minZoom || 15,
            maxZoom: this.options.maxZoom || 1
        });
        // Setup default layers geojson
        for (var layer in defaultLayers) {
            this.geojson[defaultLayers[layer]] = { "type": "FeatureCollection", "features": [] };
        }
        if (this.options.controls === true) {
            this.map.addControl(new maplibre_gl_1.NavigationControl());
        }
        this.canvas = this.map.getCanvasContainer();
        if (options.debug && options.debug === true) {
            console.log('*********************** MAP DEBUG ***********************');
            console.log('Maplibre Client: ', options);
            this.map.showCollisionBoxes = true;
            this.map.showTileBoundaries = true;
            this.map.on('click', function () {
                // Print the current map center and zoom
                console.log('Center:', _this.map.getCenter());
                console.log('Zoom:', _this.map.getZoom());
            });
        }
        var self = this;
        this.map.on('load', function () {
            self.loaded = true;
            self.loadIcons(self.options.icons);
            self.enableLocation();
            self.processQueue();
            self.reload_data();
        });
        var draw = new mapbox_gl_draw_1.default();
        this.map.addControl(draw);
    }
    MaplibreClient.prototype.loadIcons = function (icons) {
        var self = this;
        icons.forEach(function (icon) {
            // Make a random uuid to use as the image name
            var uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            self.map.loadImage(icon.url + "?cacheblock=" + uuid).then(function (response) {
                // Add the image to the map
                self.map.addImage(icon.name, response.data);
            });
        });
    };
    MaplibreClient.prototype.enableLocation = function () {
    };
    MaplibreClient.prototype.reload_data = function () {
        var _this = this;
        if (this.options.json_url !== undefined) {
            fetch(this.options.json_url)
                .then(function (response) { return response.json(); })
                .then(function (data) {
                _this.addGeojson(data, 'data', _this.options.fit);
            })
                .catch(function (error) { return console.error(error); });
        }
    };
    MaplibreClient.prototype.addGeojson = function (data, layer_name, fit, values) {
        if (layer_name === void 0) { layer_name = 'data'; }
        if (fit === void 0) { fit = false; }
        this.addQueueOperation({ type: 'add_geojson', data: data, layer_name: layer_name, toggle: fit, values: values });
    };
    MaplibreClient.prototype.addQueueOperation = function (operation) {
        this.queue.push(operation);
        this.processQueue();
    };
    /**
     * Add ids to the geojson data
     *
     * We need unique ids for each feature
     * @param data
     */
    MaplibreClient.prototype._addIdsToGeojson = function (data) {
        for (var i in data.features) {
            if (data.features[i].properties && !data.features[i].properties.id) {
                data.features[i].properties.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            }
        }
        return data;
    };
    /**
     * Process the queue of operations
     *
     */
    MaplibreClient.prototype.processQueue = function () {
        var source;
        var self = this;
        if (this.loaded === true && this.queue.length > 0) {
            var operation_1 = this.queue.shift();
            self._debugLog("Processing Queue ".concat(operation_1.type));
            switch (operation_1.type) {
                case 'line_draw':
                    this._LineDrawMode(operation_1);
                    break;
                case 'set_center':
                    this.map.setCenter(operation_1.values);
                    break;
                case 'delete_feature':
                    source = this.map.getSource(operation_1.layer_name);
                    if (this.geojson[operation_1.layer_name]) {
                        var data = this.geojson[operation_1.layer_name];
                        var features = data.features;
                        for (var i in features) {
                            if (features[i].properties && features[i].properties.id && features[i].properties.id === operation_1.values.id) {
                                features.splice(Number(i), 1);
                                break;
                            }
                        }
                        //@ts-ignore
                        source.setData(data);
                    }
                    break;
                case 'move_feature':
                    source = this.map.getSource(operation_1.layer_name);
                    if (this.geojson[operation_1.layer_name]) {
                        var data = this.geojson[operation_1.layer_name];
                        var features = data.features;
                        for (var i in features) {
                            if (features[i].properties && features[i].properties.id && features[i].properties.id === operation_1.values.id) {
                                features[i].geometry.coordinates = operation_1.values.lonLat;
                                break;
                            }
                        }
                        //@ts-ignore
                        source.setData(data);
                    }
                    break;
                case 'add_geojson':
                    source = this.map.getSource(operation_1.layer_name);
                    // Add ids to the geojson
                    operation_1.data = this._addIdsToGeojson(operation_1.data);
                    this._addHistory(operation_1.layer_name);
                    if (operation_1.values && operation_1.values['merge'] === true && this.geojson[operation_1.layer_name]) {
                        // Merge the data
                        var new_data = operation_1.data;
                        var old_data = this.geojson[operation_1.layer_name];
                        for (var i in new_data.features) {
                            old_data.features.push(new_data.features[i]);
                        }
                        // copy the old data
                        var copyData = JSON.parse(JSON.stringify(old_data));
                        //@ts-ignore
                        source.setData(old_data);
                        this.geojson[operation_1.layer_name] = copyData;
                    }
                    else {
                        var copyData = JSON.parse(JSON.stringify(operation_1.data));
                        //@ts-ignore
                        source.setData(operation_1.data);
                        this.geojson[operation_1.layer_name] = copyData;
                    }
                    if (this.geojson[operation_1.layer_name].features.length > 0) {
                        if (operation_1.toggle === true) {
                            var bbox = turf.bbox(this.geojson[operation_1.layer_name]);
                            this.map.fitBounds(bbox, { padding: this.options.padding, maxZoom: this.options.maxZoom });
                        }
                    }
                    break;
                case 'clear_layer':
                    //@ts-ignore
                    this.map.clearLayer(operation_1.layer_name);
                    break;
                case 'add_event':
                    var callback = function (event) {
                        // See if there is a feature(s) here:
                        var features = [];
                        var actual_features = [];
                        if (operation_1.layer_filter) {
                            // Filters do not seem to work correctly for line strings because reasons
                            features = self.map.queryRenderedFeatures(event.point, { layers: operation_1.layer_filter });
                            // we need to get the actual feature from the geojson not these ones as they are in a crazy state
                            /*for(let i in features) {
                                let feature = self.getFeature(operation.layer_name,features[i].properties.id);
                                if(feature) {
                                    actual_features.push(feature);
                                }
                            }*/
                        }
                        // @ts-ignore
                        operation_1.hook([event.lngLat.lng, event.lngLat.lat], event, JSON.parse(JSON.stringify(features)));
                    };
                    if (operation_1.toggle === true) {
                        self.clearAllEvents();
                    }
                    // Make an event object
                    var event_1 = { hook: operation_1.hook, layer_name: operation_1.layer_name, clear: operation_1.toggle, event_type: operation_1.event_type, layer_filter: operation_1.layer_filter };
                    event_1.hook_actual = callback;
                    if (event_1.layer_name) {
                        this.map.on(event_1.event_type, event_1.layer_name, callback);
                    }
                    else {
                        this.map.on(event_1.event_type, callback);
                    }
                    this.events.push(event_1);
                    break;
                case 'resize':
                    this.map.resize();
                    break;
                default:
                    console.log('Unknown Operation', operation_1);
                    break;
            }
            this.processQueue();
        }
    };
    // private methods
    MaplibreClient.prototype._fuzzyMatch = function (point1, point2, precision) {
        precision = precision || 0.0001;
        //console.log(`points: ${point1}:${point2} diff: ${point1-point2} - precision: ${precision}`);
        if (point1 === point2 && point1 === point2)
            return true;
        if (point1 - precision <= point2 && point1 + precision >= point2 && point1 - precision <= point2 && point1 + precision >= point2)
            return true;
        return false;
    };
    MaplibreClient.prototype._addHistory = function (layer_name) {
        // Add *copy* of the geojson to the history
        this.history.push({ type: "geojson_full", layer_name: layer_name, data: JSON.parse(JSON.stringify(this.geojson[layer_name])) });
    };
    MaplibreClient.prototype._findMidpoint = function (pointA, pointB) {
        return [(pointA[0] + pointB[0]) / 2, (pointA[1] + pointB[1]) / 2];
    };
    MaplibreClient.prototype._drawLine = function () {
        var line = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: this.draw_actual_points
            }
        };
        // Draw the line on the map
        this.geojson["draw-end-points"] = { "type": "FeatureCollection", "features": [] };
        this.geojson["draw-mid-points"] = { "type": "FeatureCollection", "features": [] };
        // Make the actual points geojson
        for (var i in this.draw_actual_points) {
            this.geojson["draw-end-points"].features.push({
                "type": "Feature",
                "geometry": { "coordinates": this.draw_actual_points[i], "type": "Point" },
                "properties": { "actual_index": i }
            });
        }
        // Make the mid points geojson
        for (var i = 0; i < this.draw_actual_points.length - 1; i++) {
            var mid_point = this._findMidpoint(this.draw_actual_points[i], this.draw_actual_points[i + 1]);
            this.geojson["draw-mid-points"].features.push({
                "type": "Feature",
                "geometry": { "coordinates": [mid_point[0], mid_point[1]], "type": "Point" },
                "properties": { "actual_index": i }
            });
        }
        //@ts-ignore
        this.map.getSource("draw-mid-points").setData(this.geojson["draw-mid-points"]);
        //@ts-ignore
        this.map.getSource("draw-end-points").setData(this.geojson["draw-end-points"]);
        //@ts-ignore
        this.map.getSource("draw-vertex").setData(line);
    };
    MaplibreClient.prototype._debugLog = function (message) {
        if (this.options.debug === true) {
            console.log(message);
        }
    };
    MaplibreClient.prototype._LineDrawMode = function (operation) {
        var self = this;
        this.moving_point = null;
        this.drawProperties = {};
        this.map.getSource("draw-end-points").setData({ "type": "FeatureCollection", "features": [] });
        this.geojson["draw-end-points"] = { "type": "FeatureCollection", "features": [] };
        this.draw_history = [];
        this.clearAllEvents();
        function onMove(point, e) {
            var coords = e.lngLat;
            self.draw_actual_points[self.moving_point] = [coords.lng, coords.lat];
            self._drawLine();
            self.canvas.style.cursor = 'grabbing';
        }
        function onUp(e) {
            self.canvas.style.cursor = '';
            self.clearEventType('mousemove');
            self.clearEventType('mouseup');
        }
        this.addEvent({ event_type: 'mousedown', layer_name: 'draw-end-points', hook: function (point, e) {
                e.preventDefault();
                if (e.originalEvent.which === 1) {
                    // left click
                    self.draw_history.push(JSON.parse(JSON.stringify(self.draw_actual_points)));
                    self.moving_point = e.features[0].properties.actual_index;
                    self.canvas.style.cursor = 'grab';
                    self.addEvent({ event_type: 'mousemove', hook: onMove, clear: false });
                    self.addEvent({ event_type: 'mouseup', hook: onUp, clear: false });
                    //self.map.on('mousemove', onMove);
                    //self.map.once('mouseup', onUp);
                }
                if (e.originalEvent.which === 3) {
                    // right click
                    self.draw_history.push(JSON.parse(JSON.stringify(self.draw_actual_points)));
                    self.draw_actual_points.splice(e.features[0].properties.actual_index, 1);
                    self._drawLine();
                }
            }, clear: false });
        this.addEvent({ event_type: 'mousedown', layer_name: 'draw-mid-points', hook: function (point, e) {
                e.preventDefault();
                if (e.originalEvent.which === 1) {
                    // add a new point at the midpoint in the array
                    self.draw_history.push(JSON.parse(JSON.stringify(self.draw_actual_points)));
                    self.draw_actual_points.splice(e.features[0].properties.actual_index + 1, 0, [e.lngLat.lng, e.lngLat.lat]);
                    self._drawLine();
                    self.moving_point = e.features[0].properties.actual_index + 1;
                    self.canvas.style.cursor = 'grab';
                    //self.map.on('mousemove', onMove);
                    self.addEvent({ event_type: 'mousemove', hook: onMove, clear: false });
                    self.addEvent({ event_type: 'mouseup', hook: onUp, clear: false });
                    //self.map.once('mouseup', onUp);
                }
            }, clear: false });
        // json contains a line string we need to convert to points in draw_actual_points
        if (operation.data && operation.data.features && operation.data.features.length > 0 && operation.data.features[0].geometry && operation.data.features[0].geometry.coordinates && operation.data.features[0].geometry.coordinates.length > 0) {
            this.draw_actual_points = operation.data.features[0].geometry.coordinates;
            // Create a line between all the points
            var line = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: this.draw_actual_points
                }
            };
            // Draw the line on the map
            self.map.getSource("draw-vertex").setData(line);
            self._drawLine();
            this.drawProperties = operation.data.features[0].properties;
        }
        function addPoint(point, e) {
            var features = self.map.queryRenderedFeatures(e.point, { layers: ['draw-end-points'] });
            if (self.draw_point_mode === "add") {
                if (features.length > 0) {
                    // This is a move then handled else where
                }
                else {
                    self.draw_history.push(JSON.parse(JSON.stringify(self.draw_actual_points)));
                    self.draw_actual_points.push(point);
                    // Create a line between all the points
                    self._drawLine();
                }
            }
            else {
                // Delete mode
                // Find any points within 10 pixels of the click
                if (features.length > 0) {
                    // Delete the point
                    // find the point in draw_actual_points using the coordinates
                    for (var i in self.draw_actual_points) {
                        // fuzzy match of coordinates by 0.0001
                        if (self._fuzzyMatch(self.draw_actual_points[i][0], features[0].geometry.coordinates[0]) && self._fuzzyMatch(self.draw_actual_points[i][1], features[0].geometry.coordinates[1])) {
                            self.draw_history.push(JSON.parse(JSON.stringify(self.draw_actual_points)));
                            self.draw_actual_points.splice(i, 1);
                            break;
                        }
                    }
                    self._drawLine();
                }
            }
        }
        self.clickEvent({ hook: addPoint, clear: false });
    };
    // Public Methods
    MaplibreClient.prototype.historyUndo = function () {
        if (this.history.length > 0) {
            var operation = this.history.pop();
            if (operation.type === "geojson_full") {
                var source = this.map.getSource(operation.layer_name);
                source.setData(operation.data);
                this.geojson[operation.layer_name] = operation.data;
            }
        }
    };
    /**
     * Undo the last point drawn
     * @constructor
     */
    MaplibreClient.prototype.LineDrawUndo = function () {
        console.log(this.draw_history);
        if (this.draw_history.length > 0) {
            this.draw_actual_points = this.draw_history.pop();
            this._drawLine();
        }
    };
    /**
     * Line Draw Mode enable
     * @param layer_name - the layer name to draw on
     * @param toggle - enable or disable
     * @constructor
     */
    MaplibreClient.prototype.LineDrawMode = function (layer_name, toggle, features) {
        if (toggle === void 0) { toggle = true; }
        this.addQueueOperation({ type: 'line_draw', layer_name: layer_name, toggle: toggle, data: features });
    };
    /**
     * Set the visibility of a layer
     * @param layer_name
     * @param visibility
     */
    MaplibreClient.prototype.setLayerVisibility = function (layer_name, visibility) {
        this.addQueueOperation({ type: 'set_visibility', layer_name: layer_name, values: { visibility: visibility } });
    };
    /**
     * Set the center of the map
     * @param center
     */
    MaplibreClient.prototype.setCenter = function (center) {
        this.addQueueOperation({ type: 'set_center', values: center });
    };
    /**
     * Delete a feature from a layer using the feature id
     * @param layer_name
     * @param feature_id
     */
    MaplibreClient.prototype.deleteFeature = function (layer_name, feature_id) {
        this.addQueueOperation({ type: 'delete_feature', layer_name: layer_name, values: { id: feature_id } });
    };
    MaplibreClient.prototype.moveFeaturePoint = function (layer_name, feature_id, lonLat) {
        this.addQueueOperation({ type: 'move_feature', layer_name: layer_name, values: { id: feature_id, lonLat: lonLat } });
    };
    /**
     * Get a layer as a geojson object
     * @param layer_name
     * @return {GeoJSON}
     */
    MaplibreClient.prototype.getGeojsonLayer = function (layer_name) {
        return this.geojson[layer_name];
    };
    MaplibreClient.prototype.getFeature = function (layer_name, feature_id) {
        var features = this.geojson[layer_name].features;
        for (var i in features) {
            if (features[i].properties && features[i].properties.id && features[i].properties.id === feature_id) {
                return features[i];
            }
        }
        return null;
    };
    /**
     * Merge two geojson objects
     * @param data1
     * @param data2
     * @return {GeoJSON}
     */
    MaplibreClient.prototype.mergeGeojson = function (data1, data2) {
        var features = data1.features.concat(data2.features);
        return {
            type: "FeatureCollection",
            features: features
        };
    };
    /**
     * Get the center of the map
     * @return {number[]}
     */
    MaplibreClient.prototype.getCenter = function () {
        // get center of the map
        var center = this.map.getCenter();
        // return the center as an array
        return [center.lng, center.lat];
    };
    /**
     * Get the drawn line string TODO this needs to support multiple lines
     */
    MaplibreClient.prototype.getDrawnLineString = function () {
        var data = { "type": "FeatureCollection", "features": [{
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: this.draw_actual_points
                    }
                }] };
        return data;
    };
    /**
     * Finalise the line draw and add it to the map
     * @param layer
     * @param properties
     */
    MaplibreClient.prototype.finaliseLineDraw = function (layer, properties, mode) {
        if (layer === void 0) { layer = 'data'; }
        if (properties === void 0) { properties = {}; }
        if (mode === void 0) { mode = 'save'; }
        this.clearAllEvents();
        // merge the saved properties with properties sent
        properties = Object.assign(this.drawProperties, properties);
        if (mode === "save") {
            var geojson = this.getDrawnLineString();
            geojson.features[0].properties = properties;
            // Check we have more than 2 points
            if (geojson.features[0].geometry.coordinates.length < 2) {
                return;
            }
            geojson = this._addIdsToGeojson(geojson);
            this.addGeojson(geojson, layer, false, { merge: true });
        }
        this.draw_actual_points = [];
        this.map.getSource("draw-vertex").setData({ "type": "FeatureCollection", "features": [] });
        this.map.getSource("draw-mid-points").setData({ "type": "FeatureCollection", "features": [] });
        this.map.getSource("draw-end-points").setData({ "type": "FeatureCollection", "features": [] });
        this.geojson["draw-end-points"] = { "type": "FeatureCollection", "features": [] };
        this.geojson["draw-mid-points"] = { "type": "FeatureCollection", "features": [] };
        this.geojson["draw-vertex"] = { "type": "FeatureCollection", "features": [] };
    };
    /**
     * Clear all events from the map
     * @return {void}
     */
    MaplibreClient.prototype.clearAllEvents = function () {
        for (var i in this.events) {
            // @ts-ignore IS this working???
            if (this.events[i].layer_name)
                this.map.off(this.events[i].event_type, this.events[i].layer_name, this.events[i].hook_actual);
            else
                this.map.off(this.events[i].event_type, this.events[i].hook_actual);
        }
        this.events = [];
    };
    /**
     * Clear all events of a certain type
     * @param eventType
     */
    MaplibreClient.prototype.clearEventType = function (eventType) {
        for (var i in this.events) {
            if (this.events[i].event_type === eventType) {
                if (this.events[i].layer_name)
                    this.map.off(eventType, this.events[i].layer_name, this.events[i].hook_actual);
                else
                    this.map.off(eventType, this.events[i].hook_actual);
                this.events.splice(Number(i), 1);
            }
        }
    };
    /**
     * Add a click event to the map
     * @param eventOption
     */
    MaplibreClient.prototype.clickEvent = function (eventOption) {
        this.addQueueOperation({
            type: 'add_event',
            event_type: 'click',
            layer_name: eventOption.layer_name,
            hook: eventOption.hook,
            toggle: eventOption.clear,
            layer_filter: eventOption.layer_filter
        });
    };
    MaplibreClient.prototype.dragFeature = function (layer_name, feature_id) {
        if (layer_name === void 0) { layer_name = 'data'; }
        var self = this;
        //self.clearAllEvents();
        function onDragMove(point, e) {
            var coords = e.lngLat;
            self.moveFeaturePoint(layer_name, feature_id, [coords.lng, coords.lat]);
        }
        function onDragEnd(e) {
            self.clearEventType('mousemove');
            self.clearEventType('mouseup');
        }
        this.addEvent({ event_type: 'mousemove', hook: onDragMove, clear: false });
        this.addEvent({ event_type: 'mouseup', hook: onDragEnd, clear: false });
    };
    /**
     * Add all other events to the map
     * @param eventOption
     */
    MaplibreClient.prototype.addEvent = function (eventOption) {
        this.addQueueOperation({
            type: 'add_event',
            event_type: eventOption.event_type,
            layer_name: eventOption.layer_name,
            hook: eventOption.hook,
            toggle: eventOption.clear,
            layer_filter: eventOption.layer_filter
        });
    };
    /**
     * resize the map
     * @return {void}
     */
    MaplibreClient.prototype.resize = function () {
        this.addQueueOperation({ type: 'resize' });
    };
    /**
     * Set the style of the map
     * @param style
     */
    MaplibreClient.prototype.setStyle = function (style) {
        this.map.setStyle(style);
        // Reload all the geojson data
        for (var layer in this.geojson) {
            //@ts-ignore
            this.map.getSource(layer).setData(this.geojson[layer]);
        }
    };
    return MaplibreClient;
}());
exports.MaplibreClient = MaplibreClient;
