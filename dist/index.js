var $8zHUo$maplibregl = require("maplibre-gl");
var $8zHUo$mapboxmapboxgldraw = require("@mapbox/mapbox-gl-draw");
var $8zHUo$turfturf = require("@turf/turf");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "MaplibreClient", () => $882b6d93070905b3$export$70b4e56e45006596);



const $882b6d93070905b3$var$defaultLayers = [
    "data"
];
class $882b6d93070905b3$export$70b4e56e45006596 {
    constructor(options){
        this.queue = [];
        this.loaded = false;
        this.debug = false;
        this.geojson = {};
        this.events = [];
        // Draw line mode
        this.draw_point_mode = "add";
        this.draw_actual_points = [];
        this.moving_point = null;
        this.drawProperties = {};
        this.options = options;
        this.map = new (0, $8zHUo$maplibregl.Map)({
            container: "map",
            style: this.options.style || "/mapfiles/?file=cartodb-xyz.json",
            center: this.options.center || [
                -0.9307443,
                50.7980974
            ],
            zoom: this.options.zoom || 10,
            minZoom: this.options.minZoom || 15,
            maxZoom: this.options.maxZoom || 1
        });
        // Setup default layers geojson
        for(let layer in $882b6d93070905b3$var$defaultLayers)this.geojson[$882b6d93070905b3$var$defaultLayers[layer]] = {
            "type": "FeatureCollection",
            "features": []
        };
        if (this.options.controls === true) this.map.addControl(new (0, $8zHUo$maplibregl.NavigationControl)());
        this.canvas = this.map.getCanvasContainer();
        if (options.debug && options.debug === true) {
            console.log("*********************** MAP DEBUG ***********************");
            console.log("Maplibre Client: ", options);
            this.map.showCollisionBoxes = true;
            this.map.showTileBoundaries = true;
            this.map.on("click", ()=>{
                // Print the current map center and zoom
                console.log("Center:", this.map.getCenter());
                console.log("Zoom:", this.map.getZoom());
            });
        }
        let self = this;
        this.map.on("load", function() {
            self.loaded = true;
            self.loadIcons(self.options.icons);
            self.enableLocation();
            self.processQueue();
            self.reload_data();
        });
        const draw = new (0, ($parcel$interopDefault($8zHUo$mapboxmapboxgldraw)))();
        this.map.addControl(draw);
    }
    loadIcons(icons) {
        let self = this;
        icons.forEach((icon)=>{
            // Make a random uuid to use as the image name
            const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            self.map.loadImage(icon.url + "?cacheblock=" + uuid).then((response)=>{
                // Add the image to the map
                self.map.addImage(icon.name, response.data);
            });
        });
    }
    enableLocation() {}
    reload_data() {
        if (this.options.json_url !== undefined) fetch(this.options.json_url).then((response)=>response.json()).then((data)=>{
            this.addGeojson(data, "data", this.options.fit);
        }).catch((error)=>console.error(error));
    }
    addGeojson(data, layer_name = "data", fit = false, values) {
        this.addQueueOperation({
            type: "add_geojson",
            data: data,
            layer_name: layer_name,
            toggle: fit,
            values: values
        });
    }
    addQueueOperation(operation) {
        this.queue.push(operation);
        this.processQueue();
    }
    /**
     * Add ids to the geojson data
     *
     * We need unique ids for each feature
     * @param data
     */ _addIdsToGeojson(data) {
        for(let i in data.features)if (data.features[i].properties && !data.features[i].properties.id) data.features[i].properties.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        return data;
    }
    /**
     * Process the queue of operations
     *
     */ processQueue() {
        let source;
        let self = this;
        if (this.loaded === true && this.queue.length > 0) {
            let operation = this.queue.shift();
            self._debugLog(`Processing Queue ${operation.type}`);
            switch(operation.type){
                case "line_draw":
                    this._LineDrawMode(operation);
                    break;
                case "set_center":
                    this.map.setCenter(operation.values);
                    break;
                case "delete_feature":
                    source = this.map.getSource(operation.layer_name);
                    if (this.geojson[operation.layer_name]) {
                        let data = this.geojson[operation.layer_name];
                        let features = data.features;
                        for(let i in features)if (features[i].properties && features[i].properties.id && features[i].properties.id === operation.values.id) {
                            features.splice(Number(i), 1);
                            break;
                        }
                        //@ts-ignore
                        source.setData(data);
                    }
                    break;
                case "move_feature":
                    source = this.map.getSource(operation.layer_name);
                    if (this.geojson[operation.layer_name]) {
                        let data = this.geojson[operation.layer_name];
                        let features = data.features;
                        for(let i in features)if (features[i].properties && features[i].properties.id && features[i].properties.id === operation.values.id) {
                            features[i].geometry.coordinates = operation.values.lonLat;
                            break;
                        }
                        //@ts-ignore
                        source.setData(data);
                    }
                    break;
                case "add_geojson":
                    source = this.map.getSource(operation.layer_name);
                    // Add ids to the geojson
                    operation.data = this._addIdsToGeojson(operation.data);
                    if (operation.values && operation.values["merge"] === true && this.geojson[operation.layer_name]) {
                        // Merge the data
                        let new_data = operation.data;
                        let old_data = this.geojson[operation.layer_name];
                        for(let i in new_data.features)old_data.features.push(new_data.features[i]);
                        // copy the old data
                        let copyData = JSON.parse(JSON.stringify(old_data));
                        //@ts-ignore
                        source.setData(old_data);
                        this.geojson[operation.layer_name] = copyData;
                    } else {
                        let copyData = JSON.parse(JSON.stringify(operation.data));
                        //@ts-ignore
                        source.setData(operation.data);
                        this.geojson[operation.layer_name] = copyData;
                    }
                    if (this.geojson[operation.layer_name].features.length > 0) {
                        if (operation.toggle === true) {
                            const bbox = $8zHUo$turfturf.bbox(this.geojson[operation.layer_name]);
                            this.map.fitBounds(bbox, {
                                padding: this.options.padding,
                                maxZoom: this.options.maxZoom
                            });
                        }
                    }
                    break;
                case "clear_layer":
                    //@ts-ignore
                    this.map.clearLayer(operation.layer_name);
                    break;
                case "add_event":
                    const callback = (event)=>{
                        // See if there is a feature(s) here:
                        let features = [];
                        let actual_features = [];
                        if (operation.layer_filter) // Filters do not seem to work correctly for line strings because reasons
                        features = self.map.queryRenderedFeatures(event.point, {
                            layers: operation.layer_filter
                        });
                        // @ts-ignore
                        operation.hook([
                            event.lngLat.lng,
                            event.lngLat.lat
                        ], event, features);
                    };
                    if (operation.toggle === true) self.clearAllEvents();
                    // Make an event object
                    let event = {
                        hook: operation.hook,
                        layer_name: operation.layer_name,
                        clear: operation.toggle,
                        event_type: operation.event_type,
                        layer_filter: operation.layer_filter
                    };
                    event.hook_actual = callback;
                    if (event.layer_name) this.map.on(event.event_type, event.layer_name, callback);
                    else this.map.on(event.event_type, callback);
                    this.events.push(event);
                    break;
                case "resize":
                    this.map.resize();
                    break;
                default:
                    console.log("Unknown Operation", operation);
                    break;
            }
            this.processQueue();
        }
    }
    // private methods
    _fuzzyMatch(point1, point2, precision) {
        precision = precision || 0.0001;
        //console.log(`points: ${point1}:${point2} diff: ${point1-point2} - precision: ${precision}`);
        if (point1 === point2 && point1 === point2) return true;
        if (point1 - precision <= point2 && point1 + precision >= point2 && point1 - precision <= point2 && point1 + precision >= point2) return true;
        return false;
    }
    _findMidpoint(pointA, pointB) {
        return [
            (pointA[0] + pointB[0]) / 2,
            (pointA[1] + pointB[1]) / 2
        ];
    }
    _drawLine() {
        let line = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: this.draw_actual_points
            }
        };
        // Draw the line on the map
        this.geojson["draw-end-points"] = {
            "type": "FeatureCollection",
            "features": []
        };
        this.geojson["draw-mid-points"] = {
            "type": "FeatureCollection",
            "features": []
        };
        // Make the actual points geojson
        for(let i in this.draw_actual_points)this.geojson["draw-end-points"].features.push({
            "type": "Feature",
            "geometry": {
                "coordinates": this.draw_actual_points[i],
                "type": "Point"
            },
            "properties": {
                "actual_index": i
            }
        });
        // Make the mid points geojson
        for(let i = 0; i < this.draw_actual_points.length - 1; i++){
            let mid_point = this._findMidpoint(this.draw_actual_points[i], this.draw_actual_points[i + 1]);
            this.geojson["draw-mid-points"].features.push({
                "type": "Feature",
                "geometry": {
                    "coordinates": [
                        mid_point[0],
                        mid_point[1]
                    ],
                    "type": "Point"
                },
                "properties": {
                    "actual_index": i
                }
            });
        }
        //@ts-ignore
        this.map.getSource("draw-mid-points").setData(this.geojson["draw-mid-points"]);
        //@ts-ignore
        this.map.getSource("draw-end-points").setData(this.geojson["draw-end-points"]);
        //@ts-ignore
        this.map.getSource("draw-vertex").setData(line);
    }
    _debugLog(message) {
        if (this.options.debug === true) console.log(message);
    }
    _LineDrawMode(operation) {
        let self = this;
        this.moving_point = null;
        this.drawProperties = {};
        this.map.getSource("draw-end-points").setData({
            "type": "FeatureCollection",
            "features": []
        });
        this.geojson["draw-end-points"] = {
            "type": "FeatureCollection",
            "features": []
        };
        this.clearAllEvents();
        function onMove(point, e) {
            const coords = e.lngLat;
            self.draw_actual_points[self.moving_point] = [
                coords.lng,
                coords.lat
            ];
            self._drawLine();
            self.canvas.style.cursor = "grabbing";
        }
        function onUp(e) {
            self.canvas.style.cursor = "";
            self.clearEventType("mousemove");
            self.clearEventType("mouseup");
        //self.map.off('mousemove', onMove);
        //self.map.off('touchmove', onMove);
        }
        this.addEvent({
            event_type: "mousedown",
            layer_name: "draw-end-points",
            hook: (point, e)=>{
                e.preventDefault();
                if (e.originalEvent.which === 1) {
                    // left click
                    self.moving_point = e.features[0].properties.actual_index;
                    self.canvas.style.cursor = "grab";
                    self.addEvent({
                        event_type: "mousemove",
                        hook: onMove,
                        clear: false
                    });
                    self.addEvent({
                        event_type: "mouseup",
                        hook: onUp,
                        clear: false
                    });
                //self.map.on('mousemove', onMove);
                //self.map.once('mouseup', onUp);
                }
                if (e.originalEvent.which === 3) {
                    // right click
                    self.draw_actual_points.splice(e.features[0].properties.actual_index, 1);
                    self._drawLine();
                }
            },
            clear: false
        });
        this.addEvent({
            event_type: "mousedown",
            layer_name: "draw-mid-points",
            hook: (point, e)=>{
                e.preventDefault();
                if (e.originalEvent.which === 1) {
                    // add a new point at the midpoint in the array
                    self.draw_actual_points.splice(e.features[0].properties.actual_index + 1, 0, [
                        e.lngLat.lng,
                        e.lngLat.lat
                    ]);
                    self._drawLine();
                    self.moving_point = e.features[0].properties.actual_index + 1;
                    self.canvas.style.cursor = "grab";
                    //self.map.on('mousemove', onMove);
                    self.addEvent({
                        event_type: "mousemove",
                        hook: onMove,
                        clear: false
                    });
                    self.addEvent({
                        event_type: "mouseup",
                        hook: onUp,
                        clear: false
                    });
                //self.map.once('mouseup', onUp);
                }
            },
            clear: false
        });
        // json contains a line string we need to convert to points in draw_actual_points
        if (operation.data && operation.data.features && operation.data.features.length > 0 && operation.data.features[0].geometry && operation.data.features[0].geometry.coordinates && operation.data.features[0].geometry.coordinates.length > 0) {
            this.draw_actual_points = operation.data.features[0].geometry.coordinates;
            // Create a line between all the points
            let line = {
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
            const features = self.map.queryRenderedFeatures(e.point, {
                layers: [
                    "draw-end-points"
                ]
            });
            if (self.draw_point_mode === "add") {
                if (features.length > 0) ;
                else {
                    self.draw_actual_points.push(point);
                    // Create a line between all the points
                    self._drawLine();
                }
            } else // Delete mode
            // Find any points within 10 pixels of the click
            if (features.length > 0) {
                // Delete the point
                // find the point in draw_actual_points using the coordinates
                for(let i in self.draw_actual_points)// fuzzy match of coordinates by 0.0001
                if (self._fuzzyMatch(self.draw_actual_points[i][0], features[0].geometry.coordinates[0]) && self._fuzzyMatch(self.draw_actual_points[i][1], features[0].geometry.coordinates[1])) {
                    self.draw_actual_points.splice(i, 1);
                    break;
                }
                self._drawLine();
            }
        }
        self.clickEvent({
            hook: addPoint,
            clear: false
        });
    }
    // Public Methods
    /**
     * Undo the last point drawn
     * @constructor
     */ LineDrawUndo() {
        if (this.draw_actual_points.length > 0) this.draw_actual_points.pop();
        this._drawLine();
    }
    /**
     * Line Draw Mode enable
     * @param layer_name - the layer name to draw on
     * @param toggle - enable or disable
     * @constructor
     */ LineDrawMode(layer_name, toggle = true, features) {
        this.addQueueOperation({
            type: "line_draw",
            layer_name: layer_name,
            toggle: toggle,
            data: features
        });
    }
    /**
     * Set the visibility of a layer
     * @param layer_name
     * @param visibility
     */ setLayerVisibility(layer_name, visibility) {
        this.addQueueOperation({
            type: "set_visibility",
            layer_name: layer_name,
            values: {
                visibility: visibility
            }
        });
    }
    /**
     * Set the center of the map
     * @param center
     */ setCenter(center) {
        this.addQueueOperation({
            type: "set_center",
            values: center
        });
    }
    /**
     * Delete a feature from a layer using the feature id
     * @param layer_name
     * @param feature_id
     */ deleteFeature(layer_name, feature_id) {
        this.addQueueOperation({
            type: "delete_feature",
            layer_name: layer_name,
            values: {
                id: feature_id
            }
        });
    }
    moveFeaturePoint(layer_name, feature_id, lonLat) {
        this.addQueueOperation({
            type: "move_feature",
            layer_name: layer_name,
            values: {
                id: feature_id,
                lonLat: lonLat
            }
        });
    }
    /**
     * Get a layer as a geojson object
     * @param layer_name
     * @return {GeoJSON}
     */ getGeojsonLayer(layer_name) {
        return this.geojson[layer_name];
    }
    getFeature(layer_name, feature_id) {
        let features = this.geojson[layer_name].features;
        for(let i in features){
            if (features[i].properties && features[i].properties.id && features[i].properties.id === feature_id) return features[i];
        }
        return null;
    }
    /**
     * Merge two geojson objects
     * @param data1
     * @param data2
     * @return {GeoJSON}
     */ mergeGeojson(data1, data2) {
        let features = data1.features.concat(data2.features);
        return {
            type: "FeatureCollection",
            features: features
        };
    }
    /**
     * Get the center of the map
     * @return {number[]}
     */ getCenter() {
        // get center of the map
        const center = this.map.getCenter();
        // return the center as an array
        return [
            center.lng,
            center.lat
        ];
    }
    /**
     * Get the drawn line string TODO this needs to support multiple lines
     */ getDrawnLineString() {
        let data = {
            "type": "FeatureCollection",
            "features": [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: this.draw_actual_points
                    }
                }
            ]
        };
        return data;
    }
    /**
     * Finalise the line draw and add it to the map
     * @param layer
     * @param properties
     */ finaliseLineDraw(layer = "data", properties = {}, mode = "save") {
        this.clearAllEvents();
        // merge the saved properties with properties sent
        properties = Object.assign(this.drawProperties, properties);
        if (mode === "save") {
            let geojson = this.getDrawnLineString();
            geojson.features[0].properties = properties;
            // Check we have more than 2 points
            if (geojson.features[0].geometry.coordinates.length < 2) return;
            geojson = this._addIdsToGeojson(geojson);
            this.addGeojson(geojson, layer, false, {
                merge: true
            });
        }
        this.draw_actual_points = [];
        this.map.getSource("draw-vertex").setData({
            "type": "FeatureCollection",
            "features": []
        });
        this.map.getSource("draw-mid-points").setData({
            "type": "FeatureCollection",
            "features": []
        });
        this.map.getSource("draw-end-points").setData({
            "type": "FeatureCollection",
            "features": []
        });
        this.geojson["draw-end-points"] = {
            "type": "FeatureCollection",
            "features": []
        };
        this.geojson["draw-mid-points"] = {
            "type": "FeatureCollection",
            "features": []
        };
        this.geojson["draw-vertex"] = {
            "type": "FeatureCollection",
            "features": []
        };
    }
    /**
     * Clear all events from the map
     * @return {void}
     */ clearAllEvents() {
        for(let i in this.events)// @ts-ignore IS this working???
        if (this.events[i].layer_name) this.map.off(this.events[i].event_type, this.events[i].layer_name, this.events[i].hook_actual);
        else this.map.off(this.events[i].event_type, this.events[i].hook_actual);
        this.events = [];
    }
    /**
     * Clear all events of a certain type
     * @param eventType
     */ clearEventType(eventType) {
        for(let i in this.events)if (this.events[i].event_type === eventType) {
            if (this.events[i].layer_name) this.map.off(eventType, this.events[i].layer_name, this.events[i].hook_actual);
            else this.map.off(eventType, this.events[i].hook_actual);
            this.events.splice(Number(i), 1);
        }
    }
    /**
     * Add a click event to the map
     * @param eventOption
     */ clickEvent(eventOption) {
        this.addQueueOperation({
            type: "add_event",
            event_type: "click",
            layer_name: eventOption.layer_name,
            hook: eventOption.hook,
            toggle: eventOption.clear,
            layer_filter: eventOption.layer_filter
        });
    }
    dragFeature(layer_name = "data", feature_id) {
        let self = this;
        self.clearAllEvents();
        function onDragMove(point, e) {
            const coords = e.lngLat;
            self.moveFeaturePoint(layer_name, feature_id, [
                coords.lng,
                coords.lat
            ]);
        }
        function onDragEnd(e) {
            self.clearEventType("mousemove");
            self.clearEventType("mouseup");
        }
        this.addEvent({
            event_type: "mousemove",
            hook: onDragMove,
            clear: false
        });
        this.addEvent({
            event_type: "mouseup",
            hook: onDragEnd,
            clear: false
        });
    }
    /**
     * Add all other events to the map
     * @param eventOption
     */ addEvent(eventOption) {
        this.addQueueOperation({
            type: "add_event",
            event_type: eventOption.event_type,
            layer_name: eventOption.layer_name,
            hook: eventOption.hook,
            toggle: eventOption.clear,
            layer_filter: eventOption.layer_filter
        });
    }
    /**
     * resize the map
     * @return {void}
     */ resize() {
        this.addQueueOperation({
            type: "resize"
        });
    }
    /**
     * Set the style of the map
     * @param style
     */ setStyle(style) {
        this.map.setStyle(style);
        // Reload all the geojson data
        for(let layer in this.geojson)//@ts-ignore
        this.map.getSource(layer).setData(this.geojson[layer]);
    }
}


//# sourceMappingURL=index.js.map
