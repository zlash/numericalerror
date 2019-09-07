/*
    What I am going to do?
*/

const doorWidth = 3;
const doorHeight = 4;
const areaRatio = 2.5;
const minSide = doorWidth + 1;
const maxSide = 6;//40;
const minAisleLen = 0;
const maxAisleLen = 0;
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
                center: [x * (avgSide + minAisleLen), 0, y * (avgSide + minAisleLen)],
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
        for (let d of r.doors) {
            d[1] = rooms.find(x => x.idx == d[1]);
        }
    }

    console.log(rooms);
    return rooms;
}

/*
function generateGenericRoom() {

    let height = randBetween(5, 15);

    let width = randBetween(minSide, maxSide);
    let depth = randBetween(Math.max(minSide, width / areaRatio), Math.min(maxSide, width * areaRatio));

    let points = [];

    points.push([-width * 0.5, -depth * 0.5]);
    points.push([-width * 0.5, depth * 0.5]);
    points.push([width * 0.5, depth * 0.5]);
    points.push([width * 0.5, -depth * 0.5]);

    return {
        floor: 0,
        ceiling: height,
        points: points,
        boundWidth: width,
        boundDepth: depth,
        boundHeight: height,
        center: [0, 0, 0],
        doors: [0, 1, 2, 3]// top, right
    };

}*/


function genRooms(nRooms) {
    let rooms = initialRoomsGrid(nRooms);

    for (let r of rooms) {
        r.floor = r.center[1];
        r.ceiling = r.center[1] + r.boundHeight;
        r.points = [[0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]
            .map(x => [x[0] * r.boundWidth + r.center[0], x[1] * r.boundDepth + r.center[2]]);

        for (let d of r.doors) {
            r.points[d[0]].push(d[1]);
        }
    }



    return rooms;
}