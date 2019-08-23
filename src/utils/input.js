
let keysState = {};

let KeyCodeUp = "KeyW";
let KeyCodeDown = "KeyS";
let KeyCodeLeft = "KeyA";
let KeyCodeRight = "KeyD";

let _mouseDeltaXBuffer = 0;
let _mouseDeltaYBuffer = 0;
let mouseDeltaX;
let mouseDeltaY;

function keyDownEventHandler(event) {
    keysState[event.code] = true;
}

function keyUpEventHandler(event) {
    keysState[event.code] = false;
}

function mouseMoveEventHandler(event) {
    if (event.movementX) {
        _mouseDeltaXBuffer += event.movementX;
    }
    if (event.movementY) {
        _mouseDeltaYBuffer += event.movementY;
    }
}

function pointerLockChange() {
    if (document.pointerLockElement === gameRenderState.gl.canvas ||
        document.mozPointerLockElement === gameRenderState.gl.canvas) {
        console.log("Pointer Lock On");
        document.addEventListener("mousemove", mouseMoveEventHandler, false);
    } else {
        console.log("Pointer Lock Off");
        document.removeEventListener("mousemove", mouseMoveEventHandler, false);
    }
}

function setupInputEventListeners() {
    document.body.addEventListener('keydown', keyDownEventHandler, false);
    document.body.addEventListener('keyup', keyUpEventHandler, false);
    document.addEventListener('pointerlockchange', pointerLockChange, false);
    document.addEventListener('mozpointerlockchange', pointerLockChange, false);
}

function isKeyDown(key) {
    return !!keysState[key];
}

function updateMouseDeltas() {
    mouseDeltaX = _mouseDeltaXBuffer;
    mouseDeltaY = _mouseDeltaYBuffer;
    _mouseDeltaXBuffer = 0;
    _mouseDeltaYBuffer = 0;
}