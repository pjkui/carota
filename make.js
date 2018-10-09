var webmake = require('webmake');
var compressor = require('node-minify');

webmake('src/carota.js',
    {
      output: 'carota-debug.js',
      sourceMap: true,
    },
    function(result) {
      if (!result) {
        console.log('All good');
      } else {
        console.log(result);
      }
    });

compressor.minify({
  compressor: 'uglifyjs',
  input: 'carota-debug.js',
  output: 'carota-min.js',
  callback: function(err, min) {
    if (err) {
      console.log(err);
    }
  },
});
