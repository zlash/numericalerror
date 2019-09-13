/*
    What I am going to do?
*/

const doorWidth = 3;
const doorHeight = 4;
const areaRatio = 2.5;
const minSide = doorWidth + 1;
const maxSide = 30;
const minAisleLen = 8;
const maxAisleLen = 40;
const minRoomHeight = doorHeight + 1;
const maxRoomHeight = 10;

let RoomTypes = {
    empty: 0,
    normal: 1,
    lavaRoom: 2,
    gearsRoom: 3,
    initialRoom: 4,
    bossRoom: 5,
    hexRoom: 6,
    aisle: 7,
};

function initialRoomsGrid(gridSize) {
    let m = Math.max(3, gridSize);
    let rooms = [];

    let genRoomIndex = (x, y) => {
        if (x >= 0 && y >= 0 && x < m && y < m) {
            return y * m + x;
        }
        return null;
    };

    let indexToCoords = idx => {
        let y = Math.floor(idx / m);
        return [idx - y * m, y];
    }

    let rotateAndCopyTile = (tile, rotation) => {
        if (rotation == 0) {
            return [...tile];
        }
        let ops = tile[1];
        return rotateAndCopyTile([tile[0], [ops[3], ops[0], ops[1], ops[2]]], rotation - 1);
    }

    //0: oblig wall, 1: oblig door, 2: door/wall
    let roomTiles = [[RoomTypes.empty, [0, 0, 0, 0]], [RoomTypes.normal, [1, 2, 1, 2]], [RoomTypes.normal, [1, 1, 2, 2]]];
    let nonRotatingRoomTiles = [[RoomTypes.gearsRoom, [1, 0, 1, 0]]];

    let tilesEq = (a, b) => a[0] == b[0] && a[1].every((x, i) => x == b[1][i]);
    let roomsWFC = Array(m * m).fill(0).map(x => {
        let tiles = [];
        for (let t of roomTiles) {
            for (let i = 0; i < 4; i++) {
                tiles.push(rotateAndCopyTile(t, i));
            }
        }
        nonRotatingRoomTiles.forEach(x => tiles.push(rotateAndCopyTile(x, 0)));
        return arrayUnique(tiles, tilesEq);
    });

    let coordOffsetsFromRotation = i => {
        const coords = [0, 1, 0, -1];
        return [coords[i], coords[(i + 3) % 4]];
    }

    let oppositeDirection = i => [2, 3, 0, 1][i];

    let sidesAreCompatible = (ai, bi) => {
        let [a, b] = ai < bi ? [ai, bi] : [bi, ai];
        return (a == 0 && (b == 0 || b == 2))
            || (a == 1 && (b == 1 || b == 2))
            || a == 2;
    };

    let roomConected = (x, y, i) => {
        let curSide = roomsWFC[genRoomIndex(x, y)][0][1][i];

        if (curSide == 0) return false;
        if (curSide == 1) return true;

        let [ox, oy] = coordOffsetsFromRotation(i);
        let opIdx = genRoomIndex(x + ox, y + oy);
        if (opIdx == null) {
            return false;
        }

        let opSideTiles = roomsWFC[opIdx];

        if (opSideTiles.length == 0) {
            return false;
        }

        return opSideTiles[0][1][oppositeDirection(i)] != 0;
    };

    let enforceConstraints = (x, y) => {
        let curIdx = genRoomIndex(x, y);
        if (curIdx == null) return;
        let curCell = roomsWFC[curIdx];

        for (let i = 0; i < 4; i++) {
            let [xi, yi] = coordOffsetsFromRotation(i);
            xi += x;
            yi += y;
            let idx = genRoomIndex(xi, yi);

            curCell = curCell.filter(x => {
                let curSide = x[1][i];
                let survives = false;
                if (idx == null || roomsWFC[idx].length == 0) {
                    survives = curSide != 1;
                } else {
                    roomsWFC[idx].forEach(againstTile => {
                        let opSide = oppositeDirection(i);
                        survives = survives || sidesAreCompatible(curSide, againstTile[1][opSide]);
                    });
                }

                return survives;
            });
        }
        if (curCell.length < roomsWFC[curIdx].length) {
            modifyCellAndEnforceConstraints(x, y, curCell);
        }
    };

    let modifyCellAndEnforceConstraints = (x, y, val) => {
        roomsWFC[genRoomIndex(x, y)] = val;
        enforceConstraints(x + 1, y);
        enforceConstraints(x - 1, y);
        enforceConstraints(x, y + 1);
        enforceConstraints(x, y - 1);
    }

    modifyCellAndEnforceConstraints(1, m - 1, [[RoomTypes.hexRoom, [1, 0, 0, 0]]]);
    modifyCellAndEnforceConstraints(m - 2, 0, [[RoomTypes.lavaRoom, [0, 1, 0, 1]]]);

    modifyCellAndEnforceConstraints(0, 0, [[RoomTypes.bossRoom, [2, 1, 0, 0]]]);
   // modifyCellAndEnforceConstraints(m - 1, m - 1, [[RoomTypes.bossRoom, [1, 0, 0, 0]]]);


    while (true) {
        //Pick tiles with lowest wfc count
        let minCount = roomsWFC.filter(x => x.length > 1).reduce((accum, a) => a.length < accum ? a.length : accum, 9999);
        if (minCount == 9999) {
            break;
        }

        //Collapse + enforce constraints
        let availTiles = roomsWFC.map((x, i) => i).filter(i => roomsWFC[i].length > 1 && roomsWFC[i].length == minCount);

        let nextIdx = getRandomElement(availTiles);
        let [x, y] = indexToCoords(nextIdx);
        modifyCellAndEnforceConstraints(x, y, [getRandomElement(roomsWFC[nextIdx])])
    }

    let avgSide = (minSide + maxSide) * 0.5;
    let avgAisle = (minAisleLen + maxAisleLen) * 0.5;
    let avgHeight = (maxRoomHeight + minRoomHeight) * 0.5;

    //Create grid of rooms
    for (let y = 0; y < m; y++) {
        for (let x = 0; x < m; x++) {

            let floor = 0;
            let height = normalRand(minRoomHeight, maxRoomHeight);
            let width = normalRand(minSide, maxSide);
            let depth = normalRand(Math.max(minSide, width / areaRatio), Math.min(maxSide, width * areaRatio));

            let curRoomTiles = roomsWFC[genRoomIndex(x, y)];
            if (curRoomTiles.length == 0) {
                continue;
            }

            let curRoom = curRoomTiles[0];

            if (curRoom[0] == RoomTypes.empty) { //empty room
                continue;
            }

            if (curRoom[0] == RoomTypes.lavaRoom) { //special Lava room
                floor = -30;
                height -= floor;
                depth = 40;
                width = 25;
            }

            if (curRoom[0] == RoomTypes.gearsRoom) { // gears room
                floor = -5;
                height = doorHeight - floor * 2;
                depth = 30;
                width = doorHeight - floor * 2;
            }

            if (curRoom[0] == RoomTypes.bossRoom) {
                floor = -50;
                height -= floor;
                depth = 25;
                width = 25;
            }

            if (curRoom[0] == RoomTypes.hexRoom) {
                floor = -5;
                height = 12 - floor;
                depth = 30;
                width = 30;
            }


            let room = {
                idx: genRoomIndex(x, y),
                boundWidth: width,
                boundDepth: depth,
                boundHeight: height,
                center: [x * (avgSide + avgAisle), floor, y * (avgSide + avgAisle)],
                doors: [], //side (0 top, CCW), targetRoom, normalizedPos
                roomType: curRoom[0]
            };
            for (let i = 0; i < 4; i++) {
                let [xx, yy] = coordOffsetsFromRotation(i);
                xx += x;
                yy += y;

                let sideLen = [room.boundDepth, room.boundWidth, room.boundDepth, room.boundWidth][i];
                let doorMargin = (1 + doorWidth) * 0.5;
                let doorPos = normalRand(doorMargin, sideLen - doorMargin);
                doorPos = 0.5 * sideLen;
                if (roomConected(x, y, i)) {
                    room.doors.push([i, genRoomIndex(xx, yy), doorPos / sideLen]);
                }
            }
            rooms.push(room);
        }
    }

    for (let r of rooms) {
        r.floor = r.center[1];
        r.ceiling = r.center[1] + r.boundHeight;
        r.points = [[0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]
            .map(x => [x[0] * r.boundWidth + r.center[0], x[1] * r.boundDepth + r.center[2]]);

        let doorOpenings = Array(4).fill(null);

        let mapDirToPoint = i => [0, 3, 2, 1][i];

        for (let d of r.doors) {
            //Push the opening in the correspondent slot
            let pointIdx = mapDirToPoint(d[0]);
            let pA = r.points[pointIdx];
            let pB = r.points[(pointIdx + 1) % 4];

            let side = v2Subtract(pB, pA);
            let sideLen = v2Length(side);
            let halfDoorFraction = 0.5 * doorWidth / sideLen;

            doorOpenings[pointIdx] = [[...v2Add(pA, v2Scale(side, d[2] - halfDoorFraction)), rooms.find(x => x.idx == d[1])],
            [...v2Add(pA, v2Scale(side, d[2] + halfDoorFraction))]];
        }

        r.points = [].concat(...r.points.map((x, i) => [x, ...(doorOpenings[i] ? doorOpenings[i] : [])]));
    }

    return rooms;
}

//Needed: points, floor, ceiling
function fillRoomMissingStuff(room) {
    let results = room.points.reduce((acc, x) => {
        acc.center = v2Add(acc.center, v2Scale(x, 1 / room.points.length));
        for (let i = 0; i < 2; i++) {
            let min = acc.extents[0][i];
            acc.extents[0][i] = (min == null || x[i] < min) ? x[i] : min;

            let max = acc.extents[1][i];
            acc.extents[1][i] = (max == null || x[i] > max) ? x[i] : max;
        }
        return acc;
    }, { center: [0, 0], extents: [[null, null], [null, null]] })

    room.center = [results.center[0], (room.floor + room.ceiling) * 0.5, results.center[1]];

    room.boundWidth = results.extents[1][0] - results.extents[0][0];
    room.boundDepth = results.extents[1][1] - results.extents[0][1];
    room.boundHeight = room.ceiling - room.floor;

    return room;
}

function sepRoom(rooms, roomA, roomB, coord, delta) {
    const coord2 = coord * 2;
    const sign = Math.sign(roomA.center[coord2] - roomB.center[coord2]);
    delta *= sign;

    const middle = (roomA.center[coord2] + roomB.center[coord2]) * 0.5;
    //Stiff joints. All rooms that lie to the side of the middle of the
    //selected coord are moved

    rooms.forEach(x => {
        //If not in siff set, break;
        if (x.center[coord2] < middle * sign) {
            return;
        }

        x.center[coord2] += delta;
        for (let p of x.points) {
            p[coord] += delta;
        }
    });
}
function overlapOnCoord(roomA, roomB, coord) {
    let dist = Math.abs(roomA.center[coord * 2] - roomB.center[coord * 2]);
    let radSum = ([roomA.boundWidth, roomA.boundDepth][coord] + [roomB.boundWidth, roomB.boundDepth][coord]) * 0.5 + minAisleLen;
    return radSum - dist;
}

function separateOnCoord(rooms, roomA, roomB, coord) {
    let sep = overlapOnCoord(roomA, roomB, coord);
    if (sep > 0) {
        sepRoom(rooms, roomA, roomB, coord, sep * 0.5);
        sepRoom(rooms, roomB, roomA, coord, sep * 0.5);
        return true;
    }
    return false;
}

function solveConstraints(rooms) {
    let fixesNeeded = false;
    for (let i = 0; i < rooms.length; i++) {
        let roomA = rooms[i];
        for (let j = i + 1; j < rooms.length; j++) {
            let roomB = rooms[j];

            let overlaps = [overlapOnCoord(roomA, roomB, 0), overlapOnCoord(roomA, roomB, 1)];

            if (overlaps[0] > 0 && overlaps[1] > 0) {
                if (overlaps[0] < overlaps[1]) {
                    fixesNeeded = fixesNeeded || separateOnCoord(rooms, roomA, roomB, 0);
                } else {
                    fixesNeeded = fixesNeeded || separateOnCoord(rooms, roomA, roomB, 1);
                }
            } else if (overlaps[0] > 0) {
                fixesNeeded = fixesNeeded || separateOnCoord(rooms, roomA, roomB, 0);
            } else if (overlaps[1] > 0) {
                fixesNeeded = fixesNeeded || separateOnCoord(rooms, roomA, roomB, 1);
            }
        }
    }

    return fixesNeeded;
}

function genRooms(nRooms) {
    let rooms = initialRoomsGrid(nRooms);

    //Coooooonstraiiiints
    for (let i = 0; i < 500; i++) {
        if (!solveConstraints(rooms)) {
            break;
        }
    }

    //Generate aisle rooms
    // aisle points closestA farestB closestB farestA
    for (let roomA of rooms) {
        for (let p of roomA.points) {
            let roomB = p[2];
            if (roomB != undefined && roomA.idx < roomB.idx) {
                let pointsA = roomA.points;
                let pointsB = roomB.points;

                //Find points in both rooms
                let pointA = pointsA.findIndex((x) => x[2] == roomB);
                let pointB = pointsB.findIndex((x) => x[2] == roomA);

                let p0 = getWrapedElement(pointsA, pointA);
                let p1 = getWrapedElement(pointsB, pointB + 1);
                let p2 = getWrapedElement(pointsB, pointB);
                let p3 = getWrapedElement(pointsA, pointA + 1);


                let room = {
                    floor: 0,
                    ceiling: doorHeight,
                    idx: `${roomA.idx}_${roomB.idx}`,
                    roomType: RoomTypes.aisle,
                    points: [
                        [p0[0], p0[1]],
                        [p1[0], p1[1], roomB],
                        [p2[0], p2[1]],
                        [p3[0], p3[1], roomA]
                    ]
                };

                p2[2] = room;
                p0[2] = room;

                rooms.push(room);
            }
        }
    }


    return rooms.map(x => fillRoomMissingStuff(x));
}