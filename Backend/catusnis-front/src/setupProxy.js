const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:8083',
            changeOrigin: true,
            secure: false,
            timeout: 300000,      
            proxyTimeout: 300000,
            // ✅ Ne pas modifier les headers — crucial pour multipart/form-data
            headers: {
                connection: 'keep-alive',
            },
            onProxyReq: function(proxyReq, req) {
                // ✅ Transmettre Authorization
                if (req.headers['authorization']) {
                    proxyReq.setHeader('Authorization', req.headers['authorization']);
                }
                // ✅ Préserver le Content-Type avec le boundary multipart
                if (req.headers['content-type']) {
                    proxyReq.setHeader('Content-Type', req.headers['content-type']);
                }
            },
        })
    );
};