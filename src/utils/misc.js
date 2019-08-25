function numberToStringWithDecimals(n) {
    return `${n}${n===Math.trunc(n)?".0":""}`;
}