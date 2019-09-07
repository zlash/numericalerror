class Camera extends CollisionableMovingObject {
    constructor(game) {
        super(game);
        this.setStaticPos(0, 3.5, 0);
        this.qDir = qIdentity();
        this.dir = [0, 0, -1];
        this.up = [0, 1, 0];

    }

    updateAndGetModelView(dTimeSeconds, playerPos, playerDir, playerQDir) {
        const cameraSpeed = 0.25;
        const cameraDistance = 1.5;


        this.qDir = playerQDir;
        this.dir = v3Normalize(qApplyToV3(this.qDir, [0, -1.5, -1]));
        this.up = v3Normalize(qApplyToV3(this.qDir, [0, 1, 0]));


        let cameraPos = v3Subtract(playerPos, v3Scale(this.dir, cameraDistance));
        let nextPos = v3Mix(this.pos, cameraPos, 60 * cameraSpeed * dTimeSeconds);

        this.update(dTimeSeconds, nextPos);

        return m4LookAt(this.pos, v3Add(playerPos, v3Scale(playerDir, 5)), this.up);
    }

}