
float sdfPlane(vec3 pos, vec3 n) { return dot(pos, n); }

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
    return sdfRoundedBox(
        repeat, brickSize * vec3(0.8 * separation, 0.5 * separation, 1.0), 0.05);
}

float sdfBrickRow(vec3 pos)
{
    return min(sdfBrick4x4(pos),
        sdfBrick4x4(pos - vec3(brickSize.x * 2.0, 0.0, 0.0)));
}

float sdfWall(vec3 pos, vec2 dim)
{
    float d = sdfPlane(pos, vec3(0.0, 0.0, 1.0));

    float bricksD = min(sdfBrickRow(pos),
        sdfBrickRow(pos - vec3(brickSize.x, brickSize.y * 2.0, 0.0)));

    //return sdfOpIntersection(sdfOpSmoothUnion(d, bricksD, 0.05), sdfBox(pos, dim));
    return sdfOpIntersection(d, sdfBox(pos, vec3(dim, 2.0)));
}