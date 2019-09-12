let SomeBigFloat = 3.402823466e+38;

function numberToStringWithDecimals(n) {
    n = Number(n);
    return `${n}${n === Math.trunc(n) ? ".0" : ""}`;
}

function objectMap(obj, f) {
    return Object.assign({}, ...Object.keys(obj).map(k => ({ [k]: f(obj[k]) })));
}


//f (acc, curValue, curKey)
function objectReduce(obj, f, initialValue) {
    return Object.keys(obj).reduce((acc, cur) => f(acc, obj[cur], cur), initialValue);
}

function makeChainOfMinsArray(arr) {
    return arr.reduce((acc, cv) => `min(${acc},${cv})`);
}


function mix(a, b, ratio) {
    return (1 - ratio) * a + ratio * b;
}

function randBetween(a, b) {
    return a + Math.random() * (b - a);
}

function randBetweenInt(a, b) {
    return Math.floor(randBetween(a, b));
}

function getRandomElement(arr) {
    return arr[randBetweenInt(0, arr.length)];
}

function getWrapedElement(arr, idx) {
    return arr[idx % arr.length];
}

function normalRand(min, max, mean) {
    const bound = 3;
    mean = mean == null ? ((min + max) * 0.5) : mean;
    let sample = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
    sample = Math.min(bound, Math.max(-bound, sample));
    return sample < 0 ? (mean + (mean - min) * sample / bound) : ((max - mean) * sample / bound + mean);
}


function promisify(callback) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(callback()), 0);
    });
}

function arrayUnique(arr, cb) {
    if (arr.length == 0) return arr;

    let result = [];
    while (arr.length > 0) {
        let next = arr.shift();
        result.push(next);
        arr = arr.filter(x => !cb(next, x));
    }
    return result;
}