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

let qualityRatio = 2;
const canvasScale = 1.0;

let prevTSeconds = 0;
let lastTenFrames = [];
let ingame;


function render(tSeconds) {
    let gl = globalRenderState.gl;
    tSeconds *= 0.001;  // convert to seconds
    const dTimeSeconds = tSeconds - prevTSeconds;
    prevTSeconds = tSeconds;

    let avg = 0;

    lastTenFrames.push(dTimeSeconds);
    if (lastTenFrames.length == 6) {
        lastTenFrames.shift();
        avg = lastTenFrames.reduce((acc, x) => acc + x / lastTenFrames.length, 0);

        if (avg > 1 / 45) {
            if (avg > 1 / 10) {
                qualityRatio *= 0.5;
            } else if (avg > 1 / 20) {
                qualityRatio *= 0.75;
            } else if (avg > 1 / 30) {
                qualityRatio *= 0.85;
            } else {
                qualityRatio -= 0.01;
            }
            resizeViewport();
            lastTenFrames = [];
        }
    }

    if (DEBUG) {
        globalRenderState.fpsCounterElement.textContent = `Frame time: ${dTimeSeconds * 1000} ms | 10 avg: ${avg * 1000} ms`;
    }

    updateMouseDeltas();

    if (ingame) ingame.update(dTimeSeconds);
    if (ingame) ingame.render();
    if (ingame) requestAnimationFrame(render);

}

function resizeViewport() {
    let fbScale = canvasScale * qualityRatio;
    globalRenderState.gl.canvas.width = 640 * fbScale;
    globalRenderState.gl.canvas.height = 480 * fbScale;
    globalRenderState.gl.canvas.style.width = `${globalRenderState.gl.canvas.width / qualityRatio}px`;

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



function triggerGameOver() {
    ingame = null;
    const div = document.createElement("div");
    div.id = "G";
    div.innerHTML = `<br><br><br><br><h1>GAME OVER!</h1><h2>Play again?</h2><h3>(Begins instantly as the shaders are already built!)</h3><br><button>PLAY</button>`;
    document.querySelector("#G").replaceWith(div);
    document.querySelector("button").addEventListener("click", () => newGame());
}

function endGame() {
    ingame = null;
    const div = document.createElement("div");
    div.id = "G";
    div.innerHTML = `<br><br><br><br><h1>YOU WON!</h1> You reached the parasite room with the mirror item that was hidden in the lava room.<br> The idea was that the parasite would attack you as soon as you entered so you needed the mirror to bounce back it's shots.<br> Thanks for making it this far in ths hackish demo!`;
    document.querySelector("#G").replaceWith(div);
}

function newGame() {
    qualityRatio = 2;
    ingame = new Ingame();

    ingame.init(globalRenderState.roomSet, globalRenderState.sdfQueryManager).then(() => {
        document.querySelector("#G").replaceWith(globalRenderState.gl.canvas);
        setupInputEventListeners();
        globalRenderState.gl.canvas.addEventListener('click', () => requestCanvasPointerLock(), false);
        requestAnimationFrame(render);
    });
}

function init() {
    console.log("js12k2019 - Debug mode [ON]");

    const canvas = document.createElement("canvas");
    canvas.id = "G";
    let gl = canvas.getContext("webgl2", { antialias: false });
    globalRenderState.gl = gl;

    getExtension(gl, "EXT_color_buffer_float");

    resizeViewport();


    if (DEBUG) {
        globalRenderState.fpsCounterElement = document.createElement("div");
        document.body.appendChild(globalRenderState.fpsCounterElement);
    }

    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    createQuad(gl);


    globalRenderState.roomSet = new RoomSet();
    globalRenderState.roomSet.init(gl, genRooms(2)).then(() => {
        globalRenderState.sdfQueryManager = new SDFQueryManager();
        globalRenderState.sdfQueryManager.init(gl, globalRenderState.roomSet).then(newGame);
    });




}

window.onload = init;