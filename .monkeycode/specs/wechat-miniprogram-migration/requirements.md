# Requirements Document - ChameleonUltraGUI 微信小程序迁移

## Introduction

将 Chameleon Ultra GUI（Flutter 跨平台应用）改编为微信小程序，保留原项目全部核心功能，重构 UI 为深色赛博科技风格（参考设计图），采用底部标签栏横向导航结构。

## Glossary

- **系统/小程序**: 微信小程序端 Chameleon Ultra GUI
- **设备**: Chameleon Ultra / Chameleon Lite 硬件（nRF BLE 芯片）
- **BLE**: 蓝牙低功耗，小程序通过 `wx.createBLEConnection` API 连接设备
- **卡槽 (Slot)**: 设备上的卡模拟槽位，未激活状态 8 个，激活后扩展至 80 个（软件层面），每个可配置不同类型
- **DFU**: Device Firmware Update，设备固件升级模式
- **HF**: High Frequency 高频（13.56MHz）
- **LF**: Low Frequency 低频（125kHz）
- **MIFARE Classic**: NXP 高频非接触式卡标准
- **NTAG/Ultralight**: NXP 高频 NFC 标签
- **卡库**: 本地存储已读取/创建的卡片数据
- **词典**: MIFARE Classic 密钥字典文件
- **NDEF**: NFC Data Exchange Format，NFC 标签数据交换格式

## Requirements

### Requirement 1: 底部标签栏导航

**User Story:** AS 普通用户, I want 通过底部标签栏切换页面, so that 快速在不同功能模块之间导航。

#### Acceptance Criteria

1. 系统 SHALL 提供底部标签栏，包含五个标签页：首页、卡槽管理、读卡、写卡、我的
2. 系统 SHALL 在每个标签图标下方显示标签名称文本
3. WHEN 用户点击标签，系统 SHALL 切换到对应页面并高亮当前标签图标
4. 底部标签栏 SHALL 始终可见（除 DFU 刷写页面外）
5. 标签图标 SHALL 使用线性图标风格，选中态使用青蓝色 `#3AD9F7`，未选中态使用灰蓝色 `#6D8090`
6. 底部标签栏背景 SHALL 为深蓝黑色 `#0A1322`，上方有微细亮线分隔
7. "我的"页面 SHALL 聚合展示：卡库入口、词典入口、设备设置入口、应用设置入口、固件更新入口、关于入口

---

### Requirement 2: 蓝牙设备连接

**User Story:** AS 普通用户, I want 通过蓝牙搜索并连接 Chameleon 设备, so that 与硬件建立通信。

#### Acceptance Criteria

1. 系统 SHALL 使用 `wx.openBluetoothAdapter` 初始化蓝牙适配器
2. WHEN 用户进入首页且未连接设备，系统 SHALL 自动开始扫描 nRF UART 服务（UUID: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`）和 DFU 服务（UUID: `FE59`）
3. 系统 SHALL 每 3 秒自动重新扫描（可配置开关）
4. 系统 SHALL 仅显示名称匹配 `ChameleonUltra`/`ChameleonLite`/`CU-`/`CL-` 的设备
5. `CU-`/`CL-` 前缀设备 SHALL 标记为 DFU 模式
6. WHEN 用户点击搜索到的设备，系统 SHALL 调用 `wx.createBLEConnection` 建立连接
7. 连接成功后系统 SHALL 订阅 UART TX 特征（UUID: `6E400002-...`）接收数据
8. 连接成功后系统 SHALL 向 UART RX 特征（UUID: `6E400003-...`）写入握手指令 `0x11ef03fb000000000200`
9. 如需 DFU 连接，系统 SHALL 订阅 DFU Control 特征（UUID: `8EC90001-...`）
10. 系统 SHALL 支持最多 5 次连接重试
11. 系统 SHALL 在连接中显示加载动画页面
12. IF 用户手动点击关闭或离开页面，系统 SHALL 调用 `wx.closeBLEConnection` 断开连接

---

### Requirement 3: 首页仪表板

**User Story:** AS 普通用户, I want 在首页看到设备状态和快捷操作入口, so that 快速了解设备信息并执行常用操作。

#### Acceptance Criteria

1. 系统 SHALL 在首页顶部显示当前连接设备名称和信号强度
2. 系统 SHALL 显示设备电池电量（通过 `getBatteryCharge` 命令）
3. 系统 SHALL 显示当前活跃卡槽编号和类型
4. 系统 SHALL 提供"读卡器模式"/"模拟器模式"一键切换按钮
5. 系统 SHALL 显示固件版本号（App Version + Git Version）
6. 系统 SHALL 提供卡槽快速切换控件（1-80 水平滑动选择器，带编号快速跳转）
7. 系统 SHALL 提供卡片式快捷入口网格：卡库管理、词典管理、固件更新、HF 嗅探、LF 嗅探、T55xx 清除、Mfkey32、日志查看
8. 首页 SHALL 使用深蓝黑色背景，卡片使用深蓝灰圆角卡片样式，青蓝色高亮数字

---

### Requirement 4: 卡槽管理

**User Story:** AS 普通用户, I want 查看和配置卡槽（未激活 8 个 / 已激活 80 个）, so that 管理不同卡模拟类型和状态。

#### Acceptance Criteria

1. 系统 SHALL 根据激活状态动态显示卡槽数量：未激活 8 个（2 列网格），已激活 80 个（4 列网格）
2. 每个卡槽卡片 SHALL 显示：编号、HF 类型、LF 类型、启用状态（青蓝色圆点=启用，灰色=禁用）
3. WHEN 用户点击卡槽卡片，系统 SHALL 进入卡槽详情页
4. 卡槽详情页 SHALL 允许设置 HF 标签类型（MIFARE Classic/Ultralight/NTAG 或关闭）
5. 卡槽详情页 SHALL 允许设置 LF 标签类型（EM410X/HID/Viking/关闭）
6. 卡槽详情页 SHALL 允许切换 HF/LF 启用状态
7. 卡槽详情页 SHALL 允许编辑卡槽昵称
8. 系统 SHALL 提供"导出卡槽数据"按钮
9. 系统 SHALL 提供"删除卡槽数据"按钮（含确认弹窗）
10. 卡槽管理页 SHALL 使用深色卡片网格布局，每个卡片带青蓝色边框和微弱外发光

---

### Requirement 5: 读卡功能

**User Story:** AS 普通用户, I want 使用 Chameleon 读取物理卡片, so that 获取卡片 ID 和存储数据。

#### Acceptance Criteria

1. WHEN 设备处于读卡器模式，系统 SHALL 扫描 HF ISO 14443A 标签
2. 系统 SHALL 显示扫描结果的 UID、SAK、ATQA、ATS 信息
3. 系统 SHALL 提供 MIFARE Classic 密钥检测交互界面（显示 80 个密钥检测进度）
4. 系统 SHALL 提供密钥恢复选项卡：Darkside / Nested / Static Nested / Hard Nested
5. 密钥恢复完成后系统 SHALL 读取全部扇区并显示数据
6. 系统 SHALL 支持 LF 标签扫描（EM410x、HID、Viking 等）
7. 系统 SHALL 提供"保存到卡库"按钮
8. UI SHALL 使用深色卡片展示读取结果，密钥矩阵使用网格方块（青蓝色=已找到，灰色=未找到，橙色=检测中）
9. 读卡进度 SHALL 使用青蓝色进度条

---

### Requirement 6: 写卡功能

**User Story:** AS 普通用户, I want 将卡库数据写入标签, so that 复制/克隆卡片。

#### Acceptance Criteria

1. WHEN 用户进入写卡页，系统 SHALL 从卡库加载可写入的卡片列表
2. 系统 SHALL 提供按标签类型筛选卡片的功能
3. WHEN 用户选择卡片后，系统 SHALL 显示卡片预览（UID、类型、数据块摘要）
4. 系统 SHALL 支持写入 MIFARE Classic（逐块写入含密钥）
5. 系统 SHALL 支持写入 MIFARE Ultralight / NTAG 标签
6. 系统 SHALL 支持 Value Block 增减值配置
7. 系统 SHALL 在写入过程中显示每块写入进度
8. 写入完成后系统 SHALL 显示成功提示（青蓝色对勾图标）
9. IF 写入失败，系统 SHALL 显示失败块编号和错误原因

---

### Requirement 7: 卡库管理

**User Story:** AS 普通用户, I want 浏览和管理已保存的卡片数据, so that 方便查找和重复使用。

#### Acceptance Criteria

1. 系统 SHALL 以列表形式展示已保存卡片，每项显示名称、类型、UID、保存日期
2. 系统 SHALL 提供按标签类型（MIFARE Classic/Ultralight/NTAG/LF）筛选卡片
3. 系统 SHALL 提供搜索框按名称/UID 搜索卡片
4. WHEN 用户点击卡片，系统 SHALL 进入卡片详情页
5. 卡片详情页 SHALL 显示：UID、ATQA/SAK、密钥、各扇区/块数据
6. 系统 SHALL 提供转储编辑器（块数据编辑、高亮分析）
7. 系统 SHALL 提供 NDEF 编辑器（NTAG/Ultralight）
8. 系统 SHALL 提供手动创建卡片功能（选择类型、填写 UID、配置密钥）
9. 系统 SHALL 提供删除卡片功能（含确认弹窗）
10. 系统 SHALL 支持词典浏览/编辑（MIFARE 密钥词典）

---

### Requirement 8: 固件更新

**User Story:** AS 普通用户, I want 更新设备固件, so that 获得最新功能和修复。

#### Acceptance Criteria

1. 系统 SHALL 在设备设置页提供"进入 DFU 模式"按钮
2. 系统 SHALL 提供"在线获取最新固件"选项（从 GitHub Releases 拉取）
3. 系统 SHALL 支持从微信文件选择器上传本地 ZIP 固件
4. 系统 SHALL 在 DFU 刷写过程中显示进度条
5. DFU 刷写时系统 SHALL 显示专用等待动画页面（全屏深色背景，中央青蓝色旋转动画）
6. 系统 SHALL 在刷写完成后提示用户重新连接设备
7. IF 固件下载或刷写失败，系统 SHALL 显示错误提示并允许重试

---

### Requirement 9: 工具集

**User Story:** AS 普通用户, I want 使用辅助工具, so that 进行高级分析和调试。

#### Acceptance Criteria

1. 系统 SHALL 提供词典下载器（从预设 URL 下载 MIFARE Classic 密钥词典）
2. 系统 SHALL 提供 HF 嗅探功能（实时显示嗅探数据，支持密钥恢复和导出）
3. 系统 SHALL 提供 LF 嗅探功能（显示波形可视化，支持解码和导出）
4. 系统 SHALL 提供 T55xx 密码清除器
5. 系统 SHALL 提供 Mfkey32 密钥检测功能
6. 系统 SHALL 提供日志查看器
7. 系统 SHALL 提供更新日志查看
8. 工具集页面 SHALL 使用卡片列表布局，每个工具用图标+名称+简要描述展示
9. 嗅探页面 SHALL 使用深色终端风格，数据用等宽字体绿色/青色显示

---

### Requirement 10: 设备设置

**User Story:** AS 普通用户, I want 调整设备参数, so that 定制硬件行为。

#### Acceptance Criteria

1. 系统 SHALL 提供动画模式设置（完整/最小/无/对称）
2. 系统 SHALL 提供休眠超时设置（5-60 秒滑块）
3. 系统 SHALL 提供按键 A 短按/长按配置（禁用/切换槽位/克隆 UID/电量显示）
4. 系统 SHALL 提供按键 B 短按/长按配置（同上）
5. 系统 SHALL 提供 BLE 配对开关
6. 系统 SHALL 提供 BLE 配对 6 位 PIN 码设置
7. 系统 SHALL 提供清除 BLE 绑定设备功能
8. 系统 SHALL 提供重置设备设置（含确认弹窗）
9. 系统 SHALL 提供出厂重置（含二次确认弹窗）
10. 设置页面 SHALL 在固件版本下方显示"芯片ID"，通过 CMD 1011（`getDeviceChipID`）获取，以十六进制字符串展示
11. "芯片ID" SHALL 在首次 BLE 连接成功时自动读取并缓存到本地存储（`wx.setStorageSync('device_chip_id', ...)`）
12. 设置页面 SHALL 使用分组列表布局，每组有青蓝色标题分隔线

---

### Requirement 11: 应用设置

**User Story:** AS 普通用户, I want 自定义应用外观和行为, so that 获得个性化体验。

#### Acceptance Criteria

1. 系统 SHALL 提供主题色彩选择（8 种主题色：默认青蓝/紫/蓝/绿/靛蓝/青柠/红/黄）
2. 系统 SHALL 提供自动扫描设备开关
3. 系统 SHALL 提供自动连接首个设备开关
4. 系统 SHALL 提供删除操作确认开关
5. 系统 SHALL 提供设置导出为 JSON 文件
6. 系统 SHALL 提供设置导入（从 JSON 文件或二维码扫描）
7. 系统 SHALL 提供关于页面（版本信息、开源许可）
8. 应用设置背景 SHALL 与设备设置保持一致的深色风格

---

### Requirement 12: 全局 UI 设计规范

**User Story:** AS 普通用户, I want 界面具有统一一致的视觉风格, so that 获得良好的使用体验。

#### Acceptance Criteria

1. 全局背景色 SHALL 为深蓝黑色 `#0A1322`
2. 卡片背景色 SHALL 为略亮的深蓝灰 `#142030`，带圆角 12px
3. 卡片边框 SHALL 为半透明蓝灰色 `#1F3B55`，1px 宽度
4. 卡片阴影 SHALL 为青蓝色外发光，模糊半径 8px
5. 主强调色 SHALL 为青蓝色 `#3AD9F7`
6. 辅助强调色 SHALL 为稍暗青蓝色 `#1FB7E5`
7. 警示/促销色 SHALL 为金黄色 `#F2B73D`
8. 成功色 SHALL 为绿色 `#2ECC71`
9. 错误色 SHALL 为红色 `#E74C3C`
10. 主标题文字 SHALL 为亮青白色 `#65E8FF`，字号 20px，字重 700
11. 正文文字 SHALL 为灰蓝色 `#A9B7C6`，字号 14px
12. 弱化文字 SHALL 为暗蓝灰色 `#6D8090`，字号 12px
13. 按钮 SHALL 使用圆角 8px，主按钮填充青蓝色，次按钮描边灰蓝色
14. 输入框 SHALL 使用深色背景、灰蓝边框、圆角 8px
15. 进度条 SHALL 使用青蓝色填充，深色背景轨道
16. 所有图标 SHALL 使用线性图标风格，统一 24px 尺寸

---

### Requirement 13: 卡片数据云端备份

**User Story:** AS 普通用户, I want 将读取到的卡片数据备份到云端服务器, so that 数据不会因本地清除而丢失。

#### Acceptance Criteria

1. WHEN 读卡完成并保存到卡库后，系统 SHALL 提供"备份到云端"按钮
2. 系统 SHALL 调用 `POST /api/backup` 接口，Content-Type 为 `application/json`
3. 请求体 SHALL 包含 `chip_id`（设备芯片 ID，通过 `getDeviceChipID` 命令获取）和 `cards` 数组
4. 每张卡片 SHALL 包含：`name`（卡片名）、`uid`（卡片 UID）、`tag_type`（标签类型）、`data`（数据数组）、`bin_data`（base64 编码的 .bin 字节流）
5. 系统 SHALL 在备份前通过 `wx.request` 发送请求，成功后显示 201 响应中的 `backup_id`
6. 备份过程 SHALL 显示青蓝色进度条
7. IF 网络不可用或服务器返回错误，系统 SHALL 显示错误提示并允许稍后重试
8. 卡库列表页 SHALL 显示每张卡片的备份状态（已备份/未备份），用不同图标标识

---

### Requirement 14: 设备激活

**User Story:** AS 普通用户, I want 输入激活码激活设备, so that 解锁全部 80 个卡槽。

#### Acceptance Criteria

1. 系统 SHALL 在"我的"页面提供"设备激活"入口
2. 系统 SHALL 在激活页面显示当前设备芯片 ID（CMD 1011 读取），并提供"复制"按钮
3. 系统 SHALL 提供 4 段式输入框（XXXX-XXXX-XXXX-XXXX），每段 4 位 Hex，自动跳段
4. 系统 SHALL 提供"激活"按钮
5. 激活码算法 SHALL 为：`SHA256(chipId + ":" + "CHAMELEON_ULTRA_2024")` 的前 16 位大写 Hex，格式 `XXXX-XXXX-XXXX-XXXX`
6. WHEN 用户点击"激活"，系统 SHALL 去掉输入分隔符，校验 16 位 Hex 格式，与算法值比对
7. IF 激活码匹配成功，系统 SHALL `wx.setStorageSync('app_activated', true)` 和 `wx.setStorageSync('app_activated_chip_id', chipId)`
8. 激活成功后 SHALL 弹出成功提示"激活成功，卡槽已扩展至 80 个"
9. IF 激活码不匹配，系统 SHALL 弹出"激活码无效"错误提示
10. 已激活状态下 SHALL 显示"已激活"状态标签（绿色），不再显示输入框
11. 未激活状态下卡槽数 SHALL 为 8 个，已激活后 SHALL 为 80 个
12. 已激活状态 SHALL 在全页面（卡槽管理、首页卡槽选择器）生效，动态调整槽位数
