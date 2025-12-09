# 🎄 Magic Christmas Tree - 3D 实时手势交互系统

一个基于 Web 前端技术的 3D 互动实验项目。通过摄像头实时捕捉手势，控制 3D 粒子系统的聚合、扩散与交互，呈现出极具节日氛围的视觉体验。

![项目封面图](https://via.placeholder.com/800x400?text=Magic+Christmas+Tree+Screenshot)
*(建议替换为你的项目运行截图)*

## ✨ 功能特性

* **🖐 实时手势控制**:
    * **握拳 (Fist)**: 粒子聚合成一颗旋转的 3D 圣诞树。
    * **张开手掌 (Open Hand)**: 粒子爆炸式散开，形成漂浮的星云。
    * **捏合 (Pinch)**: 识别拇指与食指的捏合动作，从树中“抓取”照片并放大查看。
* **🎨 沉浸式视觉**:
    * 集成 **Three.js** 后处理 (Bloom/Glow)，实现唯美的光晕与反光效果。
    * 使用 **GSAP** 动画库，提供极致丝滑的过度动画。
* **🖼️ 自定义内容**:
    * 支持用户上传本地照片，照片会化作粒子实时混入 3D 场景中。

## 🛠️ 技术栈

* **渲染引擎**: [Three.js](https://threejs.org/)
* **计算机视觉**: [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) (Google)
* **动画引擎**: [GSAP (GreenSock)](https://greensock.com/)
* **语言**: HTML5 / JavaScript (ES6+)

## 🚀 如何运行 (How to Run)

⚠️ **重要提示**: 由于浏览器安全策略，摄像头权限必须在 **HTTPS** 或 **Localhost** 环境下才能通过。**不能直接双击打开 .html 文件**。

### 方法 1: 使用 VS Code (推荐)
1.  在 VS Code 中安装插件 **Live Server**。
2.  右键点击 `index.html`，选择 **Open with Live Server**。
3.  浏览器会自动打开，点击“允许”摄像头权限即可。

### 方法 2: 使用 Python
如果你安装了 Python，可以在项目根目录下运行终端命令：

```bash
# Python 3.x
python -m http.server
