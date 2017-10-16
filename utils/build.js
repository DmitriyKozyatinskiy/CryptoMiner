var webpack = require("webpack"),
    config = require("../webpack.config"),
    exec = require("child_process").exec;


require("./prepare");

delete config.chromeExtensionBoilerplate;

// webpack(
//   config,
//   function (err) { if (err) throw err; }
// );

var child = exec('webpack -p --define process.env.NODE_ENV="\"production\"" --progress --colors');
child.stdout.on('data', function(data) {
  console.log(data.toString());
});
child.stderr.on('data', function(data) {
  console.log(data.toString());
});
