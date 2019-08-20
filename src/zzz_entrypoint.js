//
// Init
// 

console.log("Debug Value", DEBUG);

console.log("js12k2019 - Debug mode [ON]"); 

const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl");

canvas.width = 800;
canvas.height = 600;

document.body.appendChild(canvas);

gl.clearColor(0.0, 1.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
