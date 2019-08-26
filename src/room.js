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

function buildRoomFS(roomSdf) {
    return prependPrecision(`
    ${roomHeaderFS}
    ${roomFunctionsFS}
    mat4 matInverse(mat4 m)
    {
        return mat4(m[0][0], m[1][0], m[2][0], 0.0, m[0][1], m[1][1], m[2][1], 0.0,
            m[0][2], m[1][2], m[2][2], 0.0, -dot(m[0].xyz, m[3].xyz),
            -dot(m[1].xyz, m[3].xyz), -dot(m[2].xyz, m[3].xyz), 1.0);
    }

    vec2 room(vec3 pos)
    {
        float d = ${roomSdf};
        return vec2(d, -1.0);
    }

    ${roomRenderFS}
    `);
}