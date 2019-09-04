function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (DEBUG) {
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            console.log("FAILED SHADER:");
            console.log("============================================");
            console.log(source);
            gl.deleteShader(shader);
            return null;
        }
    }

    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (DEBUG) {
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
    }

    return shaderProgram;
}

function createFenceSync(gl) {
    return gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
}

function waitOnFenceSync(gl, fence) {
    gl.clientWaitSync(fence, 0, 0);
    gl.deleteSync(fence);
}

function bindPackPBO(gl, pbo) {
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
}

function createPackPBO(gl, size) {
    const pbo = gl.createBuffer();
    bindPackPBO(gl, pbo);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, size, gl.STREAM_READ);
    if (DEBUG) {
        console.log("Created PBO of size ", gl.getBufferParameter(gl.PIXEL_PACK_BUFFER, gl.BUFFER_SIZE), " and usage ", gl.getBufferParameter(gl.PIXEL_PACK_BUFFER, gl.BUFFER_USAGE));
    }
    return pbo;
}

function createFBOWithTextureAttachment(gl, width, height, internalFormat, baseFormat, dataFormat) {
    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, baseFormat, dataFormat, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (DEBUG) {
        let completeness = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (completeness != gl.FRAMEBUFFER_COMPLETE) {
            console.log("FBO status check FAILED!: ", completeness.toString(16));
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