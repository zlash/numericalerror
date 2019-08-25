// A room is an array of floor and ceil height, followoed by 2d points that describe a convex polygon

function buildRoomSdf(room) {
    //For each wall, add an sdf wall with the needed transformation
    let walls = [];
    let points = [];

    for (let i = 2; i < room.length; i += 2) {
        points.push([room[i], 0.0, room[i + 1]]);
    }

    points.push(points[0]);

    for (let i = 0; i < points.length - 1; i++) {
        let side = v3Subtract(points[i], points[i + 1]);
        let len = v3Length(side);

        /*
            translate wall to corner
            rotate by side angle
            translate back again
        */

        let m = m4Translation(points[i + 1]);
        m = m4Multiply(m, m4AxisAngleRotation([0, 1, 0], Math.atan2(-side[2], side[0])));
        m = m4Multiply(m, m4Translation([len * 0.5, 0.0, 0.0]));

        walls.push(`sdfWall(vec3(matInverse(${m4ToStrMat4(m)})*vec4(pos,1.0)), vec2(${numberToStringWithDecimals(len * 0.5)},1.0))`);
    }



    return walls.reduce((acc, cv) => { return `min(${acc},${cv})` });
}