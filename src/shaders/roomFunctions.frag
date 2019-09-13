
float sdfPlane(vec3 pos, vec3 n)
{
    return dot(pos, n);
}

float sdfBox(vec3 p, vec3 b)
{
    vec3 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sdfRoundedBox(vec3 p, vec3 b, float r)
{
    vec3 d = abs(p) - b;
    return length(max(d, 0.0)) - r + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sdfOpIntersection(float d1, float d2) { return max(d1, d2); }

// Apply after primitive
float sdfOpExtrusion(vec3 p, float d2d, float h)
{
    vec2 w = vec2(d2d, abs(p.z) - h);
    return min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
}

// Apply before primitive
vec3 sdfOpRepeat(vec3 p, vec3 c) { return mod(p, c) - 0.5 * c; }

float sdfOpSmoothUnion(float d1, float d2, float k)
{
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

const vec3 brickSize = vec3(0.3, 0.13, 0.03);

float sdfBrick4x4(vec3 pos)
{
    const float separation = 0.95;
    vec3 repeat = sdfOpRepeat(pos, vec3(brickSize.xy * 4.0, 0.0));
    return sdfRoundedBox(repeat, brickSize * vec3(0.8 * separation, 0.5 * separation, 1.0), 0.05);
}

float sdfBrickRow(vec3 pos)
{
    return min(sdfBrick4x4(pos),
        sdfBrick4x4(pos - vec3(brickSize.x * 2.0, 0.0, 0.0)));
}

float sdfWall(vec3 pos, vec2 dim)
{
    float d = sdfPlane(pos, vec3(0.0, 0.0, 1.0));

    //float bricksD = min(sdfBrickRow(pos),
    //    sdfBrickRow(pos - vec3(brickSize.x, brickSize.y * 2.0, 0.0)));

    //return sdfOpIntersection(min(d, bricksD), sdfBox(pos, vec3(dim, brickSize.z * 2.0)));
    return sdfOpIntersection(d, sdfBox(pos, vec3(dim, 1.0)));
}

float sdfGearsSet(vec3 pos)
{
    return sdfBox(pos, vec3(2.0));
}

float sdfBarsDoor(vec3 pos, vec3 b)
{
    if (uGameData.x > 0.0) {
        return sdfBox(pos, b);
    } else {
        return bigFloat;
    }
}

float sdfLavaSafe(vec3 pos)
{
    if (uGameData.x > 0.0) {
        return sdfBox(pos, vec3(2.0,2.0,2.0));
    } else {
        return bigFloat;
    }
}


float sdHexPrism(vec3 p, vec2 h)
{
    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p);
    p.xy -= 2.0 * min(dot(k.xy, p.xy), 0.0) * k.xy;
    vec2 d = vec2(
        length(p.xy - vec2(clamp(p.x, -k.z * h.x, k.z * h.x), h.x)) * sign(p.y - h.x),
        p.z - h.y);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// h -> height / side
float sdfHex(vec3 pos, vec2 h)
{
    float w = h.y / 5.0;
    float d = bigFloat;

    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 5; j++) {
            float hh = abs(sin(0.5 * uTimeSeconds + 3.1515 * 0.5 * float(i) / 9.0));
            d = min(d, sdHexPrism(pos - vec3(4.0 * w * (float(j) - 2.0 + (i % 2 == 0 ? 0.0 : 0.5)) / 5.0, 2.0 * w * (float(i) - 4.0) / 5.0, -0.5 * h.x + hh * h.x), vec2(w * 0.9 * 0.25, 0.5 * h.x)));
        }
    }
    return d;
}