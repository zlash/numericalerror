const VSRoom = `
  attribute vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying vec2 vUvs;

  void main() {
    vUvs = (aVertexPosition.xy+vec2(1.0))*0.5;
    gl_Position = vec4(aVertexPosition.xy,0.0,1.0);
  }
`;

const FSRoom = `
precision mediump float;
varying vec2 vUvs;

float plane(vec3 pos)
{
    return dot(pos,vec3(0.0,0.0,1.0))-5.0;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

float room(vec3 pos)
{
    float d = 1e10;
    return min(d,sdBox(pos,vec3(0.5)));
}

void main() {
    const float sensorSize = 3.0;
    vec3 col = vec3(0.0);
    float t = 0.1;
    for( int i=0; i<64; i++ )
    {
        vec3 p = vec3(sensorSize*(vUvs*2.0-1.0),0.0)+vec3(0.0,0.0,-1.0)*t;
        float h = room(p);
        if( abs(h)<0.001 || t>10.0 ) break;
        t += h;
    }

    if( t<10.0 )
    {
        col = vec3(0.5);
    }

    gl_FragColor = vec4(col.xyz, 1.0);
}
`;