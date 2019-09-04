in vec4 aVertexPosition;

void main()
{
    gl_Position = vec4(aVertexPosition.xy, 0.0, 1.0);
}