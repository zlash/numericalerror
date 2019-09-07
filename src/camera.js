class Camera extends CollisionableMovingObject {
    constructor(game) {
        super(game);
        this.setStaticPos(0, 3.5, 0);
        this.qDir = qIdentity();
        this.dir = [0, 0, -1];
        this.up = [0, 1, 0];

    }

    updateAndGetModelView(dTimeSeconds, playerPos, playerDir, playerQDir) {
        const cameraSpeed = 0.5;
        const cameraDistance = 0.1;


        this.qDir = playerQDir;
        this.dir = v3Normalize(qApplyToV3(this.qDir, [0, 0, -1]));
        this.up = v3Normalize(qApplyToV3(this.qDir, [0, 1, 0]));


        let cameraPos = v3Subtract(playerPos, v3Scale(this.dir, 0.5));
        cameraPos = v3Add(cameraPos, v3Scale(this.up, 0.4));
        let nextPos = v3Mix(this.pos, cameraPos, cameraSpeed*60*dTimeSeconds);

        this.setStaticPos(...nextPos);
        this.update(dTimeSeconds, nextPos);

        return m4LookAt(this.pos, v3Add(playerPos, v3Scale(this.dir, 5)), this.up);
    }

}