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

110 张透明立绘：70 张原有角色图、38 张客户专属图、2 张玩家形象。客户姓名池逐人绑定，单局 40 位客户均有独立立绘，取消按职业和性别共用模板。员工、人脉、客户、排名、负责人和明确主体的事件使用固定身份映射；开局和菜单可选择玩家形象。点击员工或人物簿里的图片可以查看大图。旧存档按原有姓名直接识别，无需重开。

员工及各级负责人共 65 位，逐人核查身份和面部设计，其中 62 位使用第三版重制立绘。脸型、眼鼻比例、发际线、年龄、体态分别设计，不用人物参考图重复套脸；同一个人跨岗位仍保持同一身份。旧原图在本地保留，重制图以 `-v3.png` 区分。

- 原图：`assets/portraits/source/`；内置 image_gen 制作，PNG 原图保留在本地美术目录。仓库提供运行 WebP、清单和出图提示词。
- 运行资源：`assets/portraits/web/`，完整立绘和头像缩略图各一份。
- 名单和出图提示词：`assets/portraits/inventory.json`、`production-prompts.json`、`unique-customer-prompts-v2.json`、`leader-prompts-v3.json`、`style-prompts-v1.json`。8 张旧客户模板已退役，原始 PNG 保留本地。
- 本地画册：`portraits.html`，可搜索人物并查看大图。

在保留 PNG 原图的本地美术目录中构建资源：`python3 _build/build_portraits.py`。然后执行 `bash _build/build.sh` 和 `cp index.html 银行升职记.html`。画册用 `python3 _build/portrait_overview.py` 重建。立绘回归检查：`node tests/14-portraits.js`。

复制或发布游戏时，请同时保留 `assets/portraits/web/` 与 `assets/portraits/precache.js`。首次联网访问并完成缓存后，所有角色图片可离线加载；存档仍使用原有键和版本。
