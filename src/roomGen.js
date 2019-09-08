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

function randBetween(a, b) {
    return a + Math.random() * (b - a);
}

function randBetweenInt(a, b) {
    return Math.floor(randBetween(a, b));
}

function getRandomElement(arr) {
    return arr[randBetweenInt(0, arr.length)];
}


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
    let avgHeight = maxRoomHeight * 0.5;

    //Create grid of rooms
    for (let y = 0; y < m; y++) {
        for (let x = 0; x < m; x++) {
            if (!getRoomMarker(x, y)) {
                continue;
            }
            let room = {
                idx: genRoomIndex(x, y),
                boundWidth: avgSide,
                boundDepth: avgSide,
                boundHeight: avgHeight,
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


            //d[1] = rooms.find(x => x.idx == d[1]);
        }
        console.log(doorOpenings);

    }

    return rooms;
}


function genRooms(nRooms) {
    let rooms = initialRoomsGrid(nRooms);


    //Generate aisle rooms
    // aisle points closestA farestB closestB farestA
    for (let r of rooms) {
        for (let d of r.doors) {
            let otherRoom = d[1];
            if (r.idx < otherRoom.idx) {
                let room = {
                    boundHeight: doorHeight,
                    idx: `${r.idx}:${otherRoom.idx}`,
                };

            }
        }
    }



    console.log(rooms);

    return rooms;
}