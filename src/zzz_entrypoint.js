//
// Init
// 

let sampleRooms = [[
    0.0, 5,

    [3, -3],
    [1.5, -3, 1], // Portal
    [-1.5, -3],
    [-3, -3],
    [-5, 0],
    [-3, 3],
    [3, 3],
    [5, 0]
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

    updateMouseDeltas();

    if (mouseDeltaX != 0) {
        let rot = m4AxisAngleRotation([0, 1, 0], dTimeMs * -mouseDeltaX);
        viewV = m4v3Multiply(rot, viewV, 0.0);
        viewV = v3Normalize(viewV);
    }

    const mv = dTimeMs*2;
    let movement = v3Scale(viewV, mv);
    let side = v3Cross(viewV, [0, 1, 0]);
    side = v3Scale(v3Normalize(side), mv);


    let prePos = [...pos];

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

    let currentRoom = gameRenderState.roomSet.roomFromPoint(pos);
    if (currentRoom == undefined) {
        pos = prePos;
        currentRoom = gameRenderState.roomSet.roomFromPoint(pos);
    }

    pos[1] = currentRoom.floor + 1.8;

    let modelView = m4LookAt(pos, v3Add(pos, viewV), [0, 1, 0]);
    //let modelView = m4LookAt([0,7,0], [0,0,0], [0, 0, -1]);

    let pAngle = 90 * Math.PI / 180;

    let projection = m4Perspective(pAngle, gameRenderState.gl.canvas.width / gameRenderState.gl.canvas.height, 0.05, 30);

    let pmv = m4Multiply(projection, modelView);

    let preRenderSet = [{ room: currentRoom }];
    let renderSet = [];

    while (preRenderSet.length > 0) {
        let currentRoomPair = preRenderSet.pop();
        let currentRoom = currentRoomPair.room;

        const points = currentRoom.points;
        for (let i = 0; i < points.length; i++) {
            if (currentRoom.metadata[i].portal != undefined) {
                let m = m4Multiply(pmv, currentRoom.metadata[i].portalMatrix);

                let vertices = [[-1, 1], [-1, -1], [1, -1], [1, 1]].map(x => {
                    return m4v4Multiply(m, [...x, 0, 1]);
                });

                // Using determinant to check for polygon winding
                let d = (vertices[0][0] * vertices[1][1] * vertices[2][3])
                    + (vertices[1][0] * vertices[2][1] * vertices[0][3])
                    + (vertices[2][0] * vertices[0][1] * vertices[1][3])
                    - (vertices[2][0] * vertices[1][1] * vertices[0][3])
                    - (vertices[1][0] * vertices[0][1] * vertices[2][3])
                    - (vertices[0][0] * vertices[2][1] * vertices[1][3]);

                if (d <= 0) {
                    continue;
                }

                //Clip with view volume
                let sides = [0, 0, 0];
                for (let v of vertices) {
                    for (let i = 0; i < 3; i++) {
                        if (v[i] < -v[3]) {
                            sides[i]--;
                        } else if (v[i] > v[3]) {
                            sides[i]++;
                        }
                    }
                }

                let vl = vertices.length;

                if (Math.abs(sides[0]) == vl) break;
                if (Math.abs(sides[1]) == vl) break;
                if (Math.abs(sides[2]) == vl) break;

                preRenderSet.push({ room: gameRenderState.roomSet.rooms[currentRoom.metadata[i].portal], clip: m });
            }
        }

        renderSet.unshift(currentRoomPair);
    }

    gl.disable(gl.DEPTH_TEST);

    for (let roomPair of renderSet) {

        let room = roomPair.room;
        gl.bindBuffer(gl.ARRAY_BUFFER, gameRenderState.quadBuffer);
        gl.vertexAttribPointer(room.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(room.aVertexPosition);
        gl.useProgram(room.shader);

  
        gl.uniformMatrix4fv(
            room.uModelViewMatrix,
            false,
            modelView);

        gl.uniformMatrix4fv(
            room.uProjectionMatrix,
            false,
            projection);

        gl.uniformMatrix4fv(
            room.uClipModelViewMatrix,
            false,
            roomPair.clip ? roomPair.clip : m4Identity());


        gl.uniform1i(room.uZero, tMs);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

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

    const qualityRatio = 1.0;
    const canvasScale = 1.0;

    //DELETEME
    //stairs
    const stairsRooms = 10;
    for (let i = 0; i < stairsRooms; i++) {
        let len = 0.5;
        let lenCur = (i >= stairsRooms - 1) ? 1 : 0.5;
        let next = (i >= stairsRooms - 1) ? undefined : (sampleRooms.length + 1);
        sampleRooms.push([
            0.30 * (i + 1), 8,
            [1.5, -3 - i * len],
            [1.5, -3 - (i + 1) * lenCur, next],
            [-1.5, -3 - (i + 1) * lenCur],
            [-1.5, -3 - i * len, sampleRooms.length - 1]
        ]);
    }

    console.log("js12k2019 - Debug mode [ON]");

    const canvas = document.createElement("canvas");
    let gl = canvas.getContext("webgl2");
    gameRenderState.gl = gl;

    canvas.width = 800 * canvasScale * qualityRatio;
    canvas.height = 600 * canvasScale * qualityRatio;
    resizeViewport();


    canvas.style.width = `${canvas.width / qualityRatio}px`;

    document.body.appendChild(canvas);

    gl.clearColor(0.0, 1.0, 0.0, 1.0);

    gameRenderState.roomSet = new RoomSet(gl, sampleRooms);

    createQuad(gl);

    setupInputEventListeners();

    canvas.addEventListener('click', () => requestCanvasPointerLock(), false);

    requestAnimationFrame(render);
}

window.onload = init;