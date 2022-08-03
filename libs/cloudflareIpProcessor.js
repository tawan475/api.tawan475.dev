const ipaddr = require("ipaddr.js");
const cloudflareIP = require('@tawan475/cloudflareip');
const cfIP = new cloudflareIP();

module.exports = (req, res, next) => {
    if (req.headers['cf-connecting-ip'] && cfIP.isCloudflareIP({ headers: { "x-incoming-ip": req.headers['cloudflare-ip']}})) {
        let realIP = ipaddr.process(req.headers['cf-connecting-ip']);
        let cloudflareip = ipaddr.process(req.headers['cloudflare-ip']);

        req.headers['from-cloudflare'] = true;
        req.headers['cloudflare-ip'] = cloudflareip;

        req.cloudflareip = cloudflareip.toString();
        req.cloudflareipver = cloudflareip.kind();

        req.trustedip = realIP.toString();
        req.trustedipver = realIP.kind();

        req.cloudflare = true;
    } else {
        let ip = ipaddr.process(req.socket.remoteAddress);
        req.trustedip = ip.toString();
        req.trustedipver = ip.kind();
    }
    next();
}