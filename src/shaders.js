let roomVS = `in vec4 aVertexPosition;uniform mat4 uProjectionMatrix,uClipModelViewMatrix;out vec4 vViewVector;void main(){vec4 v=inverse(uProjectionMatrix)*vec4(aVertexPosition.xy,1.,1.);v/=v.w;vec4 n=inverse(uProjectionMatrix)*vec4(aVertexPosition.xy,-1.,1.);n/=n.w;vViewVector=v-n;gl_Position=uClipModelViewMatrix*vec4(aVertexPosition.xy,0.,1.);}`;
let screenQuadVS = `in vec4 aVertexPosition;void main(){gl_Position=vec4(aVertexPosition.xy,0.,1.);}`;
let roomHeaderFS = `in vec4 vViewVector;uniform mat4 uModelViewMatrix;uniform ivec2 uScreenSize;uniform mat4 uDynamicTransforms[10];uniform float uTimeSeconds;layout(location=0)out vec4 fragColor;`;
let roomRenderFS = `uniform sampler2D uArraySampler;vec2 hash(vec2 v){const vec2 n=vec2(.31831,.367879);v=v*n+n.yx;return-1.+2.*fract(16.*n*fract(v.x*v.y*(v.x+v.y)));}float noise(in vec2 v){vec2 u=floor(v),n=fract(v),d=n*n*(3.-2.*n);return mix(mix(dot(hash(u+vec2(0.,0.)),n-vec2(0.,0.)),dot(hash(u+vec2(1.,0.)),n-vec2(1.,0.)),d.x),mix(dot(hash(u+vec2(0.,1.)),n-vec2(0.,1.)),dot(hash(u+vec2(1.,1.)),n-vec2(1.,1.)),d.x),d.y);}float tex(vec2 v){v*=10.;mat2 n=mat2(1.6,1.2,-1.2,1.6);float f=.5*noise(v);v=n*v;f+=.25*noise(v);v=n*v;f+=.125*noise(v);v=n*v;f+=.0625*noise(v);v=n*v;return f*.5+.5;}vec3 lava(vec2 v){v*=.2;float n=noise(v*5.),d=noise(10.+v*20.)*.5+.5,u=n*3.1415;vec2 m=2.*vec2(cos(u),sin(u));float f=uTimeSeconds*.5+d,t=fract(f),x=fract(f+.5);vec2 y=m*.1*t,a=m*.1*x;vec3 s=vec3(n);float r=mix(tex(v+y),tex(v+a),abs(t*2.-1.));r=min(1.,max(0.,abs(r-.35)/.35));return mix(vec3(1.,0.,0.),vec3(1.,1.,0.),r);}vec3 shade(vec3 v,vec3 u,float n){if(n<.5){vec2 f=v.xy;vec3 d=cross(u,vec3(0.,0.,1.));if(length(d)>.0001){d=normalize(d);vec3 m=normalize(cross(u,d));f=(transpose(mat3(d,m,u))*v).xy;}return tex(f/32.)*texture(uArraySampler,f/8.).xyz;}else if(n<1.5)return lava(v.xz);return vec3(1.,0.,0.);}uniform mat4 uProjectionMatrix;void main(){const float v=3.;vec3 f=vec3(0.),d;vec2 n;float u=0.;mat4 m=inverse(uModelViewMatrix);vec2 t=gl_FragCoord.xy/vec2(uScreenSize);vec4 r=inverse(uProjectionMatrix)*vec4(t.xy*2.-vec2(1),-1.,1.),a=inverse(uProjectionMatrix)*vec4(t.xy*2.-vec2(1),1.,1.);vec3 s=r.xyz/r.w,y=normalize(a.xyz/a.w);for(int i=ZERO;i<64;i++){d=y*u;d=vec3(m*vec4(d,1.));n=room(d);float x=n.x;if(abs(x)<.001||u>20.)break;u+=x;}if(u<20.){vec3 i=normalize(vec3(1.,1.,1.)),x=calcNormal(d);f=shade(d,x,n.y);float l=1.;l*=max(0.,dot(i,x));f*=min(1.,.4+l);}else{discard;}fragColor=vec4(f.xyz,1.);}`;
let collisionsFS = `uniform sampler2D uPositionsSampler;void main(){vec3 v=vec3(texelFetch(uPositionsSampler,ivec2(gl_FragCoord.x,0),0)),i=v,l=vec3(texelFetch(uPositionsSampler,ivec2(gl_FragCoord.x,1),0)),t=l-v;float f=length(t);vec4 r=vec4(vec3(0),v.x);if(f!=0.){t/=f;float u=0.;f=max(.1,f);for(int s=ZERO;s<64;s++){float m=worldSdf(v+t*u);if(abs(m)<.001||u>f)break;u+=m;}if(u<f){vec3 m=calcNormal(v+t*u);r=vec4(m,u*.99);}}fragColor=r;}`;
let roomFunctionsDynamicFS = `float sdfPlayerShip(vec3 v){return sdfOpSmoothUnion(sdfBox(v,vec3(.05,.05,.15)),sdfBox(v-vec3(0.,0.,.06),vec3(.3,.05,.05)),.1);}float dcm(vec3 v,vec3 x,float d){if(d<1.5)return length(v-x)-.1;else if(d<2.5){float f=length(v-x)-.15;const int s=25;for(int c=0;c<s;c++){vec2 l=vec2(float(c)/float(s),2.*float(c)/(1.+sqrt(5.))),u=vec2(acos(2.*l.x-1.)-1.57075,6.283*l.y);vec3 i=normalize(vec3(cos(u.x)*cos(u.y),cos(u.x)*sin(u.y),sin(u.x))),y=i*(.2+.08*sin(uTimeSeconds*3.+float(c)*3.1415));float a=length(v-x-y)-.025;const float e=.18;float w=clamp(.5+.5*(a-f)/e,0.,1.);f=mix(a,f,w)-e*w*(1.-w);}return f;}return length(v-x)-1.;}float dynamicStuff(vec3 v){int f=0;float u=sdfPlayerShip(vec3(uDynamicTransforms[0]*vec4(v,1.)));while(dynO[f].w>=0.)u=min(u,dcm(v,vec3(dynO[f]),dynO[f].w)),f++;return u;}`;
let roomFunctionsFS = `float sdfPlane(vec3 s,vec3 v){return dot(s,v);}float sdfBox(vec3 s,vec3 v){vec3 m=abs(s)-v;return length(max(m,0.))+min(max(m.x,max(m.y,m.z)),0.);}float sdfRoundedBox(vec3 s,vec3 m,float v){vec3 f=abs(s)-m;return length(max(f,0.))-v+min(max(f.x,max(f.y,f.z)),0.);}float sdfOpIntersection(float s,float v){return max(s,v);}float sdfOpExtrusion(vec3 s,float m,float v){vec2 f=vec2(m,abs(s.z)-v);return min(max(f.x,f.y),0.)+length(max(f,0.));}vec3 sdfOpRepeat(vec3 s,vec3 v){return mod(s,v)-.5*v;}float sdfOpSmoothUnion(float v,float s,float m){float f=clamp(.5+.5*(s-v)/m,0.,1.);return mix(s,v,f)-m*f*(1.-f);}const vec3 brickSize=vec3(.3,.13,.03);float sdfBrick4x4(vec3 s){const float m=.95;vec3 v=sdfOpRepeat(s,vec3(brickSize.xy*4.,0.));return sdfRoundedBox(v,brickSize*vec3(.8*m,.5*m,1.),.05);}float sdfBrickRow(vec3 s){return min(sdfBrick4x4(s),sdfBrick4x4(s-vec3(brickSize.x*2.,0.,0.)));}float sdfWall(vec3 s,vec2 v){float m=sdfPlane(s,vec3(0.,0.,1.));return sdfOpIntersection(m,sdfBox(s,vec3(v,1.)));}`;
