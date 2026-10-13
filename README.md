# 银行升职记

从网点负责人到总行行长。虚构的「泰和银行」，真实的重庆地名。

五关：弹子石网点 → 南岸支行 → 万州分行 → 重庆分行 → 总行。每关有自己的经营面板，升职要过考察、测评、陈述、谈话、公示。一局约 90 分钟，22 个结局。

**在线玩**：https://lynch715.github.io/bank-career-simulator/

HTML 主文件配人物立绘资源，离线可玩，自动存档。手机上可以放到主屏幕。

## 目录

- `index.html`：游戏本体（由 `_build/build.sh` 拼出来，别直接改）
- `_build/src/`：分块源码
- `tests/`：回归测试，`cd tests && bash run-all.sh`（需要 Node；05、07 两组要 `npm install` 装 jsdom）
- `icon/`、`favicon.ico`、`site.webmanifest`、`sw.js`：图标、安装和离线

## 人物立绘

80 张透明立绘：70 张角色图、8 张随机客户范式、2 张玩家形象。员工、人脉、客户、排名、负责人和明确主体的事件使用固定身份映射；开局和菜单可选择玩家形象。点击员工或人物簿里的图片可以查看大图。

- 原图：`assets/portraits/source/`；内置 image_gen 制作，PNG 原图保留在本地美术目录。仓库提供运行 WebP、清单和出图提示词。
- 运行资源：`assets/portraits/web/`，完整立绘和头像缩略图各一份。
- 名单和出图提示词：`assets/portraits/inventory.json`、`production-prompts.json`、`style-prompts-v1.json`。
- 本地画册：`portraits.html`，可搜索人物并查看大图。

在保留 PNG 原图的本地美术目录中构建资源：`python3 _build/build_portraits.py`。然后执行 `bash _build/build.sh` 和 `cp index.html 银行升职记.html`。画册用 `python3 _build/portrait_overview.py` 重建。立绘回归检查：`node tests/14-portraits.js`。

复制或发布游戏时，请同时保留 `assets/portraits/web/` 与 `assets/portraits/precache.js`。首次联网访问并完成缓存后，所有角色图片可离线加载；存档仍使用原有键和版本。
