const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

// 基础配置
app.use(cors());
app.use(morgan('dev'));

// 添加请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 存储代理规则
let proxyRules = [];

// 测试接口
app.get('/test', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        rules: proxyRules
    });
});

// 更新规则接口
app.post('/update-rules', (req, res) => {
    try {
        const { rules } = req.body;
        if (!Array.isArray(rules)) {
            throw new Error('规则必须是数组');
        }
        proxyRules = rules;
        console.log('规则已更新:', JSON.stringify(proxyRules, null, 2));
        res.json({ success: true, rules: proxyRules });
    } catch (error) {
        console.error('更新规则失败:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// 查找匹配规则
function findMatchingRule(hostname) {
    return proxyRules.find(rule => {
        const pattern = rule.source
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(hostname);
    });
}

// 创建代理中间件
function createProxy(target) {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        secure: false,
        ws: true,
        xfwd: true,
        followRedirects: true,
        onProxyReq: (proxyReq, req, res) => {
            // 保持原始路径
            const originalUrl = req.originalUrl || req.url;
            proxyReq.path = originalUrl;

            // 处理请求头
            if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }

            // 处理请求体
            if (req.body && Object.keys(req.body).length > 0) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }

            console.log('代理请求:', {
                target,
                path: proxyReq.path,
                method: proxyReq.method,
                headers: proxyReq.getHeaders(),
                body: req.body
            });
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log('代理响应:', {
                statusCode: proxyRes.statusCode,
                headers: proxyRes.headers
            });
        },
        onError: (err, req, res) => {
            console.error('代理错误:', err);
            res.status(500).json({
                error: '代理错误',
                message: err.message
            });
        },
        logLevel: 'debug',
        logProvider: () => console
    });
}

// 请求处理中间件
app.use((req, res, next) => {
    // 跳过内部 API
    if (req.path === '/test' || req.path === '/update-rules') {
        return next();
    }

    const host = req.headers.host;
    if (!host) {
        return next();
    }

    console.log('\n=== 收到新请求 ===', {
        url: req.url,
        method: req.method,
        host: host,
        headers: req.headers
    });

    const fullHost = host.includes(':') ? host : `${host}:80`;
    const matchedRule = findMatchingRule(fullHost);

    if (matchedRule) {
        console.log('使用代理规则:', matchedRule);
        const proxy = createProxy(matchedRule.target);
        return proxy(req, res, next);
    }

    console.log('未找到匹配规则:', fullHost);
    next();
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器错误',
        message: err.message
    });
});

// 启动服务器
const PORT = 12345;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`代理服务器运行在 http://127.0.0.1:${PORT}`);
});
