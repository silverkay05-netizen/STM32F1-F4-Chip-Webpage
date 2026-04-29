# STM32 Chip Atlas

一个可直接发布到 GitHub Pages 的静态站点，用来可视化浏览 STM32F103 / STM32F4 系列的内部结构、总线层级、常见型号映射和部分封装引脚信息。

## 特性

- 纯静态前端，无构建步骤，推到 GitHub 即可托管
- 支持按系列、型号和别名搜索芯片
- 展示内部总线、模块分布和寄存器预览
- 内置 Pin Explorer，可查看部分封装的引脚定义与复用功能
- 数据来源整理自 ST 官方参考手册、数据手册与 STM32CubeMX MCU 数据库

## 本地预览

直接打开 `index.html` 就可以查看，或者在项目根目录启动一个静态服务器：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080/`。

## 发布到 GitHub

1. 新建一个 GitHub 仓库
2. 把当前目录内容推送到仓库根目录
3. 在 GitHub 仓库的 `Settings -> Pages` 中把 Source 设置为 `GitHub Actions`
4. 推送到 `main` 或 `master` 分支后，仓库会自动部署

项目已经包含 `.github/workflows/deploy-pages.yml`，不需要额外构建工具。

## 数据更新

如果你本机安装了 STM32CubeMX，可以重新生成 `data-pinouts.js`：

```bash
node scripts/generate-pinouts.js --db-dir "C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeMX\db\mcu"
```

也可以通过环境变量传入路径：

```bash
set STM32_CUBEMX_DB_DIR=C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeMX\db\mcu
node scripts/generate-pinouts.js
```

可选参数：

- `--db-dir`：STM32CubeMX MCU XML 数据目录
- `--output`：输出文件路径，默认是 `data-pinouts.js`

## 仓库结构

- `index.html`：页面入口
- `styles.css`：页面样式
- `app.js`：交互逻辑
- `data-f103.js`：STM32F103 系列数据
- `data-f4.js`：STM32F4 系列数据
- `data-pinouts.js`：引脚数据
- `scripts/generate-pinouts.js`：引脚数据生成脚本

## 说明

这是一个静态展示项目，不依赖 Node 包管理器或前端框架。页面资源全部使用相对路径，既可以托管在自定义域名根目录，也可以托管在 GitHub Pages 的仓库子路径下。

如果你准备把仓库作为开源项目长期公开，建议再补一个你认可的 `LICENSE` 文件；这一步我没有替你默认选择。
