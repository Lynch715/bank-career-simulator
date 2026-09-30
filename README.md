# 银行升职记

从网点负责人到总行行长。虚构的「泰和银行」，真实的重庆地名。

五关：弹子石网点 → 南岸支行 → 万州分行 → 重庆分行 → 总行。每关有自己的经营面板，升职要过考察、测评、陈述、谈话、公示。一局约 90 分钟，22 个结局。

**在线玩**：https://lynch715.github.io/bank-career-simulator/

单文件 HTML，离线可玩，自动存档。手机上可以放到主屏幕。

## 目录

- `index.html`：游戏本体（由 `_build/build.sh` 拼出来，别直接改）
- `_build/src/`：分块源码
- `tests/`：回归测试，`cd tests && bash run-all.sh`（需要 Node；05、07 两组要 `npm install` 装 jsdom）
- `icon/`、`favicon.ico`、`site.webmanifest`、`sw.js`：图标、安装和离线
