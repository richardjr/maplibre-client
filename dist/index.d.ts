import { Map } from 'maplibre-gl';
interface Feature {
    type: string;
    geometry: {
        type: string;
        coordinates: number[];
    };
    properties?: {
        [key: string]: any;
    };
}
type GeoJSON = {
    type: string;
    features: Feature[];
};
interface GeoJSONMap {
    [key: string]: GeoJSON;
}
interface Icon {
    name: string;
    url: string;
}
interface QueueOperation {
    type: "add_layer" | "remove_layer" | "add_geojson" | "clear_layer" | "set_visibility" | "add_event" | "resize" | "line_draw" | "set_center" | "delete_feature" | "move_feature";
    event_type?: string;
    layer_name?: string;
    data?: GeoJSON;
    url?: string;
    values?: any;
    hook?: Function;
    toggle?: boolean;
    layer_filter?: string[];
}
interface ClientOptions {
    minZoom?: number;
    maxZoom?: number;
    zoom?: number;
    padding?: number;
    center?: [number, number];
    style?: string;
    controls?: boolean;
    debug?: boolean;
    icons?: Icon[];
    json_url?: string;
    fit?: boolean;
}
interface eventOptions {
    hook?: Function;
    event_type?: string;
    layer_name?: string;
    clear?: boolean;
    add_point?: boolean;
    hook_actual?: Function;
    layer_filter?: string[];
}
interface historyElement {
    type: "geojson_full" | "delete_feature" | "move_feature" | "add_feature";
    layer_name: string;
    data: GeoJSON;
}
export declare class MaplibreClient {
    map: Map;
    queue: QueueOperation[];
    loaded: boolean;
    debug: boolean;
    canvas: HTMLElement | undefined;
    options: ClientOptions | {};
    geojson: GeoJSONMap;
    events: eventOptions[];
    draw_point_mode: string;
    draw_actual_points: any[];
    draw_history: any[][];
    moving_point: any;
    drawProperties: any;
    history: historyElement[];
    constructor(options: ClientOptions);
    loadIcons(icons: Icon[]): void;
    enableLocation(): void;
    reload_data(): void;
    addGeojson(data: GeoJSON, layer_name?: string, fit?: boolean, values?: {}): void;
    addQueueOperation(operation: QueueOperation): void;
    /**
     * Add ids to the geojson data
     *
     * We need unique ids for each feature
     * @param data
     */
    _addIdsToGeojson(data: GeoJSON): GeoJSON;
    /**
     * Process the queue of operations
     *
     */
    processQueue(): void;
    _fuzzyMatch(point1: number, point2: number, precision?: number): boolean;
    _addHistory(layer_name: string): void;
    _findMidpoint(pointA: number[], pointB: number[]): number[];
    _drawLine(): void;
    _debugLog(message: string): void;
    _LineDrawMode(operation?: QueueOperation): void;
    historyUndo(): void;
    /**
     * Undo the last point drawn
     * @constructor
     */
    LineDrawUndo(): void;
    /**
     * Line Draw Mode enable
     * @param layer_name - the layer name to draw on
     * @param toggle - enable or disable
     * @constructor
     */
    LineDrawMode(layer_name: string, toggle?: boolean, features?: GeoJSON): void;
    /**
     * Set the visibility of a layer
     * @param layer_name
     * @param visibility
     */
    setLayerVisibility(layer_name: string, visibility: string): void;
    /**
     * Set the center of the map
     * @param center
     */
    setCenter(center: [number, number]): void;
    /**
     * Delete a feature from a layer using the feature id
     * @param layer_name
     * @param feature_id
     */
    deleteFeature(layer_name: string, feature_id: string): void;
    moveFeaturePoint(layer_name: string, feature_id: string, lonLat: any[]): void;
    /**
     * Get a layer as a geojson object
     * @param layer_name
     * @return {GeoJSON}
     */
    getGeojsonLayer(layer_name: string): GeoJSON;
    getFeature(layer_name: string, feature_id: string): Feature | null;
    /**
     * Merge two geojson objects
     * @param data1
     * @param data2
     * @return {GeoJSON}
     */
    mergeGeojson(data1: GeoJSON, data2: GeoJSON): GeoJSON;
    /**
     * Get the center of the map
     * @return {number[]}
     */
    getCenter(): number[];
    /**
     * Get the drawn line string TODO this needs to support multiple lines
     */
    getDrawnLineString(): GeoJSON;
    /**
     * Finalise the line draw and add it to the map
     * @param layer
     * @param properties
     */
    finaliseLineDraw(layer?: string, properties?: {}, mode?: string): void;
    /**
     * Clear all events from the map
     * @return {void}
     */
    clearAllEvents(): void;
    /**
     * Clear all events of a certain type
     * @param eventType
     */
    clearEventType(eventType: string): void;
    /**
     * Add a click event to the map
     * @param eventOption
     */
    clickEvent(eventOption: eventOptions): void;
    dragFeature(layer_name: string | undefined, feature_id: string): void;
    /**
     * Add all other events to the map
     * @param eventOption
     */
    addEvent(eventOption: eventOptions): void;
    /**
     * resize the map
     * @return {void}
     */
    resize(): void;
    /**
     * Set the style of the map
     * @param style
     */
    setStyle(style: string): void;
}
export {};
