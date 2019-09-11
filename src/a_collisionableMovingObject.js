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