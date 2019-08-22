const VSRoom = `
  attribute vec4 aVertexPosition;

  uniform mat4 uProjectionMatrix;

  varying vec2 vUvs;

  void main() {
    vUvs = (aVertexPosition.xy+vec2(1.0))*0.5;
    gl_Position = vec4(aVertexPosition.xy,0.0,1.0);
  }
`;

const FSRoom = `
precision highp float;
varying vec2 vUvs;

uniform mat4 uModelViewMatrix;

float plane(vec3 pos)
{
    return dot(pos+vec3(0.0,0.0,2.0),vec3(0.0,0.0,1.0));
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); 
}

float sdBoxes( vec3 p, vec3 b )
{
    vec3 c =vec3(1.6,1.6,0.0);
    vec3 q = mod(p,c)-0.5*c;
    return sdBox(q,b);
}

vec2 room(vec3 pos)
{
    float d = 1e10;
    d = min(d,sdBoxes(pos,vec3(0.5,0.3,0.2)));

    float pl= plane(pos);
    if(d<pl) {
        return vec2(d,1.0);
    }

    return vec2(pl,-1.0);
}

mat4 matInverse( mat4 m )
{
	return mat4(
        m[0][0], m[1][0], m[2][0], 0.0,
        m[0][1], m[1][1], m[2][1], 0.0,
        m[0][2], m[1][2], m[2][2], 0.0,
        -dot(m[0].xyz,m[3].xyz),
        -dot(m[1].xyz,m[3].xyz),
        -dot(m[2].xyz,m[3].xyz),
        1.0 );
}


float shadow( vec3 ro,  vec3 rd, float mint,  float tmax )
{
	float res = 1.0;
    float t = mint;

    for( int i=0; i<32; i++ )
    {
		float h = room( ro + rd*t ).x;

        res = min( res, 10.0*h/t );

        t += h;
        
        if( abs(h)<0.001 || t>tmax ) break;
        
    }
    return step( 0.01, res );
}


void main() {
    const float sensorSize = 3.0;
    vec3 col = vec3(0.0);
    vec3 p;
    vec2 mt;
    float t = 0.1;
    mat4 invModelView = matInverse(uModelViewMatrix);
    for( int i=0; i<64; i++ )
    {
        p = vec3(sensorSize*(vUvs*2.0-1.0),0.0)+vec3(0.0,0.0,-1.0)*t;
        p = vec3(invModelView * vec4(p,1.0));
        mt = room(p);
        float h = mt.x;
        if( abs(h)<0.001 || t>20.0 ) break;
        t += h;
    }

    if( t<20.0 )
    {
        if(mt.y>0.0) {
            col = vec3(0.8,0.0,0.0);
        }else{
        col = vec3(1.0);
        }
        col*=shadow(p,normalize(vec3(1.0,1.0,1.0)),0.05,20.0);
    }

    gl_FragColor = vec4(col.xyz, 1.0);
}
`;