// 检查代理服务器是否运行
async function checkProxyServer() {
    try {
        const response = await fetch('http://127.0.0.1:12345/test');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('代理服务器状态:', data);
        return true;
    } catch (error) {
        console.error('代理服务器未运行:', error);
        return false;
    }
}

// 代理配置
async function setupProxy(enabled) {
    try {
        if (!enabled) {
            // 禁用代理
            await chrome.proxy.settings.clear({
                scope: 'regular'
            });
            console.log('代理已禁用');
            chrome.action.setBadgeText({ text: 'OFF' });
            return;
        }

        // 启用代理
        const config = {
            mode: "fixed_servers",
            rules: {
                singleProxy: {
                    scheme: "http",
                    host: "127.0.0.1",
                    port: 12345
                },
                bypassList: [] // 空列表，确保所有请求都经过代理
            }
        };

        await chrome.proxy.settings.set({
            value: config,
            scope: 'regular'
        });

        console.log('代理设置已更新');
        chrome.action.setBadgeText({ text: 'ON' });

        // 验证设置
        chrome.proxy.settings.get(
            {'incognito': false},
            function(config) {
                console.log('当前代理设置:', config);
            }
        );

    } catch (error) {
        console.error('设置代理失败:', error);
        chrome.action.setBadgeText({ text: 'ERR' });
    }
}

// 更新代理服务器规则
async function updateProxyRules(rules) {
    try {
        const response = await fetch('http://127.0.0.1:12345/update-rules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rules: rules || [] })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('规则更新结果:', result);
    } catch (error) {
        console.error('更新代理规则失败:', error);
        throw error;
    }
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_RULES') {
        (async () => {
            try {
                const { rules, enabled } = await chrome.storage.local.get(['rules', 'enabled']);
                console.log('更新代理设置:', { rules, enabled });
                
                if (enabled) {
                    await updateProxyRules(rules);
                }
                await setupProxy(enabled);
                
                sendResponse({ success: true });
            } catch (error) {
                console.error('处理更新请求失败:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }
});

// 初始化
chrome.runtime.onInstalled.addListener(async () => {
    try {
        const { rules, enabled } = await chrome.storage.local.get(['rules', 'enabled']);
        if (enabled) {
            await updateProxyRules(rules);
            await setupProxy(enabled);
        }
    } catch (error) {
        console.error('初始化失败:', error);
    }
});

// 监听代理错误
chrome.proxy.onProxyError.addListener((details) => {
    console.error('代理错误:', details);
});

// 处理代理认证
chrome.webRequest.onAuthRequired.addListener(
    function(details) {
        return {cancel: false};
    },
    {urls: ["<all_urls>"]},
    ["asyncBlocking"]
);