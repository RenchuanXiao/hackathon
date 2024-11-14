const express = require('express');
const app = express();

app.get('/', (req, res) => {
    console.log('收到请求:', {
        headers: req.headers,
        url: req.url
    });
    
    res.send(`
        <h1>测试页面</h1>
        <p>时间: ${new Date().toISOString()}</p>
        <p>请求头: ${JSON.stringify(req.headers, null, 2)}</p>
    `);
});

app.listen(8080, () => {
    console.log('测试服务器运行在 http://localhost:8080');
}); 