const VSVertexColor = `
  attribute vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying vec2 vUvs;

  void main() {
    vUvs = (aVertexPosition.xy+vec2(1.0))*0.5;
    gl_Position = vec4(aVertexPosition.xy,0.0,1.0);
  }
`;

const FSVertexColor = `
precision mediump float;
varying vec2 vUvs;

uniform mat4 uModelViewMatrix;

void main() {
  gl_FragColor = vec4(vUvs.x, vUvs.y, 1.0, 1.0);
}
`;
