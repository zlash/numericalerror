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
