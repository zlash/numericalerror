
class Player extends CollisionableMovingObject {
    constructor(game) {
        super(game);
        this.setStaticPos(0, 0, 0);
        this.qDir = qIdentity();
        this.dir = [0, 0, -1];
        this.up = [0, 1, 0];
        this.balloons = [];
    }

    onUpdate(dTimeSeconds, curVel, curDirection, collisionPos, collisionNormal) {

        const mouseMod = 0.3;
        if (mouseDeltaX != 0) {
            let q = qMultiply(this.qDir, qFromAxisAngle([0, 1, 0], mouseMod * dTimeSeconds * -mouseDeltaX));
            qNormalize(q, this.qDir);
        }

        if (mouseDeltaY != 0) {
            let q = qMultiply(this.qDir, qFromAxisAngle([1, 0, 0], mouseMod * dTimeSeconds * mouseDeltaY));
            qNormalize(q, this.qDir);
        }

        this.dir = v3Normalize(qApplyToV3(this.qDir, [0, 0, -1]));
        this.up = v3Normalize(qApplyToV3(this.qDir, [0, 1, 0]));

        if (collisionPos) {

            triggerGameOver();
            this.pos = collisionPos;
            this.nextPos = v3Add(this.pos, v3Scale(curVel, -0.8));
        }

        const mv = dTimeSeconds * 20;
        /*let side = v3Cross(this.dir, this.up);
        side = v3Scale(v3Normalize(side), mv);*/
        let acc = 0;

        if (isKeyDown(KeyCodeUp)) {
            acc += mv;
        } else if (isKeyDown(KeyCodeDown)) {
            acc -= mv;
        }

        /*if (isKeyDown(KeyCodeShoot)) {
            this.balloons.push([...this.pos, 1]);
        }*/

        for (let b of this.balloons) {
            this.game.roomSet.dynamicObjects.submitObject(...b);
        }

        return v3Add(v3Scale(this.dir, acc * dTimeSeconds), v3Scale(curVel, -2.0 * dTimeSeconds));
    }
}

class Ingame {
    async init(roomSet, queryManager) {
        let gl = globalRenderState.gl;
        this.player = new Player(this);

        this.roomSet = roomSet;
        this.sdfQueryManager = queryManager;

        this.texturesArray = texturesArray(gl, 1024);

        this.camera = new Camera(this);
        this.timeSeconds = 0.0;

        let initialPos = [...this.roomSet.rooms[0].center];
        initialPos[1] += 1;
        this.player.setStaticPos(...initialPos);
        this.camera.setStaticPos(...this.player.pos);

        this.itemPos = [...this.roomSet.hexRoom.center];
        this.itemPos[1] = this.roomSet.hexRoom.floor + 1;
        this.itemPos[2] += this.roomSet.hexRoom.boundDepth * 0.5 - 0.5;
        this.itemPos[3] = 1;
    }

    update(dTimeSeconds) {
        dTimeSeconds = 1.0 / 60.0;

        let gl = globalRenderState.gl;

        if (isKeyDown(KeyCodeQuality)) {
            qualityRatio = 2;
            resizeViewport();
        }

        this.sdfQueryManager.fetchQueries(gl);

        this.player.update(dTimeSeconds);

        if (this.itemPos) {
            this.roomSet.dynamicObjects.submitObject(...this.itemPos);
            let dist = v3Length(v3Subtract(this.player.pos, this.itemPos));
            if (dist < 1) {
                this.itemPos = null;
                this.mirrorPos = [...this.roomSet.lavaRoom.center];
                this.mirrorPos[1] = this.roomSet.lavaRoom.floor + 1;
                this.mirrorPos[3] = 1;
            }
        }

        if (this.mirrorPos != undefined && this.mirrorPos !== true) {
            this.roomSet.dynamicObjects.submitObject(...this.mirrorPos);
            let dist = v3Length(v3Subtract(this.player.pos, this.mirrorPos));
            if (dist < 1) {
                this.mirrorPos = true;
            }
        }
        //rotavirus
        //this.roomSet.dynamicObjects.submitObject(0, 2, 0, 2);

        let curRoom = this.roomSet.roomFromPoint(this.camera.pos);
        if(curRoom==this.roomSet.bossRoom) {
            endGame();
        }
        
        if (DEBUG) {
            if (curRoom && curRoom != this.currentRoom) {
                console.log("Current room:", curRoom.idx);
            }
        }
        this.currentRoom = curRoom || this.currentRoom;

        this.viewMatrix = this.camera.updateAndGetModelView(dTimeSeconds, this.player.pos, this.player.dir, this.player.qDir);// m4LookAt(v3Subtract(this.player.pos, this.player.dir), this.player.pos, this.player.up);

        let pAngle = 100 * Math.PI / 180;
        this.projectionMatrix = m4Perspective(pAngle, globalRenderState.screen[0] / globalRenderState.screen[1], 0.01, 20);

        this.pmv = m4Multiply(this.projectionMatrix, this.viewMatrix);
        this.timeSeconds += dTimeSeconds;

        this.gameData = [this.itemPos == null ? 0 : 1, 0, 0, 0];
    }

    render() {
        let gl = globalRenderState.gl;

        this.sdfQueryManager.runGpuQuery(gl, this.timeSeconds, this.gameData);

        bindFBOAndSetViewport(gl, undefined, globalRenderState.screen);

        this.roomSet.dynamicObjects.submitUBO(gl);

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
                    let m = m4Multiply(this.pmv, currentRoom.metadata[i].portalMatrix);

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

                    if (Math.abs(sides[0]) == vl) continue;
                    if (Math.abs(sides[1]) == vl) continue;
                    if (Math.abs(sides[2]) == vl) continue;

                    //punga check until I better culling
                    if (renderSet.find((x) => x.room == currentRoom.metadata[i].portal) == undefined) {
                        preRenderSet.push({ room: currentRoom.metadata[i].portal, clip: m });
                    }
                }
            }

            renderSet.unshift(currentRoomPair);
        }

        //Avoid hit on posterior room renders hack
        if (this.notFirstRender == null) {
            renderSet = this.roomSet.rooms.map(x => { return { room: x }; });
            this.notFirstRender = true;
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

            gl.uniform4fv(room.uGameData, this.gameData);

            gl.bindTexture(gl.TEXTURE_2D, this.texturesArray);
            gl.uniform1i(room.uArraySampler, 0);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

    }


}