document.getElementById('sort').addEventListener('click', () => {
    sortTabs();
});
document.getElementById('group').addEventListener('click', () => {
    sortAndGroupTabs();
});
document.getElementById('ungroup').addEventListener('click', () => {
    ungroupTabs();
});
document.getElementById('notification_submit').addEventListener('click', () => {
    var time = document.getElementById('notification_time').value;
    var text = document.getElementById('notification_text').value;
    setTimeout(() => {new Notification('Time is up!', {body: text, icon: "icons/alarm36.png"})}, time * 1000);
});

function sortTabs() {
    chrome.tabs.query({}, (tabs) => {
        // 排序函数
        function sortTabsByHostname(a, b) {
            if (a.url && b.url) {
                return new URL(a.url).hostname.localeCompare(new URL(b.url).hostname);
            }
            return 0;
        }

        // 对标签页进行排序
        const sortedTabs = tabs.sort(sortTabsByHostname);
        sortedTabs.forEach((tab, index) => {
            chrome.tabs.move(tab.id, { index: index }
            )
        });
    });
}

function sortAndGroupTabs() {
    let map = new Map();
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (map.get(new URL(tab.url).hostname) === undefined) {
                map.set(new URL(tab.url).hostname, [tab.id]);
            } else {
                ids = map.get(new URL(tab.url).hostname);
                ids.push(tab.id);
            }
        });

        for (let [key, val] of map.entries()) {
            chrome.tabs.group({ tabIds: val }, (groupId) => {
                chrome.tabGroups.update(groupId, { title: key });
            })
        }
    });
}

function ungroupTabs() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.ungroup(tab.id)
        }
        );
    });
}
