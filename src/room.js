/*
    floor height
    ceil height
    ...N 2d points that describe a convex polygon
*/

function buildWall(corner, side, len, floor, roomHeight) {
    /*
        translate wall to corner
        rotate by side angle
        translate to final position
    */
    let m = m4Translation(corner);
    m = m4Multiply(m, m4AxisAngleRotation([0, 1, 0], Math.atan2(-side[2], side[0])));
    m = m4Multiply(m, m4Translation([len * 0.5, 0.0, 0.0]));
    m = m4Multiply(m, m4Translation([0, roomHeight * 0.5 + floor, 0]));

    return `sdfWall(vec3(matInverse(${m4ToStrMat4(m)})*vec4(pos,1.0)), vec2(${numberToStringWithDecimals(len * 0.5)},${numberToStringWithDecimals(roomHeight * 0.5)}))`;
}

function buildRoomSdf(room, rooms) {
    //For each wall, add an sdf wall with the needed transformation
    let walls = [];
    let points = [];
    let metadata = [];
    let roomHeight = room[1] - room[0];

    for (let i = 2; i < room.length; i++) {
        points.push([room[i][0], 0, room[i][1]]);
        metadata.push({ portal: room[i][2] });
    }

    points.push(points[0]);

    for (let i = 0; i < points.length - 1; i++) {

        let side = v3Subtract(points[i], points[i + 1]);
        let len = v3Length(side);

        if (metadata[i].portal == undefined) {
            walls.push(buildWall(points[i + 1], side, len, room[0], roomHeight));
        } else {
            let connectingRoom = rooms[metadata[i].portal];
            //floor wall
            if (connectingRoom[0] > room[0]) {
                walls.push(buildWall(points[i + 1], side, len, room[0], connectingRoom[0] - room[0]));
            }

            //ceil wall
            if (room[1] > connectingRoom[1]) {
                let ch = room[1] - connectingRoom[1];
                walls.push(buildWall(points[i + 1], side, len, room[1] - ch, ch));
            }
        }

    }



    return walls.reduce((acc, cv) => { return `min(${acc},${cv})` });
}

function buildRoomsSdf(gl, rooms) {
    let roomSet = [];

    for (let room of rooms) {
        let roomData = {};
        let fs = buildRoomFS(buildRoomSdf(room, rooms));

        roomData.shader = createProgram(gl, prependPrecisionAndVersion(roomVS), fs);

        roomData.aVertexPosition = gl.getAttribLocation(roomData.shader, 'aVertexPosition');
        roomData.uProjectionMatrix = gl.getUniformLocation(roomData.shader, 'uProjectionMatrix');
        roomData.uModelViewMatrix = gl.getUniformLocation(roomData.shader, 'uModelViewMatrix');
        roomData.uZero = gl.getUniformLocation(roomData.shader, 'uZero');

        roomSet.push(roomData);
    }

    return roomSet;
}

//Using trick from http://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
function buildRoomFS(roomSdf) {
    return prependPrecisionAndVersion(`
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

    #define ZERO min(uZero,0)

    vec3 calcNormal( in vec3 pos )
    {
        vec3 n = vec3(0.0);
        for( int i=ZERO; i<4; i++ )
        {
            vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
            n += e*room(pos+0.0005*e).x;
        }
        return normalize(n);
    }
    
    ${roomRenderFS}
    `);
}