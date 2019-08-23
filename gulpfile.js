const { watch } = require('gulp');
const { exec } = require('child_process');

function javascript(cb) {
    exec('./build-scripts/terser.sh src dist', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
}

function shaders(cb) {
    exec('./build-scripts/minify_glsl.sh src/shaders src/shaders.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
}

exports.default = () => {
    watch('src/**/*.js', javascript);
    watch(['src/shaders/**/*.vert','src/shaders/**/*.frag'],shaders);
}
