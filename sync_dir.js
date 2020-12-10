var watch = require('watch');
var fs = require('fs');
var opts = { ignoreDotFiles: true, ignoreDirectoryPattern: /node_modules/ };

function copy(from,to) {
  fs.createReadStream(from).pipe(fs.createWriteStream(to));
}

const PREFIX = '/koa-resteasy';

watch.createMonitor(PREFIX,opts,function(monitor) {
  monitor.on('created',function(f,stat) {
    console.log("Created: ",f);
  });
  monitor.on('changed',function(f,stat) {
    var to = '/koa-resteasy-local' + f.substring(PREFIX.length);
    console.log("Copied "+f+" to "+to);

    copy(f,to);
  });
})
