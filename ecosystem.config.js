module.exports = {
    apps: [{
        script: 'server.js',
        watch: '.',
        ignore_watch: ["log", "node_modules"],
        autorestart: true,
    }],
};
