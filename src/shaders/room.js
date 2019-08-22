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

float sdfPlane(vec3 pos, vec3 n)
{
    return dot(pos,n);
}

float sdfBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0)) + min(max(d.x,max(d.y,d.z)),0.0);
}

float sdfRoundedBox( vec3 p, vec3 b, float r )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0)) - r
         + min(max(d.x,max(d.y,d.z)),0.0);
}

float sdfOpIntersection( float d1, float d2 ) {
     return max(d1,d2); 
}

//Apply before primitive
vec3 sdfOpRepeat(vec3 p,vec3 c)
{
    return mod(p,c)-0.5*c;
}

float sdfOpSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); 
}

const vec3 brickSize = vec3(0.3,0.13,0.03);

float sdfBrick4x4(vec3 pos) {
    const float separation=0.95;
    vec3 repeat = sdfOpRepeat(pos,vec3(brickSize.xy*4.0,0.0));
    return sdfRoundedBox(repeat, brickSize*vec3(0.8*separation,0.5*separation,1.0),0.05);
}

float sdfBrickRow(vec3 pos) {
    return min(sdfBrick4x4(pos),sdfBrick4x4(pos-vec3(brickSize.x*2.0,0.0,0.0)));
}

float sdfWall(vec3 pos) {

    float d = sdfPlane(pos, vec3(0.0,0.0,1.0));

    float bricksD = min(sdfBrickRow(pos),sdfBrickRow(pos-vec3(brickSize.x,brickSize.y*2.0,0.0)));

    return sdfOpIntersection(sdfOpSmoothUnion(d,bricksD,0.05),sdfBox(pos,vec3(1.0,1.0,1.0)));
}


/*
float sdBoxes( vec3 p, vec3 b )
{
    vec3 c =vec3(1.6,1.6,0.0);
    vec3 q = mod(p,c)-0.5*c;
    return sdBox(q,b);
}*/

vec2 room(vec3 pos)
{
    return vec2(sdfWall(pos),-1.0);
}


vec3 calcNormal( in vec3 pos )
{
    const float ep = 0.0001;
    vec2 e = vec2(1.0,-1.0)*0.5773;
    return normalize( e.xyy*room( pos + e.xyy*ep ).x + 
					  e.yyx*room( pos + e.yyx*ep ).x + 
					  e.yxy*room( pos + e.yxy*ep ).x + 
					  e.xxx*room( pos + e.xxx*ep ).x );
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
    {   vec3 light = normalize(vec3(1.0,1.0,1.0));
        if(mt.y>0.0) {
            col = vec3(1.0,0.0,0.0);
        }else{
        col = vec3(0.6);
        }
        vec3 n = calcNormal(p);

        float att = 1.0;
        att*=max(0.0,dot(light,n));
        att*=shadow(p,light,0.05,20.0);
        col*=min(1.0,0.4+att);
    }

    gl_FragColor = vec4(col.xyz, 1.0);
}
`;