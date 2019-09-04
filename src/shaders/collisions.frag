layout(location = 0) out vec4 fragColor;

void main()
{
    fragColor = vec4(worldSdf(vec3(0.0, 1.0, 0.0)), 0.3, 0.4, 0.5);
}