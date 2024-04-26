import {MaplibreClient} from '../src/index';

document.addEventListener('DOMContentLoaded', () => {

    /**
     * Create a new MaplibreClient object
     */
    const map = new MaplibreClient({
        style:'style.json',
        maxZoom: 25,
        minZoom: 1,
        icons: [
            {
                'name': 'Start',
                'url': "icons/start.png",
            }
        ],
        debug: false
    });

    function setControlDivs(mode: boolean = false,keepElement?: HTMLElement) {
        const controlDivs = document.querySelectorAll('.control') as NodeListOf<HTMLDivElement>;
        controlDivs.forEach((div) => {
            if(mode)
                div.classList.add('disabled');
            else
                div.classList.remove('disabled');
        });
        if(mode)
            keepElement.classList.remove('disabled');
    }

    /**
     * Add buttons for drawing
     */
    const finishDrawButton = document.querySelector('#fdraw') as HTMLButtonElement;
    const drawButton = document.querySelector('#draw') as HTMLButtonElement;


    // Add event listeners to finish drawing button
    finishDrawButton.addEventListener('click', () => {
        map.finaliseLineDraw('data',{colour: "green"});
        finishDrawButton.disabled = true;
        drawButton.disabled = false;
        setControlDivs();
    });

    // Add event listeners to draw button
    drawButton.addEventListener('click', (e: MouseEvent) => {
        map.LineDrawMode('data', true);
        finishDrawButton.disabled = false;
        drawButton.disabled = true;
        setControlDivs(true,e.target.parentElement as HTMLElement);
    });



    function dropMarker(point:[]) {
        map.addGeojson({type: "FeatureCollection",features: [{type: "Feature", properties:{icon:"Start"}, geometry: {type: "Point", coordinates: point}}]},'data', false, {merge:true})
        map.clearAllEvents();
        setControlDivs();
    }

    const dropButton = document.querySelector('#drop') as HTMLButtonElement;
    dropButton.addEventListener('click', (e: MouseEvent) => {
        map.clickEvent({ hook:dropMarker});
        setControlDivs(true,e.target.parentElement as HTMLElement);
    });

    /**
     * Function for editing points
     * @param point
     * @param event
     * @param features
     */
    function editPoint(point: [], event: Event, features: any[]) {
        event.preventDefault();
        map.dragFeature('data', features[0].properties.id);

    }

    /**
     * Function for editing linestrings
     * @param point
     * @param event
     * @param features
     */
    function editLineString(point: [], event: Event, features: any[]) {
        console.log(features);
        if(features.length>0)
            map.LineDrawMode('data', true, {type: "FeatureCollection", features: [features[0]]});
        else
            setControlDivs();
    }

    /**
     * Add buttons for editing
     */
    const cancelEditButton = document.querySelector('#cancel-edit') as HTMLButtonElement;
    const editButton = document.querySelector('#edit') as HTMLButtonElement;
    editButton.addEventListener('click', (e: MouseEvent) => {
        map.clearAllEvents();
        map.addEvent({event_type: 'mousedown', hook:editPoint, clear:true, layer_name: 'data', layer_filter:['data']});
        map.addEvent({event_type: 'click', layer_filter:['data-strings'], hook:editLineString, clear:false});
        setControlDivs(true,e.target.parentElement as HTMLElement);
        cancelEditButton.disabled = false;
    });

    cancelEditButton.addEventListener('click', (e: MouseEvent) => {
        map.clearAllEvents();
        setControlDivs();
        cancelEditButton.disabled = true;

    });

    /**
     * Add buttons history
     */
    const undoButton = document.querySelector('#undo') as HTMLButtonElement;
    undoButton.addEventListener('click', () => {
        map.historyUndo();
    });
});