/*
    floor height
    ceil height
    ...N 2d points that describe a convex polygon
*/

function buildWallMatrix(corner, side, len, floor, roomHeight) {
    /*
        translate wall to corner
        rotate by side angle
        translate to final position
    */
    let m = m4Translation(corner);
    m = m4Multiply(m, m4AxisAngleRotation([0, 1, 0], Math.atan2(-side[2], side[0])));
    m = m4Multiply(m, m4Translation([len * 0.5, 0.0, 0.0]));
    m = m4Multiply(m, m4Translation([0, roomHeight * 0.5 + floor, 0]));
    return m;
}

function buildWall(corner, side, len, floor, roomHeight) {
    let m = buildWallMatrix(corner, side, len, floor, roomHeight);
    return `sdfWall(vec3(inverse(${m4ToStrMat4(m)})*vec4(pos,1.0)), ${v2ToStrVec2([len * 0.5, roomHeight * 0.5])} )`;
}

function buildRoomSdf(roomData, rooms) {
    //For each wall, add an sdf wall with the needed transformation
    let walls = [];
    let roomHeight = roomData.ceiling - roomData.floor;
    const points = roomData.points;
    const metadata = roomData.metadata;

    for (let i = 0; i < points.length; i++) {

        let curPoint = points[i];
        let nextPoint = points[(i == points.length - 1) ? 0 : (i + 1)];

        let side = v3Subtract(curPoint, nextPoint);
        let len = v3Length(side);

        if (metadata[i].portal == undefined) {
            walls.push(buildWall(nextPoint, side, len, roomData.floor, roomHeight));
        } else {
            let connectingRoom = rooms[metadata[i].portal];
            //floor wall
            if (connectingRoom[0] > roomData.floor) {
                walls.push(buildWall(nextPoint, side, len, roomData.floor, connectingRoom[0] - roomData.floor));
            }

            //ceil wall
            if (roomData.ceiling > connectingRoom[1]) {
                let ch = roomData.ceiling - connectingRoom[1];
                walls.push(buildWall(nextPoint, side, len, roomData.ceiling - ch, ch));
            }

            //Portal! 
            let portalTop = Math.min(roomData.ceiling, connectingRoom[1]);
            let portalBottom = Math.max(roomData.floor, connectingRoom[0]);
            let portalHeight = portalTop - portalBottom;

            let wallM = buildWallMatrix(nextPoint, side, len, portalBottom, portalHeight);

            metadata[i].portalMatrix = m4Multiply(wallM, m4Scale([len * 0.5, portalHeight * 0.5, 1.0]));


        }

    }

    const floorHeight = 0.01;
    let centerPoint = (p) => [p[0] - roomData.center[0], 0, p[2] - roomData.center[2]];
    let auxCode = `
float sdfRoomShape(vec3 p) {
vec2 p2 = p.xy;
float d2d = dot(p2-${v3xzToStrVec2(centerPoint(points[0]))},p2-${v3xzToStrVec2(centerPoint(points[0]))});
float s = 1.0;
vec2 e,w,b;
bvec3 c;
            ${points.map((x, i) => {

        let j = (i + 1) % points.length;

        return `
e=${v3xzToStrVec2(v3Subtract(centerPoint(points[j]), centerPoint(points[i])))};
w=p2-${v3xzToStrVec2(centerPoint(points[i]))};
b=w-e*clamp(dot(w,e)/dot(e,e),0.0,1.0);
d2d=min(d2d,dot(b,b));
c=bvec3(p2.y>=${numberToStringWithDecimals(centerPoint(points[i])[2])},p2.y<${numberToStringWithDecimals(centerPoint(points[j])[2])},e.x*w.y>e.y*w.x);
if(all(c)||all(not(c)))s*=-1.0; 
`;

    }).join("")}

return sdfOpExtrusion(p,s*sqrt(d2d),${floorHeight});
}

float sdfRoomFloor(vec3 p) {
    return sdfRoomShape(vec3(inverse(${m4ToStrMat4(m4Translation([roomData.center[0], roomData.floor - floorHeight*0.5, roomData.center[2]]))}*${m4ToStrMat4(m4AxisAngleRotation([1, 0, 0], Math.PI * 0.5))})*vec4(p,1.0)));
}

float sdfRoomCeil(vec3 p) {
    return sdfRoomShape(vec3(inverse(${m4ToStrMat4(m4Translation([roomData.center[0], roomData.ceiling + floorHeight*0.5, roomData.center[2]]))}*${m4ToStrMat4(m4AxisAngleRotation([1, 0, 0], Math.PI * 0.5))})*vec4(p,1.0)));
}
`;


    walls.push(`sdfRoomFloor(pos)`);
    walls.push(`sdfRoomCeil(pos)`);

    return { sdf: walls.reduce((acc, cv) => { return `min(${acc},${cv})` }), auxCode: auxCode };
}

class RoomSet {
    constructor(gl, rooms) {
        this.rooms = [];

        for (let room of rooms) {
            let roomData = {};

            roomData.floor = room[0]
            roomData.ceiling = room[1];
            roomData.points = [];
            roomData.metadata = [];

            for (let i = 2; i < room.length; i++) {
                roomData.points.push([room[i][0], 0, room[i][1]]);
                roomData.metadata.push({ portal: room[i][2] });
            }

            roomData.center = roomData.points.reduce((acc, cur) => v3Add(acc, v3Scale(cur, 1 / roomData.points.length)), [0, 0, 0]);

            let fs = buildRoomFS(buildRoomSdf(roomData, rooms));

            roomData.idx = this.rooms.length;
            roomData.shader = createProgram(gl, prependPrecisionAndVersion(roomVS), fs);

            roomData.aVertexPosition = gl.getAttribLocation(roomData.shader, 'aVertexPosition');
            roomData.uProjectionMatrix = gl.getUniformLocation(roomData.shader, 'uProjectionMatrix');
            roomData.uModelViewMatrix = gl.getUniformLocation(roomData.shader, 'uModelViewMatrix');
            roomData.uClipModelViewMatrix = gl.getUniformLocation(roomData.shader, 'uClipModelViewMatrix');

            roomData.uZero = gl.getUniformLocation(roomData.shader, 'uZero');

            this.rooms.push(roomData);
        }
    }


    roomFromPoint(point) {
        let floorPoint = [point[0], 0, point[2]];
        for (let room of this.rooms) {
            const points = room.points;
            let angle = 0;
            for (let i = 0; i < points.length; i++) {
                let curPoint = points[i];
                let nextPoint = points[(i == points.length - 1) ? 0 : (i + 1)];

                let v1 = v3Normalize(v3Subtract(curPoint, floorPoint));
                let v2 = v3Normalize(v3Subtract(nextPoint, floorPoint));
                angle += Math.acos(v3Dot(v1, v2));
            }

            if (Math.abs(angle - Math.PI * 2.0) < 0.0001) {
                return room;
            }
        }
        return undefined;
    }

}




//Using trick from http://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
function buildRoomFS(roomSdf) {
    return prependPrecisionAndVersion(`
    ${roomHeaderFS}
    ${roomFunctionsFS}
    ${roomSdf.auxCode}

    vec2 room(vec3 pos)
    {
        float d = ${roomSdf.sdf};
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