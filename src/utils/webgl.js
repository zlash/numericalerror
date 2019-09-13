if (DEBUG) {
    function glReverseEnumLookUp(value) {
        let k = Object.getOwnPropertyNames(WebGL2RenderingContext).find(x => WebGL2RenderingContext[x] === value);
        return k || "<ENUM VALUE NOT FOUND>";
    }
}

function loadShaderAsync(gl, type, source) {
    return promisify(() => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        /*
        if (DEBUG) {
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
                console.log(`FAILED SHADER: (TYPE ${glReverseEnumLookUp(type)})`);
                console.log("============================================");
                console.log(source);
                gl.deleteShader(shader);
                return null;
            }
        }
        */
        return shader;
    });
}

function createProgramWithShadersAsync(gl, shaders) {
    return promisify(() => {
        const shaderProgram = gl.createProgram();
        shaders.forEach(x => gl.attachShader(shaderProgram, x));
        gl.linkProgram(shaderProgram);

        /*
        if (DEBUG) {
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
                return null;
            }
        }

        shaders.forEach(x => gl.deleteShader(x));
        */
        return shaderProgram;
    });
}

async function createProgramAsync(gl, vsSource, fsSource) {
    const vertexShader = await loadShaderAsync(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = await loadShaderAsync(gl, gl.FRAGMENT_SHADER, fsSource);

    return createProgramWithShadersAsync(gl, [vertexShader, fragmentShader]);
}


function getUniformLocation(gl, shader, name) {
    return gl.getUniformLocation(shader, name);
}


function bindUniformBufferWithIndex(gl, ubo, index) {
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, index, ubo);
}

function createUniformBuffer(gl, size) {
    let ubo = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, size, gl.DYNAMIC_DRAW);
    return ubo;
}

function updateUniformBuffer(gl, ubo, data) {
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data);
}

function createTexture2d(gl, width, height, internalFormat, baseFormat, dataFormat, data) {
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, baseFormat, dataFormat, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return tex;
}

function createFBOWithTextureAttachment(gl, width, height, internalFormat, baseFormat, dataFormat) {
    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    let tex = createTexture2d(gl, width, height, internalFormat, baseFormat, dataFormat);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (DEBUG) {
        let completeness = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (completeness != gl.FRAMEBUFFER_COMPLETE) {
            console.log("FBO status check FAILED!: ", glReverseEnumLookUp(completeness));
        }
    }
    return { fbo: fbo, tex: tex };
}

function bindFBOAndSetViewport(gl, fbo, size) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    globalRenderState.gl.viewport(0, 0, size[0], size[1]);
}

function prependPrecisionAndVersion(src) {
    return `#version 300 es
precision highp float;
${src}`;
}