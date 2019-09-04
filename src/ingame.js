
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


class Player {
    constructor() {
        this.pos = [0, 1, 0];
        this.prevPos = [0, 1, 0];
        this.qDir = qIdentity();
        this.dir = [0, 0, -1];
        this.up = [0, 1, 0];
    }

    update(dTimeSeconds) {

        if (mouseDeltaX != 0) {
            let q = qMultiply(this.qDir, qFromAxisAngle([0, 1, 0], dTimeSeconds * -mouseDeltaX));
            qNormalize(q, this.qDir);
        }

        if (mouseDeltaY != 0) {
            let q = qMultiply(this.qDir, qFromAxisAngle([1, 0, 0], dTimeSeconds * mouseDeltaY));
            qNormalize(q, this.qDir);
        }

        this.dir = v3Normalize(qApplyToV3(this.qDir, [0, 0, -1]));
        this.up = v3Normalize(qApplyToV3(this.qDir, [0, 1, 0]));


        const mv = dTimeSeconds * 2;

        let side = v3Cross(this.dir, this.up);
        side = v3Scale(v3Normalize(side), mv);
        let acc = 0;

        if (isKeyDown(KeyCodeUp)) {
            acc += dTimeSeconds;
        }
        if (isKeyDown(KeyCodeDown)) {
            acc -= dTimeSeconds;
        }

        let dirAcc = v3Scale(this.dir, acc * dTimeSeconds);

        let prevPos = this.pos;
        this.pos = v3Add(v3Subtract(v3Scale(this.pos, 2), this.prevPos), dirAcc);
        this.prevPos = prevPos;



        /*
        if (isKeyDown(KeyCodeLeft)) {
            this.pos = v3Subtract(this.pos, side, this.pos);
        }
        if (isKeyDown(KeyCodeRight)) {
            this.pos = v3Add(this.pos, side, this.pos);
        }*/

    }
}

class Ingame {
    constructor() {
        let gl = globalRenderState.gl;
        this.player = new Player();

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

        this.roomSet = new RoomSet(gl, sampleRooms);
        this.timeSeconds = 0.0;

        this.collisionsShader = createProgram(gl, prependPrecisionAndVersion(screenQuadVS), prependPrecisionAndVersion(collisionsFS));
        this.collisionsFBO = createFBOWithTextureAttachment(gl, 1, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.collisionsShaderVariables = {
            aVertexPosition: gl.getAttribLocation(this.collisionsShader, 'aVertexPosition')
        };
        this.collisionsReadDst = new Float32Array(4);
        this.collisionsPBO = createPackPBO(gl, 1 * 1 * 4 * 4); //w*h*elements*datasize

        this.collisionsSync = createFenceSync(gl);

    }

    update(dTimeSeconds) {
        this.timeSeconds += dTimeSeconds;
        let gl = globalRenderState.gl;

        bindPackPBO(gl, this.collisionsPBO);
        waitOnFenceSync(gl, this.collisionsSync);
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, this.collisionsReadDst);
        console.log(this.collisionsReadDst)

        this.currentRoom = this.roomSet.roomFromPoint(this.player.pos);

        this.player.update(dTimeSeconds);

        this.viewMatrix = m4LookAt(v3Subtract(this.player.pos, this.player.dir), this.player.pos, this.player.up);

        let pAngle = 90 * Math.PI / 180;
        this.projectionMatrix = m4Perspective(pAngle, globalRenderState.screen[0] / globalRenderState.screen[1], 0.05, 30);

        this.pmv = m4Multiply(this.projectionMatrix, this.viewMatrix);

    }

    render() {

        let gl = globalRenderState.gl;

        bindFBOAndSetViewport(gl, this.collisionsFBO.fbo, [1, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, globalRenderState.quadBuffer);
        gl.vertexAttribPointer(this.collisionsShaderVariables.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.collisionsShaderVariables.aVertexPosition);
        gl.useProgram(this.collisionsShader);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        bindPackPBO(gl, this.collisionsPBO);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, 0);
        this.collisionsSync = createFenceSync(gl);

        bindFBOAndSetViewport(gl, undefined, globalRenderState.screen);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);

        let preRenderSet = [{ room: this.currentRoom }];
        let renderSet = [];

        let portalsAdjustmentScale = m4Scale([1.05, 1.05, 1.05]);

        while (preRenderSet.length > 0) {
            let currentRoomPair = preRenderSet.pop();
            let currentRoom = currentRoomPair.room;

            const points = currentRoom.points;
            for (let i = 0; i < points.length; i++) {
                if (currentRoom.metadata[i].portal != undefined) {
                    let m = m4Multiply(this.pmv, m4Multiply(currentRoom.metadata[i].portalMatrix, portalsAdjustmentScale));

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

                    preRenderSet.push({ room: this.roomSet.rooms[currentRoom.metadata[i].portal], clip: m });
                }
            }

            renderSet.unshift(currentRoomPair);
        }



        for (let roomPair of renderSet) {

            let room = roomPair.room;
            gl.bindBuffer(gl.ARRAY_BUFFER, globalRenderState.quadBuffer);
            gl.vertexAttribPointer(room.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(room.aVertexPosition);
            gl.useProgram(room.shader);

            gl.uniformMatrix4fv(room.uModelViewMatrix, false, this.viewMatrix);
            gl.uniformMatrix4fv(room.uProjectionMatrix, false, this.projectionMatrix);
            gl.uniformMatrix4fv(room.uClipModelViewMatrix, false, roomPair.clip ? roomPair.clip : m4Identity());
            gl.uniformMatrix4fv(room.uDynamicTransforms, false,
                m4Invert(m4Multiply(m4Translation(this.player.pos), qToM4(this.player.qDir)))
            );

            gl.uniform1f(room.uTimeSeconds, this.timeSeconds);

            gl.uniform2iv(room.uScreenSize, globalRenderState.screen);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

    }


}