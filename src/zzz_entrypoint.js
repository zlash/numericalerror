//
// Init
// 

const sampleRooms = [[
    0.0, 2.4,

    [3, -3],
    [1.5, -3, 1], // Portal
    [-1.5, -3],
    [-3, -3],
    [-5, 0],
    [-3, 3],
    [3, 3],
    [5, 0]
], [

    1.0, 3.0,
    [1.5, -3],
    [1.5, -7],
    [-1.5, -7],
    [-1.5, -3, 0]
]];


let gameRenderState = {};

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

    gameRenderState.quadBuffer = positionBuffer;

}

let prevTMs = 0;
let pos = [0, 1.8, 0];
let viewV = [0, 0, -1];

function render(tMs) {
    let gl = gameRenderState.gl;
    tMs *= 0.001;  // convert to seconds
    const dTimeMs = tMs - prevTMs;
    prevTMs = tMs;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, gameRenderState.quadBuffer);
    gl.vertexAttribPointer(
        gameRenderState.avertexPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0);

    gl.enableVertexAttribArray(gameRenderState.avertexPosition);

    gl.useProgram(gameRenderState.shader);

    updateMouseDeltas();

    if (mouseDeltaX != 0) {
        let rot = m4AxisAngleRotation([0, 1, 0], dTimeMs * -mouseDeltaX);
        viewV = m4v3Multiply(rot, viewV, 0.0);
        viewV = v3Normalize(viewV);
    }

    //let viewV = [Math.sin(tMs*0.4),Math.cos(tMs*0.4),-1];

    const mv = dTimeMs;
    let movement = v3Scale(viewV, dTimeMs);
    let side = v3Cross(viewV, [0, 1, 0]);
    side = v3Scale(v3Normalize(side), dTimeMs);

    if (isKeyDown(KeyCodeUp)) {
        pos = v3Add(pos, movement, pos);
    }
    if (isKeyDown(KeyCodeDown)) {
        pos = v3Subtract(pos, movement, pos);
    }
    if (isKeyDown(KeyCodeLeft)) {
        pos = v3Subtract(pos, side, pos);
    }
    if (isKeyDown(KeyCodeRight)) {
        pos = v3Add(pos, side, pos);
    }

    let modelView = m4LookAt(pos, v3Add(pos, viewV), [0, 1, 0]);
    //let modelView = m4LookAt([0,7,0], [0,0,0], [0, 0, -1]);

    let projection = m4PerspectiveFov(65 * Math.PI / 180, gameRenderState.gl.canvas.height, gameRenderState.gl.canvas.width, 0.1, 100);

    gl.uniformMatrix4fv(
        gameRenderState.uModelViewMatrix,
        false,
        modelView);

    gl.uniformMatrix4fv(
        gameRenderState.uProjectionMatrix,
        false,
        projection);


    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);

}

function resizeViewport() {
    gameRenderState.gl.viewport(0, 0, gameRenderState.gl.canvas.width, gameRenderState.gl.canvas.height);
}

function requestCanvasPointerLock() {
    let canvas = gameRenderState.gl.canvas;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
}

function init() {

    const qualityRatio = 0.75;
    const canvasScale = 1.0;

    console.log("js12k2019 - Debug mode [ON]");


    const canvas = document.createElement("canvas");
    let gl = canvas.getContext("webgl");
    gameRenderState.gl = gl;

    canvas.width = 800*canvasScale*qualityRatio;
    canvas.height = 600*canvasScale*qualityRatio;
    resizeViewport();


    canvas.style.width = `${canvas.width/qualityRatio}px`;

    document.body.appendChild(canvas);

    gl.clearColor(0.0, 1.0, 0.0, 1.0);

    let shader = createProgram(gl, roomVS, buildRoomFS(buildRoomsSdf(sampleRooms)));

    gameRenderState.avertexPosition = gl.getAttribLocation(shader, 'aVertexPosition');
    gameRenderState.uProjectionMatrix = gl.getUniformLocation(shader, 'uProjectionMatrix');
    gameRenderState.uModelViewMatrix = gl.getUniformLocation(shader, 'uModelViewMatrix');

    gameRenderState.shader = shader;

    createQuad(gl);


    setupInputEventListeners();

    canvas.addEventListener('click', () => requestCanvasPointerLock(), false);

    requestAnimationFrame(render);
}

window.onload = init;