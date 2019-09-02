function numberToStringWithDecimals(n) {
    n = Number(n);
    return `${n}${n === Math.trunc(n) ? ".0" : ""}`;
}