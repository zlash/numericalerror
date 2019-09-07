/*
    What I am going to do?

    For N rooms


    * Aisle height 4

    - Generate a room
    - Look for available closed doors
    -

*/

const doorWidth = 3;


function randBetween(a, b) {
    return a + Math.random() * (b - a);
}

function generateGenericRoom() {
    const areaRatio = 2.5;
    const minSide = 4;
    const maxSide = 40;
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
        center: [0, 0]
    };

}


function genRooms(nRooms) {
    return [generateGenericRoom()];
}