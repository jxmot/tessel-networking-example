/*
    A single place to control if calls to console.log() will
    produce any output.
*/
var con = function(log, trace) {
    if(log !== undefined && trace !== undefined) {
        con.conlog = log;
        con.contrace = trace;
    }
};

// default is - both are enabled
con.conlog = true;
con.contrace = true;

con.prototype.log = function(text) {
    if(con.conlog) {
        console.log(text);
    }
};

con.prototype.trace = function(text) {
    if(con.contrace || con.conlog) {
        console.log(text);
    }
};

module.exports = con;
