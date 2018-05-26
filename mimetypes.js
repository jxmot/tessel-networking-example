module.exports = (() => {
    var mime = {
        types : {
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.ico': 'image/x-icon',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.json': 'application/json',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml'
        }
    };
    return mime;
})();

