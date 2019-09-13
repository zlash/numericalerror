
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
    return `sdfWall((${m4ToStrMat4(m4Invert(m))}*pos4).xyz, ${v2ToStrVec2([len * 0.5, roomHeight * 0.5])} )`;
}

function buildRoomSdfBlocks(roomData, idx) {

    //I must return room segregated by materials 

    //Collect sdfs in materials
    let sdfs = {};
    let addSdf = (sdf, material) => { sdfs[material] = sdfs[material] || []; sdfs[material].push(sdf); };

    let roomHeight = roomData.ceiling - roomData.floor;
    const points = roomData.points;
    const metadata = roomData.metadata;

    for (let i = 0; i < points.length; i++) {

        let curPoint = points[i];
        let nextPoint = points[(i == points.length - 1) ? 0 : (i + 1)];

        let side = v3Subtract(curPoint, nextPoint);
        let len = v3Length(side);

        if (metadata[i].portal == undefined) {
            addSdf(buildWall(nextPoint, side, len, roomData.floor, roomHeight), 0);
        } else {
            let connectingRoom = metadata[i].portal;
            //floor wall
            if (connectingRoom.floor > roomData.floor) {
                addSdf(buildWall(nextPoint, side, len, roomData.floor, connectingRoom.floor - roomData.floor), 0);
            }

            //ceil wall
            if (roomData.ceiling > connectingRoom.ceiling) {
                let ch = roomData.ceiling - connectingRoom.ceiling;
                addSdf(buildWall(nextPoint, side, len, roomData.ceiling - ch, ch), 0);
            }

            //Portal! 
            let portalTop = Math.min(roomData.ceiling, connectingRoom.ceiling);
            let portalBottom = Math.max(roomData.floor, connectingRoom.floor);
            let portalHeight = portalTop - portalBottom;

            let wallM = buildWallMatrix(nextPoint, side, len, portalBottom, portalHeight);

            metadata[i].portalMatrix = m4Multiply(wallM, m4Scale([len, portalHeight, 1.0]));
        }

    }

    if (roomData.roomType == RoomTypes.gearsRoom) {
        addSdf(`sdfGearsSet((${m4ToStrMat4(m4Invert(m4Translation(roomData.center)))}*pos4).xyz)`, 1);
    }

    if (roomData.roomType == RoomTypes.bossRoom) {
        addSdf(`sdfBarsDoor((${m4ToStrMat4(m4Invert(m4Translation([roomData.center[0], doorHeight * 0.5, roomData.center[2] - roomData.boundDepth * 0.5 + 0.1])))}*pos4).xyz,${v3ToStrVec3([doorWidth * 1.5, doorHeight * 1.5, 0.1])})`, 1);
    }

    if (roomData.roomType == RoomTypes.hexRoom) {
        addSdf(`sdfHex((${m4ToStrMat4(m4Invert(m4Multiply(m4Translation(v3Subtract(roomData.center, [0, -0.5 * roomData.boundHeight + 0.1, 0])), m4AxisAngleRotation([1, 0, 0], -0.5 * Math.PI))))}*pos4).xyz,${v2ToStrVec2([roomData.boundHeight, roomData.boundWidth])})`, 0);
    }


    addSdf(`sdfRoomFloor${idx}(pos)`, 1);
    addSdf(`sdfRoomCeil${idx}(pos)`, 0);
    addSdf(`dynamicStuff(pos)`, 2);

    const floorHeight = 0.2;
    let centerPoint = (p) => [p[0] - roomData.center[0], 0, p[2] - roomData.center[2]];
    let auxCode = `
float sdfRoomShape${idx}(vec3 p) {
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

return sdfOpExtrusion(p,s*sqrt(d2d),${numberToStringWithDecimals(floorHeight)});
}

float sdfRoomFloor${idx}(vec3 p) {
    vec4 pos4=vec4(p,1.0);
    return sdfRoomShape${idx}((inverse(${m4ToStrMat4(m4Translation([roomData.center[0], roomData.floor - floorHeight, roomData.center[2]]))}*${m4ToStrMat4(m4AxisAngleRotation([1, 0, 0], Math.PI * 0.5))})*pos4).xyz);
}

float sdfRoomCeil${idx}(vec3 p) {
    vec4 pos4=vec4(p,1.0);
    return sdfRoomShape${idx}((inverse(${m4ToStrMat4(m4Translation([roomData.center[0], roomData.ceiling + floorHeight, roomData.center[2]]))}*${m4ToStrMat4(m4AxisAngleRotation([1, 0, 0], Math.PI * 0.5))})*pos4).xyz);
}
`;

    return { sdf: objectMap(sdfs, x => makeChainOfMinsArray(x)), auxCode: auxCode };
}



function buildRoomSdf(blocks) {
    let sdfCode = objectReduce(blocks.sdf, (acc, curValue, curKey) => acc + `{float sdfD=${curValue};if(sdfD<d){d=sdfD;mat=${numberToStringWithDecimals(curKey)};}}`, "");

    return { sdf: sdfCode, auxCode: blocks.auxCode };
}
//Using trick from http://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
function normalCodeFor(sdfFunc, accessSufix) {
    return `
#define ZERO min(uScreenSize.x,0)
vec3 calcNormal(vec3 p){vec3 n=vec3(.0);for(int i=ZERO;i<4;i++){vec3 e=0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);n+=e*${sdfFunc}(p+0.0005*e)${accessSufix || ""};}return normalize(n);}`;
}

class RoomSet {

    async init(gl, rooms) {
        this.dynamicObjects = new DynamicRoomObjects(gl);
        this.rooms = [];

        for (let roomData of rooms) {
            this.rooms.push((async () => {
                roomData.metadata = roomData.points.map((x) => { return { portal: x[2] }; });
                roomData.points = roomData.points.map((x) => [x[0], 0, x[1]]);

                let blocks = buildRoomSdfBlocks(roomData, roomData.idx);
                console.log(`Built SDF for room: ${roomData.idx}`);
                roomData.blocks = blocks;
                let roomSdf = buildRoomSdf(blocks);
                let fs = buildRoomFS(roomSdf);

                if (roomData.roomType == RoomTypes.hexRoom) {
                    this.hexRoom = roomData;
                }

                roomData.shader = await createProgramAsync(gl, prependPrecisionAndVersion(roomVS), fs);
                console.log(`Created shader for room: ${roomData.idx}`);
                roomData.aVertexPosition = gl.getAttribLocation(roomData.shader, 'aVertexPosition');
                roomData.uProjectionMatrix = getUniformLocation(gl, roomData.shader, 'uProjectionMatrix');
                roomData.uModelViewMatrix = getUniformLocation(gl, roomData.shader, 'uModelViewMatrix');
                roomData.uClipModelViewMatrix = getUniformLocation(gl, roomData.shader, 'uClipModelViewMatrix');
                roomData.uDynamicTransforms = getUniformLocation(gl, roomData.shader, 'uDynamicTransforms');
                roomData.uScreenSize = getUniformLocation(gl, roomData.shader, 'uScreenSize');
                roomData.uTimeSeconds = getUniformLocation(gl, roomData.shader, 'uTimeSeconds');
                roomData.uArraySampler = getUniformLocation(gl, roomData.shader, 'uArraySampler');


                let uboDO = this.dynamicObjects.ubo;
                let uboDOIndex = gl.getUniformBlockIndex(roomData.shader, 'DO');
                bindUniformBufferWithIndex(gl, uboDO, 0);
                gl.uniformBlockBinding(roomData.shader, uboDOIndex, 0);

                return roomData;
            })());
        }

        this.rooms = await Promise.all(this.rooms);
    }

    generateCollisionsShader() {
        let shader = `layout(location = 0) out vec4 fragColor;uniform float uTimeSeconds;uniform ivec2 uScreenSize;const float bigFloat=3.402823466e+38;${roomFunctionsFS}${this.rooms.map(x => x.blocks.auxCode).join("")}float dynamicStuff(vec3 p){return bigFloat;}float worldSdf(vec3 pos){vec4 pos4=vec4(pos,1.0);return ${makeChainOfMinsArray(this.rooms.map(x => makeChainOfMinsArray(Object.values(x.blocks.sdf))))};}${normalCodeFor("worldSdf")}${collisionsFS}`;

        return prependPrecisionAndVersion(shader);
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


function buildRoomFS(roomSdf) {
    return prependPrecisionAndVersion(`
    ${roomHeaderFS}
    ${DynamicObjectsUBlock}
    ${roomFunctionsFS}
    ${roomFunctionsDynamicFS}
    ${roomSdf.auxCode}

    vec2 room(vec3 pos){float d=3.402823466e+38;float mat=-1.0;vec4 pos4=vec4(pos,1.0);${roomSdf.sdf};return vec2(d,mat);}

    ${normalCodeFor("room", ".x")}
    
    ${roomRenderFS}
    `);
}