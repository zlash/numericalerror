uniform sampler2D uArraySampler;
/*
float shadow(vec3 ro, vec3 rd, float mint, float tmax)
{
    float res = 1.0;
    float t = mint;

    for (int i = 0; i < 32; i++) {
        float h = room(ro + rd * t).x;

        res = min(res, 10.0 * h / t);

        t += h;

        if (abs(h) < 0.001 || t > tmax)
            break;
    }
    return step(0.01, res);
}
*/

vec2 hash(vec2 x) // replace this by something better
{
    const vec2 k = vec2(0.3183099, 0.3678794);
    x = x * k + k.yx;
    return -1.0 + 2.0 * fract(16.0 * k * fract(x.x * x.y * (x.x + x.y)));
}

float noise(in vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y);
}

float tex(vec2 uv)
{
    /*vec2 q = floor(uv*10.0);
    return mod(q.x + q.y, 2.);*/
    uv *= 10.0;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    float f = 0.5000 * noise(uv);
    uv = m * uv;
    f += 0.2500 * noise(uv);
    uv = m * uv;
    f += 0.1250 * noise(uv);
    uv = m * uv;
    f += 0.0625 * noise(uv);
    uv = m * uv;
    return f * 0.5 + 0.5;
}

vec3 lava(vec2 uv)
{
    uv *= 0.2;
    float value = noise(uv * 5.0);
    float rand = noise(10.0 + uv * 20.0) * 0.5 + 0.5;
    float uValue = value * 3.1415;
    vec2 dir = 2.0 * vec2(cos(uValue), sin(uValue));
    float t = (uTimeSeconds * 0.5 + rand);
    float ft0 = fract(t);
    float ft1 = fract(t + 0.5);
    vec2 dir0 = dir * 0.1 * ft0;
    vec2 dir1 = dir * 0.1 * ft1;

    vec3 col = vec3(value);
    float colValue = mix(tex(uv + dir0), tex(uv + dir1), abs(ft0 * 2.0 - 1.0));

    colValue = min(1.0, max(0.0, abs(colValue - 0.35) / 0.35));

    return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), colValue);
}

vec3 shade(vec3 pos, vec3 normal, float mat)
{
    if (mat < 0.5) { // Wall
        vec2 uv = pos.xy;
        vec3 crossA = cross(normal, vec3(0.0, 0.0, 1.0));
        if (length(crossA) > 0.0001) {
            crossA = normalize(crossA);
            vec3 crossB = normalize(cross(normal, crossA));
            uv = (transpose(mat3(crossA, crossB, normal)) * pos).xy;
        }

        return texture(uArraySampler, uv).rgb;
    } else if (mat < 1.5) { // Floor
        /*vec2 q = floor(pos.xz);
        return vec3(mod(q.x + q.y, 2.));*/
        return lava(pos.xz);
    }

    return vec3(1.0, 0.0, 0.0);
}

uniform mat4 uProjectionMatrix;

void main()
{
    const float sensorSize = 3.0;
    vec3 col = vec3(0.0);
    vec3 p;
    vec2 mt;
    float t = 0.0;
    mat4 invModelView = inverse(uModelViewMatrix);

    vec2 vUvs = gl_FragCoord.xy / vec2(uScreenSize);

    vec4 pView = inverse(uProjectionMatrix) * vec4(vUvs.xy * 2.0 - vec2(1), -1.0, 1.0);
    vec4 pView2 = inverse(uProjectionMatrix) * vec4(vUvs.xy * 2.0 - vec2(1), 1.0, 1.0);
    vec3 pos = (pView.xyz / pView.w);
    vec3 view = normalize((pView2.xyz / pView2.w));

    for (int i = ZERO; i < 64; i++) {
        p = view * t;
        p = vec3(invModelView * vec4(p, 1.0));
        mt = room(p);
        float h = mt.x;
        if (abs(h) < 0.001 || t > 20.0)
            break;
        t += h;
    }

    if (t < 20.0) {
        vec3 light = normalize(vec3(1.0, 1.0, 1.0));

        vec3 n = calcNormal(p);
        col = shade(p, n, mt.y);

        float att = 1.0;
        att *= max(0.0, dot(light, n));
        //att *= shadow(p, normalize(vec3(0.1,1,0)), 0.05, 20.0);
        col *= min(1.0, 0.4 + att);
    } else {
        discard;
    }

    fragColor = vec4(col.xyz, 1.0);
}