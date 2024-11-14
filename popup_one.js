let rules = [];

// 渲染规则列表
function renderRules() {
  const rulesListElement = document.getElementById('rulesList');
  rulesListElement.innerHTML = '';

  rules.forEach((rule, index) => {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'rule-item';
    ruleDiv.innerHTML = `
      <input type="text" class="source" placeholder="源地址 (例如: example.com)" value="${rule.source || ''}">
      <input type="text" class="target" placeholder="目标地址 (例如: http://localhost:8080)" value="${rule.target || ''}">
      <button class="delete-btn" data-index="${index}">删除</button>
    `;
    rulesListElement.appendChild(ruleDiv);
  });

  // 添加删除按钮事件监听
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      rules.splice(index, 1);
      renderRules();
    });
  });
}

// 收集当前规则
function collectRules() {
  const newRules = [];
  document.querySelectorAll('.rule-item').forEach(item => {
    const source = item.querySelector('.source').value.trim();
    const target = item.querySelector('.target').value.trim();
    if (source && target) {
      newRules.push({ source, target });
    }
  });
  return newRules;
}

document.addEventListener('DOMContentLoaded', () => {
  // 加载已保存的配置
  chrome.storage.local.get(['rules', 'enabled'], (result) => {
    rules = result.rules || [];
    renderRules();
    
    const toggleBtn = document.getElementById('toggle');
    toggleBtn.textContent = result.enabled ? '禁用转发' : '启用转发';
  });

  // 添加规则
  document.getElementById('addRule').addEventListener('click', () => {
    rules.push({ source: '', target: '' });
    renderRules();
  });

  // 保存配置
  document.getElementById('save').addEventListener('click', () => {
    rules = collectRules();
    chrome.storage.local.set({ rules }, () => {
      alert('配置已保存');
      chrome.runtime.sendMessage({ type: 'UPDATE_RULES' });
    });
  });

  // 切换启用状态
  document.getElementById('toggle').addEventListener('click', (e) => {
    chrome.storage.local.get(['enabled'], (result) => {
      const enabled = !result.enabled;
      chrome.storage.local.set({ enabled }, () => {
        e.target.textContent = enabled ? '禁用转发' : '启用转发';
        alert(enabled ? '已启用转发' : '已禁用转发');
        chrome.runtime.sendMessage({ type: 'UPDATE_RULES' });
      });
    });
  });
}); 
