class Camera extends CollisionableMovingObject {
    constructor(game) {
        super(game);
        this.setStaticPos(0, 3.5, 0);
        this.qDir = qIdentity();
        this.dir = [0, 0, -1];
        this.up = [0, 1, 0];
    }

    updateAndGetModelView(dTimeSeconds, playerPos, playerQDir) {

        this.update(dTimeSeconds);

        this.qDir = playerQDir;
        this.dir = v3Normalize(qApplyToV3(this.qDir, [0, 0, -1]));
        this.up = v3Normalize(qApplyToV3(this.qDir, [0, 1, 0]));


        let cameraPos = v3Subtract(playerPos, this.dir);
        const cameraSpeed = 0.2;

        this.setStaticPos(...v3Mix(this.nextPos, cameraPos, 60*cameraSpeed*dTimeSeconds));



        return m4LookAt(this.nextPos, playerPos, this.up);
    }

    onUpdate(dTimeSeconds, curVel, curDirection, collisionPos, collisionNormal) {
        return [0, 0, 0];
    }

}