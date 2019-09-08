
let sampleRooms = [[
    0.0, 5,

    [3, -3],
    [1.5, -3],
    [-1.5, -3],
    [-3, -3],
    [-5, 0],
    [-3, 3],
    [3, 3],
    [5, 0]
]];



class CollisionableMovingObject {
    constructor(game) {
        this.game = game;
        this.pos = [0, 0, 0];
        this.nextPos = [0, 0, 0];
        this.radius = 0.0; // Bigger than 0, ball mode
    }

    onUpdate(dTimeSeconds, curVel, curDirection, collisionPos, collisionNormal) {
        return [0, 0, 0];
    }

    setStaticPos(x, y, z) {
        this.pos[0] = this.nextPos[0] = x;
        this.pos[1] = this.nextPos[1] = y;
        this.pos[2] = this.nextPos[2] = z;
    }

    update(dTimeSeconds, forceNextPos) {
        let curVel = v3Subtract(this.nextPos, this.pos);
        let curDirection = v3Normalize(curVel);

        if (this.query != undefined) {

            let result = this.game.sdfQueryManager.fetchQuery(this.query);

            let collisionNormal = v3Normalize(result);
            let collisionPos;

            if (curDirection != undefined && collisionNormal != undefined) {
                collisionPos = v3Add(this.pos, v3Scale(curDirection, result[3]));
            }

            let dirAcc = this.onUpdate(dTimeSeconds, curVel, curDirection, collisionPos, collisionNormal);

            let nextPos = this.nextPos;
            this.nextPos = forceNextPos ? forceNextPos : v3Add(v3Subtract(v3Scale(this.nextPos, 2), this.pos), dirAcc);
            this.pos = nextPos;
        }

        this.query = this.game.sdfQueryManager.submitQuery(...this.pos, ...v3Add(this.nextPos, curDirection ? v3Scale(curDirection, this.radius) : [0, 0, 0]));
    }

}


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

        if (collisionPos) {
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

        if (isKeyDown(KeyCodeShoot)) {
            this.balloons.push([...this.pos, 1]);
        }

        for (let b of this.balloons) {
            this.game.roomSet.dynamicObjects.submitObject(...b);
        }

        return v3Add(v3Scale(this.dir, acc * dTimeSeconds), v3Scale(curVel, -2.0 * dTimeSeconds));
    }
}

class Ingame {
    constructor() {
        let gl = globalRenderState.gl;
        this.player = new Player(this);

        this.roomSet = new RoomSet(gl, genRooms(4));
        this.sdfQueryManager = new SDFQueryManager(gl, this.roomSet);
        this.camera = new Camera(this);
        this.timeSeconds = 0.0;

        let initialPos = [...this.roomSet.rooms[0].center];
        initialPos[1] += 1;
        this.player.setStaticPos(...initialPos);
        this.camera.setStaticPos(...this.player.pos);

    }

    update(dTimeSeconds) {
        dTimeSeconds = 1.0 / 60.0;

        let gl = globalRenderState.gl;

        this.sdfQueryManager.fetchQueries(gl);

        this.player.update(dTimeSeconds);

        //rotavirus
        //this.roomSet.dynamicObjects.submitObject(0, 2, 0, 2);

        let curRoom = this.roomSet.roomFromPoint(this.camera.pos);
        this.currentRoom = curRoom || this.currentRoom;

        this.viewMatrix = this.camera.updateAndGetModelView(dTimeSeconds, this.player.pos, this.player.dir, this.player.qDir);// m4LookAt(v3Subtract(this.player.pos, this.player.dir), this.player.pos, this.player.up);

        let pAngle = 100 * Math.PI / 180;
        this.projectionMatrix = m4Perspective(pAngle, globalRenderState.screen[0] / globalRenderState.screen[1], 0.01, 20);

        this.pmv = m4Multiply(this.projectionMatrix, this.viewMatrix);
        this.timeSeconds += dTimeSeconds;
    }

    render() {
        let gl = globalRenderState.gl;

        this.sdfQueryManager.runGpuQuery(gl);

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

                    /*   let vertices = [[-1, 1], [-1, -1], [1, -1], [1, 1]].map(x => {
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
   */
                    //punga check until I better culling
                    if (renderSet.find((x) => x.room == currentRoom.metadata[i].portal) == undefined) {
                        preRenderSet.push({ room: currentRoom.metadata[i].portal, clip: m4Identity() });
                    }
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