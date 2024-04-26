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
     * Function for editing linestrings
     * @param point
     * @param event
     * @param features
     */
    function editLineString(point: [], event: Event, features: any[]) {
        console.log(features);
        if(features.length>0)
            map.LineDrawMode('data', true, {type: "FeatureCollection", features: [features[0]]});
    }

    /**
     * Add buttons for drawing
     */
    const finishDrawButton = document.querySelector('#fdraw') as HTMLButtonElement;
    const drawButton = document.querySelector('#draw') as HTMLButtonElement;
    const drawUndoButton = document.querySelector('#udraw') as HTMLButtonElement;
    const drawCancelButton = document.querySelector('#cdraw') as HTMLButtonElement;
    const drawEditButton = document.querySelector('#edraw') as HTMLButtonElement;


    function resetDrawButtons() {
        finishDrawButton.disabled = true;
        drawUndoButton.disabled = true;
        drawCancelButton.disabled = true;
        drawButton.disabled = false;
        drawEditButton.disabled = false;
        setControlDivs();

    }

    function setDrawButtons(element: HTMLElement) {
        finishDrawButton.disabled = false;
        drawUndoButton.disabled = false;
        drawCancelButton.disabled = false;
        drawButton.disabled = true;
        drawEditButton.disabled = true;
        setControlDivs(true,element as HTMLElement);
    }

    // Add event listeners to finish drawing button
    finishDrawButton.addEventListener('click', () => {
        map.finaliseLineDraw('data',{colour: "green"});
        resetDrawButtons()
    });

    // Add event listeners to draw button
    drawButton.addEventListener('click', (e: MouseEvent) => {
        map.LineDrawMode('data', true);
        setDrawButtons(e.target.parentElement as HTMLElement);

    });

    drawUndoButton.addEventListener('click', () => {
        map.LineDrawUndo();
    })

    drawCancelButton.addEventListener('click', () => {
        resetDrawButtons();
        map.finaliseLineDraw('data',{},'delete');
    })

    drawEditButton.addEventListener('click', (e: MouseEvent) => {
        setDrawButtons(e.target.parentElement as HTMLElement);

        map.addEvent({event_type: 'click', layer_filter:['data-strings'], hook:editLineString, clear:false});
    });



    const dropButton = document.querySelector('#drop') as HTMLButtonElement;
    const cancelEditButton = document.querySelector('#cancel-edit') as HTMLButtonElement;
    const editButton = document.querySelector('#edit') as HTMLButtonElement;

    function dropMarker(point:[]) {
        map.addGeojson({type: "FeatureCollection",features: [{type: "Feature", properties:{icon:"Start"}, geometry: {type: "Point", coordinates: point}}]},'data', false, {merge:true})
        //map.clearAllEvents();
        //setControlDivs();
    }

    dropButton.addEventListener('click', (e: MouseEvent) => {
        editButton.disabled = true;
        cancelEditButton.disabled = false;
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
     * Add buttons for editing
     */

    editButton.addEventListener('click', (e: MouseEvent) => {
        dropButton.disabled = true;
        cancelEditButton.disabled = false;
        map.clearAllEvents();
        map.addEvent({event_type: 'mousedown', hook:editPoint, clear:true, layer_name: 'data', layer_filter:['data']});
        setControlDivs(true,e.target.parentElement as HTMLElement);
        cancelEditButton.disabled = false;
    });

    cancelEditButton.addEventListener('click', (e: MouseEvent) => {
        map.clearAllEvents();
        setControlDivs();
        cancelEditButton.disabled = true;
        dropButton.disabled = false;
        editButton.disabled = false;
    });

    /**
     * Add buttons history
     */
    const undoButton = document.querySelector('#undo') as HTMLButtonElement;
    undoButton.addEventListener('click', () => {
        map.historyUndo();
    });
});