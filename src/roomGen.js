/*
    What I am going to do?
*/

const doorWidth = 3;
const doorHeight = 4;
const areaRatio = 2.5;
const minSide = doorWidth + 1;
const maxSide = 40;
const minAisleLen = 3;
const maxAisleLen = 15;
const minRoomHeight = doorHeight + 1;
const maxRoomHeight = 15;

function randBetween(a, b) {
    return a + Math.random() * (b - a);
}

function initialRoomsGrid(nRooms) {
    let m = Math.ceil(Math.sqrt(nRooms));
    let rooms = [];

    let avgSide = (minSide + maxSide) * 0.5;
    let avgHeight = maxRoomHeight * 0.5;
    //Create grid of rooms
    for (let y = 0; y < m; y++) {
        for (let x = 0; x < m; x++) {
            let room = {
                idx: y * m + x,
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
                if (xx >= 0 && xx < m && yy >= 0 && yy < m) {
                    room.doors.push([i, yy * m + xx, 0.5]);
                }
            }
            rooms.push(room);
        }
    }

    for (let r of rooms) {
        for (let d of r.doors) {
            d[1] = rooms(d[1]);
        }
    }

    //abusive recursive connectivity test
    let conTest = (from, to, noVisit) => {
        if (from == to) {
            return true;
        }
        if (noVisit.includes(from)) {
            return false;
        }
        return from.doors.some(x => conTest(x))
    };


    //Remove superfluous rooms
    while (rooms.length > nRooms) {
        let removableRooms = rooms.filter((x) => x.doors.length > 1);
        console.log([...removableRooms]);
        let rn = removableRooms[Math.floor(randBetween(0, removableRooms.length))];
        rooms = rooms.filter(x => x != rn);
        for (let r of rooms) {
            r.doors = r.doors.filter(x => x[1] != rn.idx);
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
    /* 
 
     let rooms = [generateGenericRoom()];
     for (let i = 0; i < nRooms; i++) {
         let newRoom = generateGenericRoom();
 
         let availDoors = rooms.map(r => r.doors.map(d => { return { room: r, door: d }; })).flat();
 
         let tryDoor = availDoors[Math.floor(randBetween(0, availDoors.length))];
 
 
         rooms.push(newRoom);
     }*/
    return initialRoomsGrid(nRooms);
}