let globalRenderState = {};

function createQuad(gl) {

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        -1.0, 1.0,
        -1.0, -1.0,
        1.0, 1.0,
        1.0, -1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    globalRenderState.quadBuffer = positionBuffer;

}

let prevTSeconds = 0;
let ingame;

function render(tSeconds) {
    let gl = globalRenderState.gl;
    tSeconds *= 0.001;  // convert to seconds
    const dTimeSeconds = tSeconds - prevTSeconds;
    prevTSeconds = tSeconds;

    if (DEBUG) {
        globalRenderState.fpsCounterElement.textContent = `Frame time: ${dTimeSeconds * 1000} ms`;
    }

    updateMouseDeltas();

    ingame.update(dTimeSeconds);
    ingame.render();

    requestAnimationFrame(render);
}

function resizeViewport() {
    globalRenderState.screen = [globalRenderState.gl.canvas.width, globalRenderState.gl.canvas.height];
}

function requestCanvasPointerLock() {
    let canvas = globalRenderState.gl.canvas;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
}

function getExtension(gl, extension) {
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
        throw new Error(`Needs ${extension}`);
    }
}

function init() {
    const qualityRatio = 0.5;
    const canvasScale = 1.0;

    console.log("js12k2019 - Debug mode [ON]");

    const canvas = document.createElement("canvas");
    let gl = canvas.getContext("webgl2", { antialias: false });
    globalRenderState.gl = gl;

    getExtension(gl, "EXT_color_buffer_float");

    let fbScale = canvasScale * qualityRatio;
    canvas.width = 800 * fbScale;
    canvas.height = 600 * fbScale;
    resizeViewport();

    canvas.style.width = `${canvas.width / qualityRatio}px`;

    document.body.appendChild(canvas);

    if (DEBUG) {
        globalRenderState.fpsCounterElement = document.createElement("div");
        document.body.appendChild(globalRenderState.fpsCounterElement);
    }

    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    createQuad(gl);

    ingame = new Ingame();

    setupInputEventListeners();
    canvas.addEventListener('click', () => requestCanvasPointerLock(), false);
    requestAnimationFrame(render);
}

window.onload = init;