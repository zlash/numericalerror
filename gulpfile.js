const { watch } = require('gulp');
const { exec } = require('child_process');

function javascript(cb) {
    exec('./build-scripts/terser.sh src dist', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
}

exports.default = () => {
    watch('src/*.js', javascript);
}
