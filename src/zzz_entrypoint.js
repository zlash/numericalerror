//
// Init
// 

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

    let eye = [0,0,3];
    let viewV = [Math.sin(tMs*0.4),Math.cos(tMs*0.4),-1];

    let modelView = m4LookAt(eye, v3Add(eye, viewV), [0,1,0]);

    gl.uniformMatrix4fv(
        gameRenderState.uModelViewMatrix,
        false,
        modelView);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

function resizeViewport() {
    gameRenderState.gl.viewport(0, 0, gameRenderState.gl.canvas.width, gameRenderState.gl.canvas.height);
}

function init() {

    console.log("js12k2019 - Debug mode [ON]");

    const canvas = document.createElement("canvas");
    let gl = canvas.getContext("webgl");
    gameRenderState.gl = gl;

    canvas.width = 800;
    canvas.height = 600;
    resizeViewport();

    document.body.appendChild(canvas);

    gl.clearColor(0.0, 1.0, 0.0, 1.0);

    var shader = createProgram(gl, VSRoom, FSRoom);

    gameRenderState.avertexPosition = gl.getAttribLocation(shader, 'aVertexPosition');
    gameRenderState.uProjectionMatrix = gl.getUniformLocation(shader, 'uProjectionMatrix');
    gameRenderState.uModelViewMatrix = gl.getUniformLocation(shader, 'uModelViewMatrix');

    gameRenderState.shader = shader;

    createQuad(gl);
    requestAnimationFrame(render);
}

window.onload = init;