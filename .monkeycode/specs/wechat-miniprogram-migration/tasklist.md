# 需求实施计划

- [ ] 1. 项目初始化与全局配置
  - 创建微信小程序项目骨架 `miniprogram/` 目录
  - 编写 `app.json`：配置底部 5 标签 tabBar（首页/卡槽管理/读卡/写卡/我的）、路由注册、窗口深色主题
    - tabBar 图标色 R12.5，选中 `#3AD9F7`，未选中 `#6D8090`，背景 `#0A1322`
  - 编写 `app.wxss`：全局深色赛博主题样式变量、页面背景 `#0A1322`、卡片 `.card` / 按钮 `.btn-primary` / `.btn-secondary` / 输入框 `.input-dark` / 进度条 `.progress-cyan` 等通用 class
  - 编写 `app.js`：初始化 `globalData`（设备连接状态、BLE 服务实例、主题色配置）
  - 编写 `theme/colors.js`：导出全部色值常量
  - 编写 `utils/constants.js`：BLE UUID、Chameleon 命令 ID 枚举（80+ 命令）、标签类型定义

- [ ] 2. 实现 BLE 蓝牙通信服务 (`services/ble.js`)
  - 封装 `wx.openBluetoothAdapter` 初始化、权限检测
  - 实现 `startScan / stopScan`，按 nRF UART / DFU 服务 UUID 过滤，2 秒超时，结果按名称 `ChameleonUltra`/`ChameleonLite`/`CU-`/`CL-` 匹配
    - R2.2, R2.3, R2.4, R2.5
  - 实现 `connect(deviceId, isDFU)`：建立连接 → 获取服务 → 订阅 UART TX 特征 → 写握手帧到 RX 特征
    - 内建最多 5 次自动重试
    - R2.6, R2.7, R2.8, R2.9, R2.10
  - 实现 DFU 连接分支：订阅 DFU Control 特征，建立 Firmware 写通道
    - R2.9
  - 实现 `disconnect()`：`wx.closeBLEConnection` + cleanup
    - R2.12
  - 实现 `sendCommand(cmdId, payload)`：写入 UART RX 特征（DFU 模式走 Firmware 特征）
  - 实现 `onDataReceived / onConnectionStateChanged` 回调注册
  - 单例模式：`app.globalData.bleService` 全局唯一实例
  - 连接状态管理：`idle → scanning → connecting → connected → disconnecting`

- [ ] 3. 实现命令协议编解码 (`services/protocol.js`)
  - 实现 `buildFrame(commandId, payload)`：按 `0x11 0xEF CMD_H CMD_L 0x00 LEN_H LEN_L ...data...` 格式构建 128 字节帧
  - 实现 `parseFrame(bytes)`：解析帧头、命令号、状态、长度、数据负载
  - 实现 `parseMultiFrameResponse(frames)`：合并多帧响应（按序号重组）
  - 导出 `Protocol.COMMANDS` 常量映射（命令名 → 命令 ID）
  - 引用 R2.7, R2.8

- [ ] 4. 实现本地存储服务 (`services/storage.js`)
  - 封装 `wx.setStorageSync / getStorageSync / removeStorageSync`
  - 存储键命名规范：`cards`, `dict:<name>`, `settings`, `device_settings`
  - 实现卡库 CRUD：`getCards(opt)`, `saveCard(data)`, `updateCard(id, data)`, `deleteCard(id)`，支持类型筛选和搜索
    - R7.1, R7.2, R7.3
  - 实现词典管理：`getDictionaries()`, `getDictionary(name)`, `saveDictionary(name, entries)`, `deleteDictionary(name)`
    - R7.10
  - 实现设置管理：`getSettings()`, `saveSettings(settings)`, `exportAll()`, `importAll(json)`
    - R11.5, R11.6

- [ ] 4.5 实现云端备份服务 (`services/backup.js`)
  - 实现 `backupCards(chipId, cards)`：调用 `wx.request` POST `/api/backup`，Content-Type `application/json`
    - 请求体格式：`{ chip_id, cards: [{ name, uid, tag_type, data, bin_data }] }`
    - 响应 201 返回 `{ message, backup_id }`，写入卡片 `backupId` 和 `isBackedUp` 字段
    - R13.2, R13.3, R13.4, R13.5
  - 实现 `getDeviceChipId()`：通过 `getDeviceChipID` 命令获取设备芯片 ID
    - R13.3
  - 实现 `generateBinData(card)`：生成卡片 .bin 字节流的 base64 编码
    - R13.4
  - 网络错误/服务器错误处理：catch 后返回错误信息，允许重试
    - R13.7
  - 备份进度回调支持
    - R13.6

- [ ] 5. 检查点 - 确认 BLE 服务、协议编解码、存储、备份服务核心逻辑完整

- [ ] 6. 实现通用 UI 组件
  - `components/card-slot/`：卡槽展示卡片组件（编号、HF/LF 类型、启用状态圆点、青蓝色边框发光）
    - R4.2, R4.10
  - `components/device-picker/`：BLE 设备扫描列表组件（设备名、信号强度、DFU 标记、点击连接）
    - R2.4, R2.5
  - `components/key-grid/`：MIFARE 密钥 80 位检测网格组件（青蓝=已找到，灰=未找到，橙=检测中）
    - R5.8
  - `components/progress-bar/`：青蓝色进度条组件
  - `components/loading-overlay/`：全屏深色加载覆盖层
  - `components/action-sheet/`：底部操作菜单组件（用于卡槽操作、删除确认等）
  - `components/icon/`：线性图标组件（基于 SVG path，支持 color/size 属性）

- [ ] 7. 实现底部导航与连接页框架
  - 在 `app.json` tabBar 中注册 5 页路由，配置对应的深色 tabBar 样式
    - R1.1, R1.2, R1.3, R1.5, R1.6
  - 首页作为 BLE 扫描/选择设备的入口：未连接时展示设备扫描列表，连接中展示加载动画
    - R2.11
  - 实现连接状态监听：`app.globalData.bleService.onConnectionStateChanged` 驱动全局 UI 更新

- [ ] 8. 实现首页仪表板 `pages/home/index`
  - 顶部设备状态卡片：设备名称、信号强度、电池电量（`getBatteryCharge`）、固件版本（`getAppVersion`/`getGitVersion`）
    - R3.1, R3.2, R3.5
  - 当前活跃卡槽信息卡片 + 1-80 水平滑动卡槽选择器（`setActiveSlot`）
    - R3.3, R3.6
  - "读卡器模式"/"模拟器模式"切换按钮组（`changeDeviceMode`）
    - R3.4
  - 快捷入口网格（2 列）：卡库管理、词典管理、固件更新、HF 嗅探、LF 嗅探、T55xx 清除、Mfkey32、日志查看
    - R3.7
  - 全部使用深蓝黑背景 + 深蓝灰圆角卡片 + 青蓝数字高亮
    - R3.8

- [ ] 9. 实现卡槽管理 `pages/slots/index` + `pages/slots/detail`
  - 列表页：4 列网格展示 80 卡槽卡片，每卡片显示编号/类型/启用圆点
    - R4.1, R4.2, R4.10
  - 详情页：卡槽 HF 类型选择器（MIFARE Classic/Ultralight/NTAG/关闭）、LF 类型选择器（EM410X/HID/Viking/关闭）
    - R4.4, R4.5
  - 详情页：HF/LF 启用状态开关
    - R4.6
  - 详情页：卡槽昵称编辑输入框
    - R4.7
  - 详情页底部：导出卡槽数据按钮 + 删除卡槽数据按钮（含确认弹窗）
    - R4.8, R4.9

- [ ] 10. 实现读卡页面 `pages/read/index`
  - HF 扫描区：显示 UID、SAK、ATQA、ATS 信息卡片
    - R5.1, R5.2
  - MIFARE Classic 密钥检测：80 格密钥矩阵 + 检测进度
    - R5.3, R5.8
  - 密钥恢复选项卡：Darkside / Nested / StaticNested / HardNested
    - R5.4
  - 密钥恢复后读取全部扇区数据展示
    - R5.5
  - LF 扫描区：EM410x/HID/Viking 等结果显示
    - R5.6
  - "保存到卡库"按钮 + "备份到云端"按钮
    - R5.7, R13.1
  - 备份：调用 `backupService.backupCards`，显示进度条，成功后显示 backup_id
    - R13.5, R13.6
  - 青蓝色进度条
    - R5.9

- [ ] 11. 实现写卡页面 `pages/write/index`
  - 卡库列表：从 storage 加载卡片，支持按类型筛选
    - R6.1, R6.2
  - 卡片预览区：选中后展示 UID、类型、数据块摘要
    - R6.3
  - MIFARE Classic 写入：逐块写入含密钥，显示块进度
    - R6.4, R6.7
  - Ultralight/NTAG 写入
    - R6.5
  - Value Block 配置
    - R6.6
  - 写入成功/失败提示
    - R6.8, R6.9

- [ ] 12. 检查点 - 确认连接、卡槽、读卡、写卡核心流程完整

- [ ] 13. 实现我的页面 `pages/mine/index`
  - 聚合入口列表：卡库管理、词典管理、设备设置、应用设置、固件更新、设备激活、关于
    - R1.7
  - 每个入口使用图标+名称+箭头的列表项样式

- [ ] 14. 实现卡库管理 `pages/cards/index` + `pages/cards/detail` + `pages/cards/create`
  - 列表页：卡片列表（名称/类型/UID/日期/备份状态图标）、类型筛选、搜索框
    - R7.1, R7.2, R7.3, R13.8
  - 列表页支持批量选择卡片后一键备份到云端
    - R13.1
  - 详情页：UID、ATQA/SAK、密钥、扇区/块数据、备份信息展示
    - R7.5
  - 创建页：类型选择、UID 填写、密钥配置表单
    - R7.8
  - 删除功能（含确认弹窗）
    - R7.9

- [ ] 15. 实现转储编辑器与 NDEF 编辑器 `pages/cards/editor` + `pages/cards/ndef`
  - 转储编辑器：MIFARE Classic 扇区/块数据的可编辑网格，高亮分析，保存修改
    - R7.6
  - NDEF 编辑器：编辑 NTAG/Ultralight 的 NDEF 记录（URI/文本/Smart Poster），保存到卡片数据
    - R7.7

- [ ] 16. 实现词典管理 `pages/dictionary/index` + `pages/dictionary/edit`
  - 词典列表：已下载的密钥词典文件列表
    - R7.10
  - 词典编辑：行级密钥编辑，添加/删除条目
    - R7.10

- [ ] 17. 实现设备设置 `pages/settings/device`
  - 顶部固件更新区块：固件版本号、Git 版本显示
    - 芯片 ID 展示行：发送 CMD 1011（`getDeviceChipID`）获取设备芯片 ID，以十六进制字符串显示，保存到 `wx.Storage` 的 `device_chip_id` key
    - 芯片 ID 首次 BLE 连接后自动读取并缓存
  - "进入 DFU 模式"按钮
    - R10.1
  - 休眠超时：滑块 5-60 秒
    - R10.2
  - 按键 A 短按/长按配置：5 选项（禁用/向前切换/向后切换/克隆UID/电量）
    - R10.3
  - 按键 B 短按/长按配置：同上
    - R10.4
  - BLE 配对开关 + PIN 码输入
    - R10.5, R10.6
  - 清除 BLE 绑定按钮
    - R10.7
  - 重置设备设置（含确认弹窗）
    - R10.8
  - 出厂重置（含二次确认弹窗，红色警告样式）
    - R10.9
  - 分组列表布局 + 青蓝色标题分隔线

- [ ] 17.5 实现设备激活 `pages/activation/index`
  - 实现 `services/activation.js`：`generateCode(chipId)`、`formatCode(code)`、`validate(chipId, inputCode)`、`isActivated()`、`saveActivation(chipId)`、`getEffectiveSlotCount()`
    - R14.5
  - 激活页面：显示芯片 ID + 复制按钮（`wx.setClipboardData`）
    - R14.2
  - 4 段式输入框（XXXX-XXXX-XXXX-XXXX），自动跳段焦点
    - R14.3
  - 激活按钮 + 验证逻辑
    - R14.4, R14.6
  - 已激活状态：显示"已激活"绿色标签，隐藏输入框
    - R14.10
  - 成功/失败提示
    - R14.8, R14.9
  - 全局生效：`getEffectiveSlotCount()` 被首页选择器、卡槽管理页引用
    - R14.11, R14.12

- [ ] 18. 实现应用设置 `pages/settings/app`
  - 主题色彩：8 色圆点选择器
    - R11.1
  - 自动扫描 / 自动连接 / 确认删除 开关
    - R11.2, R11.3, R11.4
  - 设置导出（JSON 文件）/ 设置导入（JSON 文件或扫码）
    - R11.5, R11.6
  - 深色背景一致
    - R11.8

- [ ] 19. 实现固件更新 `pages/dfu/index`
  - "进入 DFU 模式"按钮（发送 `enterBootloader` 命令）
    - R8.1
  - "在线获取最新固件"：从 GitHub Releases API 拉取固件列表
    - R8.2
  - 本地固件选择：`wx.chooseMessageFile` 选择 ZIP 文件
    - R8.3
  - DFU 刷写进度条 + 全屏等待动画（深色背景 + 青蓝旋转动画）
    - R8.4, R8.5
  - 刷写完成/失败提示
    - R8.6, R8.7

- [ ] 20. 实现工具集页面集合 `pages/tools/*`
  - `tools/hf-sniff`：HF 嗅探页面（深色终端风格，等宽字体，数据用绿色/青色显示，密钥恢复+导出）
    - R9.2, R9.9
  - `tools/lf-sniff`：LF 嗅探页面（波形可视化 Canvas 绘制，解码+导出）
    - R9.3, R9.9
  - `tools/dict-download`：词典下载器（从预设 URL 下载密钥词典文件）
    - R9.1
  - `tools/t55xx`：T55xx 密码清除器
    - R9.4
  - `tools/mfkey32`：Mfkey32 密钥检测
    - R9.5
  - `tools/logs`：日志查看器（深色终端风格列表）
    - R9.6
  - `tools/changelog`：更新日志查看（从 GitHub Releases 拉取 Markdown 渲染）
    - R9.7

- [ ] 21. 实现关于页面 `pages/about/index`
  - 版本信息展示（从 `app.json` 读取 version）
    - R11.7
  - 开源许可文本展示
    - R11.7

- [ ] 22. 实现 BLE 连接权限与错误处理
  - 蓝牙未开启时引导用户开启（`wx.openBluetoothAdapter` 失败 → `wx.openSystemBluetoothSetting`）
  - 扫描超时显示空状态页
  - 连接失败自动重试 5 次，最终失败显示错误提示和重试按钮
  - 命令 5 秒超时处理（Promise.race）
  - 设备意外断开 → 弹出重连提示
  - DFU 刷写中断 → 显示恢复指引
  - 存储空间不足 → 提示清理数据

- [ ] 23. 检查点 - 全功能集成检查，确认所有页面可正常跳转，BLE 通信完整
