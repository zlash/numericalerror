/*
    What I am going to do?
*/

const doorWidth = 3;
const doorHeight = 4;
const areaRatio = 2.5;
const minSide = doorWidth + 1;
const maxSide = 30;
const minAisleLen = 3;
const maxAisleLen = 15;
const minRoomHeight = doorHeight + 1;
const maxRoomHeight = 15;

function initialRoomsGrid(nRooms) {
    let m = Math.ceil(Math.sqrt(nRooms)) + 1;
    let roomMarkers = Array(m * m).fill(false);
    let rooms = [];

    let genRoomIndex = (x, y) => {
        if (x >= 0 && y >= 0 && x < m && y < m) {
            return y * m + x;
        }
        return null;
    };

    let getRoomMarker = (x, y) => {
        let idx = genRoomIndex(x, y);
        return idx != null ? roomMarkers[idx] : false;
    }

    let indexToCoords = idx => {
        let y = Math.floor(idx / m);
        return [idx - y * m, y];
    }

    roomMarkers[randBetweenInt(0, m * m)] = true;

    for (let i = 1; i < nRooms; i++) {
        let availIndices = roomMarkers.map((x, i) => i).filter(i => {
            let [x, y] = indexToCoords(i);
            return !getRoomMarker(x, y) &&
                (getRoomMarker(x - 1, y) || getRoomMarker(x, y - 1) ||
                    getRoomMarker(x + 1, y) || getRoomMarker(x, y + 1));
        });
        roomMarkers[getRandomElement(availIndices)] = true;
    }

    let avgSide = (minSide + maxSide) * 0.5;
    let avgAisle = (minAisleLen + maxAisleLen) * 0.5;
    let avgHeight = (maxRoomHeight + minRoomHeight) * 0.5;

    let width = normalRand(minSide, maxSide);
    let depth = normalRand(Math.max(minSide, width / areaRatio), Math.min(maxSide, width * areaRatio));

    //Create grid of rooms
    for (let y = 0; y < m; y++) {
        for (let x = 0; x < m; x++) {
            if (!getRoomMarker(x, y)) {
                continue;
            }
            let room = {
                idx: genRoomIndex(x, y),
                boundWidth: width,
                boundDepth: depth,
                boundHeight: normalRand(minRoomHeight, maxRoomHeight),
                center: [x * (avgSide + avgAisle), 0, y * (avgSide + avgAisle)],
                doors: [] //side (0 top, CCW), targetRoom, normalizedPos
            };
            for (let i = 0; i < 4; i++) {
                let sinTable = [0, -1, 0, 1, 0];
                let xx = sinTable[i] + x;
                let yy = sinTable[i + 1] + y;
                if (getRoomMarker(xx, yy)) {
                    room.doors.push([i, genRoomIndex(xx, yy), 0.5]);
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
        for (let d of r.doors) {
            //Push the opening in the correspondent slot
            let pA = r.points[d[0]];
            let pB = r.points[(d[0] + 1) % 4];

            let side = v2Subtract(pB, pA);
            let sideLen = v2Length(side);
            let halfDoorFraction = 0.5 * doorWidth / sideLen;

            doorOpenings[d[0]] = [[...v2Add(pA, v2Scale(side, d[2] - halfDoorFraction)), rooms.find(x => x.idx == d[1])],
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

function genRooms(nRooms) {
    let rooms = initialRoomsGrid(nRooms);

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