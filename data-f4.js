(function registerF4Family() {
  const atlas = window.CHIP_ATLAS = window.CHIP_ATLAS || { families: {} };

  const modules = {
    CORE_M4: {
      title: "Cortex-M4F",
      base: "0xE000E000+",
      accent: "var(--core)",
      lane: "Core",
      note: "Arm Cortex-M4 内核，带单精度 FPU。",
      description: "STM32F4 全系列围绕 Cortex-M4F 展开，核心侧同时承担 NVIC、SysTick、FPU 与调试跟踪等控制逻辑。",
      roles: "整数 / 浮点运算、异常响应、中断仲裁、系统节拍。",
      availability: "STM32F4 全系列。",
      detailNote: "从 F401 到 F469，F4 真正拉开差距的主要是总线层级、SRAM 组织和挂在矩阵后的专用外设。",
      registers: [
        { name: "CPUID", offset: "0xD00", desc: "核心标识" },
        { name: "ICSR", offset: "0xD04", desc: "异常状态" },
        { name: "AIRCR", offset: "0xD0C", desc: "优先级分组 / 软复位" },
        { name: "SYST_CSR", offset: "0x010", desc: "SysTick 控制" }
      ]
    },
    ART_FLASH: {
      title: "ART / Flash IF",
      base: "0x40023C00",
      accent: "var(--core)",
      lane: "Core",
      note: "Flash 接口与 ART Accelerator。",
      description: "F4 通过 ART 加速器、预取与等待周期控制，让高主频下的片上 Flash 取指保持效率。",
      roles: "取指加速、等待周期、缓存 / 预取。",
      availability: "STM32F4 全系列。",
      detailNote: "从 100MHz 到 180MHz 的差异，很大程度上依赖 Flash 接口和总线矩阵能否稳定支撑高带宽取指。",
      registers: [
        { name: "ACR", offset: "0x00", desc: "访问控制" },
        { name: "KEYR", offset: "0x04", desc: "解锁密钥" },
        { name: "SR", offset: "0x0C", desc: "状态寄存器" },
        { name: "CR", offset: "0x10", desc: "擦写控制" }
      ]
    },
    SRAM_F4: {
      title: "SRAM Fabric",
      base: "0x20000000 / 0x10000000",
      accent: "var(--core)",
      lane: "Core",
      note: "主 SRAM、可选 SRAM2 / CCM SRAM。",
      description: "F4 的内存层级比 F103 更复杂。不同子系列会在主 SRAM 之外增加 CCM SRAM、SRAM2、备份 SRAM 或更大的多段 RAM。",
      roles: "数据区、堆栈、DMA 缓冲、实时算法数据区。",
      availability: "子系列之间差异明显。",
      detailNote: "像 F405/F407 的 64KB CCM SRAM、F469 的 384KB SRAM，都是 F4 结构模板划分的重要依据。",
      registers: [
        { name: "SRAM1", offset: "0x20000000", desc: "主 SRAM 区" },
        { name: "SRAM2", offset: "0x2001C000+", desc: "扩展 SRAM 区" },
        { name: "CCM", offset: "0x10000000", desc: "内核耦合 SRAM" },
        { name: "BKPSRAM", offset: "0x40024000", desc: "备份 SRAM" }
      ]
    },
    BOOT_DBG_F4: {
      title: "Boot / Debug",
      base: "System Memory / SWD / JTAG",
      accent: "var(--core)",
      lane: "Core",
      note: "系统存储器、选项字节与调试入口。",
      description: "F4 延续了系统 Bootloader、选项字节和 SWD / JTAG 带机体系，支持量产配置与在线调试。",
      roles: "启动切换、系统升级、调试下载。",
      availability: "全系列。",
      detailNote: "对开发者来说，最直观的还是 SWD 下载；对量产来说，则更多依赖 Bootloader 和选项字节。",
      registers: [
        { name: "OPTCR", offset: "0x14", desc: "选项字节控制" },
        { name: "OPTCR1", offset: "0x18", desc: "双 Bank 控制" },
        { name: "DBGMCU_IDCODE", offset: "0x00", desc: "调试芯片标识" }
      ]
    },
    RCC_F4: {
      title: "RCC",
      base: "0x40023800",
      accent: "var(--ahb)",
      lane: "AHB1",
      note: "F4 时钟树与多总线门控中心。",
      description: "F4 的 RCC 除了 HSI / HSE / PLL 外，还会牵涉 PLLI2S、PLLSAI 以及 AHB1 / AHB2 / AHB3 / APB1 / APB2 多级门控。",
      roles: "系统时钟、PLL、总线分频、门控与复位。",
      availability: "全系列。",
      detailNote: "F4 的结构复杂度显著高于 F103，因此 RCC 的地位也更关键。",
      registers: [
        { name: "CR", offset: "0x00", desc: "时钟控制" },
        { name: "PLLCFGR", offset: "0x04", desc: "主 PLL 配置" },
        { name: "CFGR", offset: "0x08", desc: "总线时钟配置" },
        { name: "AHB1ENR", offset: "0x30", desc: "AHB1 门控" }
      ]
    },
    DMA_F4: {
      title: "DMA1 / DMA2",
      base: "0x40026000 / 0x40026400",
      accent: "var(--ahb)",
      lane: "AHB1",
      note: "双 DMA 控制器与更完整的数据搬运矩阵。",
      description: "F4 通过 DMA1 / DMA2 服务 ADC、SPI、USART、SDIO、DCMI、I2S 等高吞吐链路，是高主频设计的常见性能关键点。",
      roles: "外设流量搬运、双缓冲、FIFO、突发传输。",
      availability: "大部分 STM32F4 模板。",
      detailNote: "和 F103 比起来，F4 的 DMA 明显更像真正的总线协处理单元，而不只是简单搬运模块。",
      registers: [
        { name: "LISR", offset: "0x00", desc: "低流状态" },
        { name: "HISR", offset: "0x04", desc: "高流状态" },
        { name: "SxCR", offset: "0x10+", desc: "Stream 控制" },
        { name: "SxFCR", offset: "0x24+", desc: "FIFO 控制" }
      ]
    },
    GPIO_F4: {
      title: "GPIO A-K",
      base: "0x40020000+",
      accent: "var(--ahb)",
      lane: "AHB1",
      note: "F4 将 GPIO 全部挂到 AHB1。",
      description: "F4 的 GPIO 不再像 F1 那样挂在 APB2，而是整体放到 AHB1，配合更高吞吐的总线体系和更清晰的 MODER / AFR 结构。",
      roles: "数字 IO、复用功能、原子置位复位。",
      availability: "不同封装开放数量不同。",
      detailNote: "从 GPIO 的总线位置就能很直观地看出 F4 与 F1 在内部结构设计思路上的区别。",
      registers: [
        { name: "MODER", offset: "0x00", desc: "模式配置" },
        { name: "OTYPER", offset: "0x04", desc: "输出类型" },
        { name: "PUPDR", offset: "0x0C", desc: "上下拉配置" },
        { name: "AFRL", offset: "0x20", desc: "复用功能低位" }
      ]
    },
    USBFS_RNG: {
      title: "USB OTG FS / RNG",
      base: "0x50000000 / 0x50060800",
      accent: "var(--ahb)",
      lane: "AHB2",
      note: "全速 USB 与随机数单元常见于中高端模板。",
      description: "USB OTG FS 和 RNG 常常位于 F4 的 AHB2 层，是许多接入型和高性能型 F4 的标准组成。",
      roles: "USB 设备 / 主机、随机数生成。",
      availability: "多数 F4 子系列。",
      detailNote: "如果你在 F4 上做 USB 外设或安全启动，AHB2 上这组模块经常会参与进来。",
      registers: [
        { name: "GOTGCTL", offset: "0x000", desc: "OTG 总控" },
        { name: "GAHBCFG", offset: "0x008", desc: "AHB 配置" },
        { name: "RNG_CR", offset: "0x00", desc: "RNG 控制" },
        { name: "RNG_SR", offset: "0x04", desc: "RNG 状态" }
      ]
    },
    DCMI_SECURE: {
      title: "DCMI / CRYP / HASH",
      base: "0x50050000 / 0x50060000+",
      accent: "var(--ahb)",
      lane: "AHB2",
      note: "摄像头与安全扩展块。",
      description: "更高端的 F4 会在 AHB2 侧加入 DCMI、CRYP、HASH 等模块，用于图像采集与安全加速。",
      roles: "并行摄像头输入、硬件加解密、哈希计算。",
      availability: "F407/F417、F42x/F43x、F469/F479 等模板。",
      detailNote: "这一块通常意味着芯片已不再是单纯控制器，而开始面向图像、网络和安全场景。",
      registers: [
        { name: "DCMI_CR", offset: "0x00", desc: "摄像头控制" },
        { name: "DCMI_SR", offset: "0x04", desc: "采集状态" },
        { name: "CRYP_CR", offset: "0x00", desc: "加密控制" },
        { name: "HASH_CR", offset: "0x00", desc: "哈希控制" }
      ]
    },
    ETH_USBHS: {
      title: "ETH / USB OTG HS",
      base: "0x40028000 / 0x40040000",
      accent: "var(--ahb)",
      lane: "AHB1",
      note: "高速连接外设群。",
      description: "以 F407、F427、F429、F469 为代表的高端 F4 模板会在 AHB1 挂上以太网 MAC 和 USB OTG HS。",
      roles: "以太网通信、高速 USB、DMA 协同传输。",
      availability: "网络 / 图形型高端 F4。",
      detailNote: "这是 F4 真正进入网关、工业 HMI 和复杂数据处理应用的重要结构标志。",
      registers: [
        { name: "MACCR", offset: "0x0000", desc: "以太网 MAC 控制" },
        { name: "DMAOMR", offset: "0x1018", desc: "DMA 运行模式" },
        { name: "GOTGCTL", offset: "0x000", desc: "OTG HS 总控" },
        { name: "HCFG", offset: "0x400", desc: "主机配置" }
      ]
    },
    FMC_QSPI: {
      title: "FSMC / FMC / QSPI",
      base: "0xA0000000 / 0xA0001000",
      accent: "var(--ahb)",
      lane: "AHB3",
      note: "外扩存储与高速串行 Flash 接口。",
      description: "F4 的高阶模板会在 AHB3 加入 FSMC / FMC 或 Quad-SPI，让芯片能够连接外部 SDRAM、SRAM、NAND 甚至执行 XIP。",
      roles: "外扩存储、并口 LCD、QSPI Flash。",
      availability: "F412、F446、F42x/F43x、F46x/F47x 等模板。",
      detailNote: "当你看到 AHB3 上出现这组模块，通常就意味着这颗 F4 已经有较强的图形或大数据缓存潜力。",
      registers: [
        { name: "BCR1", offset: "0x00", desc: "Bank 控制" },
        { name: "BTR1", offset: "0x04", desc: "Bank 时序" },
        { name: "CR", offset: "0x00", desc: "QSPI 控制" },
        { name: "CCR", offset: "0x14", desc: "命令控制" }
      ]
    }
  };

  Object.assign(modules, {
    DMA2D_GFX: {
      title: "DMA2D / Chrom-ART",
      base: "0x4002B000",
      accent: "var(--ahb)",
      lane: "AHB1",
      note: "图形像素搬运与加速引擎。",
      description: "在 F427 / F429 / F469 等图形型 F4 中，DMA2D 负责像素填充、颜色格式转换与图层搬运。",
      roles: "图形加速、像素搬运、颜色转换。",
      availability: "F42x/F43x、F429/F439、F469/F479 模板。",
      detailNote: "如果你在做带 GUI 的板子，DMA2D 的存在会显著影响流畅度和 CPU 占用。",
      registers: [
        { name: "CR", offset: "0x00", desc: "DMA2D 控制" },
        { name: "ISR", offset: "0x04", desc: "中断状态" },
        { name: "FGMAR", offset: "0x0C", desc: "前景地址" },
        { name: "OMAR", offset: "0x3C", desc: "输出地址" }
      ]
    },
    LTDC: {
      title: "LTDC",
      base: "0x40016800",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "LCD-TFT 显示控制器。",
      description: "F429/F439 以及 F469/F479 会加入 LTDC，负责 RGB 显示时序、图层、窗口与同步控制。",
      roles: "TFT 时序、图层、窗口管理。",
      availability: "F429/F439、F469/F479。",
      detailNote: "LTDC 的加入意味着 F4 真正进入原生彩屏控制器范畴。",
      registers: [
        { name: "SSCR", offset: "0x08", desc: "同步尺寸配置" },
        { name: "BPCR", offset: "0x0C", desc: "后沿参数" },
        { name: "AWCR", offset: "0x10", desc: "活动区参数" },
        { name: "L1CR", offset: "0x84", desc: "图层 1 控制" }
      ]
    },
    DSI: {
      title: "MIPI DSI",
      base: "0x40016C00",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "MIPI DSI 主机接口。",
      description: "F469/F479 在 LTDC 之外进一步加入 DSI Host，用于更现代的显示链路。",
      roles: "DSI 包发送、显示链路控制。",
      availability: "F469/F479。",
      detailNote: "这是 F4 系列里最接近“多媒体 MCU”定位的一组显示扩展。",
      registers: [
        { name: "CR", offset: "0x00", desc: "DSI 控制" },
        { name: "CLCR", offset: "0x04", desc: "时钟车道控制" },
        { name: "PCR", offset: "0x2C", desc: "协议配置" },
        { name: "WCR", offset: "0x40", desc: "包封装控制" }
      ]
    },
    SYSCFG_EXTI: {
      title: "SYSCFG / EXTI",
      base: "0x40013800 / 0x40013C00",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "系统配置与外部中断路由。",
      description: "F4 用 SYSCFG 取代了 F1 的 AFIO，承接 EXTI 路由、内存映射和部分系统级开关。",
      roles: "EXTI 路由、系统配置、内存映射。",
      availability: "全系列。",
      detailNote: "如果你从 F103 切换到 F4，首先会感受到 AFIO 被 SYSCFG 替代了。",
      registers: [
        { name: "MEMRMP", offset: "0x00", desc: "内存重映射" },
        { name: "PMC", offset: "0x04", desc: "外设模式配置" },
        { name: "EXTICR1", offset: "0x08", desc: "EXTI 路由" },
        { name: "IMR", offset: "0x00", desc: "中断屏蔽" }
      ]
    },
    ADC_F4: {
      title: "ADC Fabric",
      base: "0x40012000+",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "单 ADC 到三 ADC 的模拟模板。",
      description: "F4 的模拟层级因子系列而异。F401/F410 以单 ADC 为主，F405/F407/F429 等更高端模板则拥有 ADC1~3 组合。",
      roles: "多通道采样、触发采集、DMA 模拟链路。",
      availability: "子系列不同，数量不同。",
      detailNote: "F4 的模拟资源差异比 F103 更大，尤其是 Access Line 和高端图形型之间。",
      registers: [
        { name: "SR", offset: "0x00", desc: "状态寄存器" },
        { name: "CR1", offset: "0x04", desc: "控制 1" },
        { name: "CR2", offset: "0x08", desc: "控制 2" },
        { name: "SQR1", offset: "0x2C", desc: "规则序列" }
      ]
    },
    TIM_ADV_F4: {
      title: "TIM1 / TIM8",
      base: "0x40010000 / 0x40010400",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "高级定时器组。",
      description: "F4 延续并强化了高级定时器体系，用于高质量 PWM、电机控制、同步采样和复杂时序。",
      roles: "高级 PWM、互补输出、刹车与同步。",
      availability: "多数 F4 子系列。",
      detailNote: "在高性能控制场景里，TIM1/TIM8 往往是 ADC 触发、PWM 输出和保护逻辑的中心。",
      registers: [
        { name: "CR1", offset: "0x00", desc: "基本控制" },
        { name: "CCMR1", offset: "0x18", desc: "输出比较模式" },
        { name: "CCER", offset: "0x20", desc: "输出使能" },
        { name: "BDTR", offset: "0x44", desc: "死区 / 刹车" }
      ]
    },
    FAST_IO: {
      title: "USART1/6 · SPIx · SDIO",
      base: "0x40011000+ / 0x40012C00",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "高速通信与高速同步外设。",
      description: "APB2 上通常聚集了 USART1/6、SPI1/4/5/6、SDIO、SAI 等更高速或更关键的接口。",
      roles: "高速串口、SPI / I2S、SDIO、音频扩展。",
      availability: "不同 F4 子系列数量不同。",
      detailNote: "F4 的 APB2 不只是“快一点的外设总线”，更像高性能接口集中区。",
      registers: [
        { name: "USART1_BRR", offset: "0x08", desc: "波特率配置" },
        { name: "SPI1_CR1", offset: "0x00", desc: "SPI 控制" },
        { name: "SDIO_CLKCR", offset: "0x04", desc: "SDIO 时钟控制" },
        { name: "SAI_xCR1", offset: "0x00", desc: "音频块控制" }
      ]
    },
    TIM_APB1: {
      title: "TIM2 ~ TIM14",
      base: "0x40000000+",
      accent: "var(--apb1)",
      lane: "APB1",
      note: "通用 / 基础定时器矩阵。",
      description: "F4 的 APB1 侧定时器数量丰富，覆盖通用定时、PWM、编码器、输入捕获与基础时基。",
      roles: "通用 PWM、捕获比较、时基与触发。",
      availability: "不同子系列数量不同。",
      detailNote: "如果你的应用需要很多路定时、捕获或 PWM，F4 的 APB1 定时器资源会非常宽裕。",
      registers: [
        { name: "CR1", offset: "0x00", desc: "控制寄存器" },
        { name: "SMCR", offset: "0x08", desc: "从模式控制" },
        { name: "PSC", offset: "0x28", desc: "预分频" },
        { name: "ARR", offset: "0x2C", desc: "自动重装载" }
      ]
    },
    COMM_APB1: {
      title: "USART / I2C / SPI",
      base: "0x40003800+ / 0x40004400+ / 0x40005400+",
      accent: "var(--apb1)",
      lane: "APB1",
      note: "大多数低速与中速通信接口聚集区。",
      description: "APB1 承载 USART2/3、UART4/5/7/8、SPI2/3/I2S、I2C1~4 等，是 F4 多通信拓扑的主战场。",
      roles: "串口矩阵、I2C 传感总线、SPI / I2S 外设链路。",
      availability: "不同子系列数量不同。",
      detailNote: "F413 一类模板之所以特别适合网关和协议桥，就是因为这里的通信矩阵非常厚实。",
      registers: [
        { name: "USART2_BRR", offset: "0x08", desc: "串口波特率" },
        { name: "UART4_CR1", offset: "0x0C", desc: "UART 控制" },
        { name: "I2C1_CR1", offset: "0x00", desc: "I2C 控制" },
        { name: "SPI2_I2SCFGR", offset: "0x1C", desc: "I2S 配置" }
      ]
    },
    AUDIO_EXT: {
      title: "SAI / DFSDM / SPDIFRX",
      base: "音频与传感扩展块",
      accent: "var(--apb1)",
      lane: "APB2 / APB1",
      note: "音频、滤波与特殊接口扩展。",
      description: "F412、F413、F446、F427 以及更高端 F4 会引入 SAI、DFSDM、SPDIFRX 等更专业的音频 / 传感接口。",
      roles: "音频流、数字滤波、特殊多媒体接口。",
      availability: "中高端与图形型 F4。",
      detailNote: "这一层通常表明芯片开始面向音频、传感融合或更专业的人机系统。",
      registers: [
        { name: "SAI_xCR1", offset: "0x00", desc: "音频块控制" },
        { name: "SAI_xFRCR", offset: "0x0C", desc: "帧配置" },
        { name: "DFSDM_CHCFGR1", offset: "0x00", desc: "通道配置" },
        { name: "SPDIFRX_CR", offset: "0x00", desc: "SPDIF 控制" }
      ]
    },
    CAN_DAC_PWR: {
      title: "CAN / DAC / PWR / RTC",
      base: "0x40006400 / 0x40007400 / 0x40007000",
      accent: "var(--apb1)",
      lane: "APB1",
      note: "控制、低功耗与模拟输出组合。",
      description: "更完整的 F4 模板会在 APB1 侧挂上 CAN、DAC、PWR、RTC 与后备域控制。",
      roles: "工业总线、模拟输出、低功耗管理、后备时间域。",
      availability: "大部分中高端 F4。",
      detailNote: "这组模块经常同时出现在工业控制、汽车电子和低功耗网关设计里。",
      registers: [
        { name: "CAN_MCR", offset: "0x00", desc: "CAN 主控制" },
        { name: "DAC_CR", offset: "0x00", desc: "DAC 控制" },
        { name: "PWR_CR", offset: "0x00", desc: "低功耗控制" },
        { name: "RTC_TR", offset: "0x00", desc: "时间寄存器" }
      ]
    },
    LOW_POWER_F4: {
      title: "PWR / RTC / BKP",
      base: "0x40007000 / 后备域",
      accent: "var(--apb1)",
      lane: "APB1",
      note: "轻量 F4 的低功耗与时间域。",
      description: "Access Line 和 Entry Line 的 APB1 通常会保留 PWR / RTC / 后备域，适合低功耗和唤醒逻辑。",
      roles: "待机 / 停机、RTC、后备域。",
      availability: "全系列。",
      detailNote: "即使是最小型的 F410 / F401，低功耗与 RTC 域也依然是完整设计中的重要部分。",
      registers: [
        { name: "PWR_CR", offset: "0x00", desc: "低功耗控制" },
        { name: "PWR_CSR", offset: "0x04", desc: "低功耗状态" },
        { name: "RTC_TR", offset: "0x00", desc: "RTC 时间" },
        { name: "RTC_DR", offset: "0x04", desc: "RTC 日期" }
      ]
    }
  });

  const layouts = {
    entry: [
      { label: "Core", subtitle: "M4F + ART + SRAM", accent: "var(--core)", items: [{ key: "CORE_M4", span: 3 }, { key: "ART_FLASH", span: 3 }, { key: "SRAM_F4", span: 3 }, { key: "BOOT_DBG_F4", span: 3 }] },
      { label: "AHB1", subtitle: "Main System Bus", accent: "var(--ahb)", items: [{ key: "RCC_F4", span: 3 }, { key: "DMA_F4", span: 4 }, { key: "GPIO_F4", span: 5 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "SYSCFG_EXTI", span: 3 }, { key: "ADC_F4", span: 3 }, { key: "TIM_ADV_F4", span: 3 }, { key: "FAST_IO", span: 3 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 4 }, { key: "COMM_APB1", span: 4 }, { key: "LOW_POWER_F4", span: 4 }] }
    ],
    access: [
      { label: "Core", subtitle: "M4F + ART + SRAM", accent: "var(--core)", items: [{ key: "CORE_M4", span: 3 }, { key: "ART_FLASH", span: 3 }, { key: "SRAM_F4", span: 3 }, { key: "BOOT_DBG_F4", span: 3 }] },
      { label: "AHB1", subtitle: "Main System Bus", accent: "var(--ahb)", items: [{ key: "RCC_F4", span: 3 }, { key: "DMA_F4", span: 4 }, { key: "GPIO_F4", span: 5 }] },
      { label: "AHB2", subtitle: "Access Extensions", accent: "var(--ahb)", items: [{ key: "USBFS_RNG", span: 12 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "SYSCFG_EXTI", span: 2 }, { key: "ADC_F4", span: 3 }, { key: "TIM_ADV_F4", span: 3 }, { key: "FAST_IO", span: 4 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 4 }, { key: "COMM_APB1", span: 4 }, { key: "LOW_POWER_F4", span: 4 }] }
    ],
    dynamic: [
      { label: "Core", subtitle: "M4F + ART + SRAM", accent: "var(--core)", items: [{ key: "CORE_M4", span: 3 }, { key: "ART_FLASH", span: 3 }, { key: "SRAM_F4", span: 3 }, { key: "BOOT_DBG_F4", span: 3 }] },
      { label: "AHB1", subtitle: "Main System Bus", accent: "var(--ahb)", items: [{ key: "RCC_F4", span: 3 }, { key: "DMA_F4", span: 4 }, { key: "GPIO_F4", span: 5 }] },
      { label: "AHB2", subtitle: "USB / Security Extensions", accent: "var(--ahb)", items: [{ key: "USBFS_RNG", span: 12 }] },
      { label: "AHB3", subtitle: "External Memory Bus", accent: "var(--ahb)", items: [{ key: "FMC_QSPI", span: 12 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "SYSCFG_EXTI", span: 2 }, { key: "ADC_F4", span: 2 }, { key: "TIM_ADV_F4", span: 2 }, { key: "FAST_IO", span: 3 }, { key: "AUDIO_EXT", span: 3 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COMM_APB1", span: 4 }, { key: "CAN_DAC_PWR", span: 3 }, { key: "LOW_POWER_F4", span: 2 }] }
    ],
    foundation: [
      { label: "Core", subtitle: "M4F + ART + SRAM", accent: "var(--core)", items: [{ key: "CORE_M4", span: 3 }, { key: "ART_FLASH", span: 3 }, { key: "SRAM_F4", span: 3 }, { key: "BOOT_DBG_F4", span: 3 }] },
      { label: "AHB1", subtitle: "Main System Bus", accent: "var(--ahb)", items: [{ key: "RCC_F4", span: 3 }, { key: "DMA_F4", span: 4 }, { key: "GPIO_F4", span: 5 }] },
      { label: "AHB2", subtitle: "USB Extensions", accent: "var(--ahb)", items: [{ key: "USBFS_RNG", span: 12 }] },
      { label: "AHB3", subtitle: "External Memory Bus", accent: "var(--ahb)", items: [{ key: "FMC_QSPI", span: 12 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "SYSCFG_EXTI", span: 2 }, { key: "ADC_F4", span: 2 }, { key: "TIM_ADV_F4", span: 2 }, { key: "FAST_IO", span: 3 }, { key: "AUDIO_EXT", span: 3 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COMM_APB1", span: 4 }, { key: "CAN_DAC_PWR", span: 3 }, { key: "LOW_POWER_F4", span: 2 }] }
    ],
    advanced: [
      { label: "Core", subtitle: "M4F + ART + SRAM", accent: "var(--core)", items: [{ key: "CORE_M4", span: 3 }, { key: "ART_FLASH", span: 3 }, { key: "SRAM_F4", span: 3 }, { key: "BOOT_DBG_F4", span: 3 }] },
      { label: "AHB1", subtitle: "Main System Bus", accent: "var(--ahb)", items: [{ key: "RCC_F4", span: 2 }, { key: "DMA_F4", span: 2 }, { key: "GPIO_F4", span: 3 }, { key: "ETH_USBHS", span: 3 }, { key: "DMA2D_GFX", span: 2 }] },
      { label: "AHB2", subtitle: "Camera / Security Bus", accent: "var(--ahb)", items: [{ key: "USBFS_RNG", span: 4 }, { key: "DCMI_SECURE", span: 8 }] },
      { label: "AHB3", subtitle: "External Memory Bus", accent: "var(--ahb)", items: [{ key: "FMC_QSPI", span: 12 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "SYSCFG_EXTI", span: 2 }, { key: "ADC_F4", span: 2 }, { key: "TIM_ADV_F4", span: 2 }, { key: "FAST_IO", span: 3 }, { key: "AUDIO_EXT", span: 3 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COMM_APB1", span: 4 }, { key: "CAN_DAC_PWR", span: 3 }, { key: "LOW_POWER_F4", span: 2 }] }
    ],
    netcam: [
      { label: "Core", subtitle: "M4F + ART + SRAM", accent: "var(--core)", items: [{ key: "CORE_M4", span: 3 }, { key: "ART_FLASH", span: 3 }, { key: "SRAM_F4", span: 3 }, { key: "BOOT_DBG_F4", span: 3 }] },
      { label: "AHB1", subtitle: "Main System Bus", accent: "var(--ahb)", items: [{ key: "RCC_F4", span: 2 }, { key: "DMA_F4", span: 3 }, { key: "GPIO_F4", span: 3 }, { key: "ETH_USBHS", span: 4 }] },
      { label: "AHB2", subtitle: "Camera / Security Bus", accent: "var(--ahb)", items: [{ key: "USBFS_RNG", span: 4 }, { key: "DCMI_SECURE", span: 8 }] },
      { label: "AHB3", subtitle: "External Memory Bus", accent: "var(--ahb)", items: [{ key: "FMC_QSPI", span: 12 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "SYSCFG_EXTI", span: 2 }, { key: "ADC_F4", span: 2 }, { key: "TIM_ADV_F4", span: 2 }, { key: "FAST_IO", span: 3 }, { key: "AUDIO_EXT", span: 3 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COMM_APB1", span: 4 }, { key: "CAN_DAC_PWR", span: 3 }, { key: "LOW_POWER_F4", span: 2 }] }
    ],
    graphics: [
      { label: "Core", subtitle: "M4F + ART + SRAM", accent: "var(--core)", items: [{ key: "CORE_M4", span: 3 }, { key: "ART_FLASH", span: 3 }, { key: "SRAM_F4", span: 3 }, { key: "BOOT_DBG_F4", span: 3 }] },
      { label: "AHB1", subtitle: "Main System Bus", accent: "var(--ahb)", items: [{ key: "RCC_F4", span: 2 }, { key: "DMA_F4", span: 2 }, { key: "GPIO_F4", span: 3 }, { key: "ETH_USBHS", span: 3 }, { key: "DMA2D_GFX", span: 2 }] },
      { label: "AHB2", subtitle: "Camera / Security Bus", accent: "var(--ahb)", items: [{ key: "USBFS_RNG", span: 4 }, { key: "DCMI_SECURE", span: 8 }] },
      { label: "AHB3", subtitle: "External Memory Bus", accent: "var(--ahb)", items: [{ key: "FMC_QSPI", span: 12 }] },
      { label: "APB2", subtitle: "Display & Fast IO", accent: "var(--apb2)", items: [{ key: "LTDC", span: 3 }, { key: "SYSCFG_EXTI", span: 2 }, { key: "ADC_F4", span: 2 }, { key: "TIM_ADV_F4", span: 2 }, { key: "FAST_IO", span: 3 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COMM_APB1", span: 4 }, { key: "CAN_DAC_PWR", span: 3 }, { key: "LOW_POWER_F4", span: 2 }] }
    ],
    multimedia: [
      { label: "Core", subtitle: "M4F + ART + SRAM", accent: "var(--core)", items: [{ key: "CORE_M4", span: 3 }, { key: "ART_FLASH", span: 3 }, { key: "SRAM_F4", span: 3 }, { key: "BOOT_DBG_F4", span: 3 }] },
      { label: "AHB1", subtitle: "Main System Bus", accent: "var(--ahb)", items: [{ key: "RCC_F4", span: 2 }, { key: "DMA_F4", span: 2 }, { key: "GPIO_F4", span: 2 }, { key: "ETH_USBHS", span: 3 }, { key: "DMA2D_GFX", span: 3 }] },
      { label: "AHB2", subtitle: "Camera / Security Bus", accent: "var(--ahb)", items: [{ key: "USBFS_RNG", span: 4 }, { key: "DCMI_SECURE", span: 8 }] },
      { label: "AHB3", subtitle: "External Memory Bus", accent: "var(--ahb)", items: [{ key: "FMC_QSPI", span: 12 }] },
      { label: "APB2", subtitle: "Display & Fast IO", accent: "var(--apb2)", items: [{ key: "LTDC", span: 3 }, { key: "DSI", span: 3 }, { key: "TIM_ADV_F4", span: 2 }, { key: "FAST_IO", span: 4 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COMM_APB1", span: 4 }, { key: "CAN_DAC_PWR", span: 3 }, { key: "AUDIO_EXT", span: 2 }] }
    ]
  };

  const models = [
    {
      id: "f401",
      title: "STM32F401",
      short: "F401",
      aliases: ["F401", "STM32F401", "STM32F401CC", "STM32F401CE", "STM32F401RE", "STM32F401VC", "F401CCU6", "F401RET6"],
      heroTitle: "STM32F401xB/xC/xD/xE",
      subtitle: ["Arm Cortex-M4F", "84MHz", "128KB~512KB Flash", "64KB~96KB SRAM", "49~100 pins", "Access Line"],
      intro: "STM32F401 是 F4 的高性价比 Access Line 模板，强调 M4F 内核、USB OTG FS、SDIO 与较低功耗，非常适合从 F103 升级到 F4 的项目。",
      boardCopy: "它保留了 F4 的 M4F、ART 和 AHB1/2 结构，但外设规模明显比 F407/F429 更克制，是最适合做紧凑型高性能控制板的模板之一。",
      layout: "access",
      defaultModule: "RCC_F4",
      quickLabel: "F401",
      selectLabel: "STM32F401 · 84MHz · 128KB~512KB Flash · 64KB~96KB SRAM",
      catalogGroup: "Access / Entry",
      catalogTitle: "F401",
      catalogLines: ["84MHz M4F", "128KB~512KB Flash / 64KB~96KB SRAM", "USB OTG FS / SDIO / 单 ADC"],
      stats: [
        { label: "Core", value: "M4F", meta: "带单精度 FPU" },
        { label: "Clock", value: "84MHz", meta: "Access Line 主频" },
        { label: "Flash", value: "128KB~512KB", meta: "分 xB/xC/xD/xE 型号" },
        { label: "SRAM", value: "64KB~96KB", meta: "比 F103 主流型更宽裕" },
        { label: "Package", value: "49~100 pins", meta: "适合紧凑型高性能板" },
        { label: "Signature", value: "USB FS / SDIO", meta: "F4 入门升级模板" }
      ]
    },
    {
      id: "f410",
      title: "STM32F410",
      short: "F410",
      aliases: ["F410", "STM32F410", "STM32F410C8", "STM32F410CB", "STM32F410R8", "STM32F410RB", "F410CBT6"],
      heroTitle: "STM32F410x8/xB",
      subtitle: ["Arm Cortex-M4F", "100MHz", "64KB~128KB Flash", "32KB SRAM", "36~64 pins", "Entry F4"],
      intro: "STM32F410 是更小型、更精简的 F4 模板，主打 100MHz M4F、少引脚和低功耗，同时保留 F4 的总线和寄存器风格。",
      boardCopy: "它只有一层主 AHB 外设结构，特别适合把 F0/F1 项目升级到 M4F，但又不希望板级复杂度明显增加的场景。",
      layout: "entry",
      defaultModule: "RCC_F4",
      quickLabel: "F410",
      selectLabel: "STM32F410 · 100MHz · 64KB~128KB Flash · 32KB SRAM",
      catalogGroup: "Access / Entry",
      catalogTitle: "F410",
      catalogLines: ["100MHz M4F", "64KB~128KB Flash / 32KB SRAM", "极简 F4 入口模板"],
      stats: [
        { label: "Core", value: "M4F", meta: "带 FPU 的小型 F4" },
        { label: "Clock", value: "100MHz", meta: "高于 F401 的频率梯度" },
        { label: "Flash", value: "64KB~128KB", meta: "适合轻量固件" },
        { label: "SRAM", value: "32KB", meta: "小型系统与控制应用" },
        { label: "Package", value: "36~64 pins", meta: "适合空间敏感设计" },
        { label: "Signature", value: "Compact F4", meta: "最简 F4 结构模板" }
      ]
    },
    {
      id: "f411",
      title: "STM32F411",
      short: "F411",
      aliases: ["F411", "STM32F411", "STM32F411CC", "STM32F411CE", "STM32F411RE", "STM32F411VE", "F411CEU6", "F411RET6"],
      heroTitle: "STM32F411xC/xE",
      subtitle: ["Arm Cortex-M4F", "100MHz", "256KB~512KB Flash", "128KB SRAM", "49~100 pins", "Access Plus"],
      intro: "STM32F411 可以看作更强的 Access Line 模板，在 F401 的结构上进一步提高主频、RAM 与高速外设能力。",
      boardCopy: "它非常适合需要更多 RAM、更高主频但又不打算进入 F407/F429 那种大总线大封装复杂度的方案。",
      layout: "access",
      defaultModule: "RCC_F4",
      quickLabel: "F411",
      selectLabel: "STM32F411 · 100MHz · 256KB~512KB Flash · 128KB SRAM",
      catalogGroup: "Access / Entry",
      catalogTitle: "F411",
      catalogLines: ["100MHz M4F", "256KB~512KB Flash / 128KB SRAM", "USB FS / SDIO / 更多 SPI"],
      stats: [
        { label: "Core", value: "M4F", meta: "Access Line 强化版" },
        { label: "Clock", value: "100MHz", meta: "高于 F401" },
        { label: "Flash", value: "256KB~512KB", meta: "主流中型固件足够" },
        { label: "SRAM", value: "128KB", meta: "适合更复杂缓存" },
        { label: "Package", value: "49~100 pins", meta: "开发板与量产都常见" },
        { label: "Signature", value: "Balanced F4", meta: "Black Pill 常见升级目标" }
      ]
    },
    {
      id: "f412",
      title: "STM32F412",
      short: "F412",
      aliases: ["F412", "STM32F412", "STM32F412CG", "STM32F412ZG", "STM32F412VE", "F412RET6", "F412ZGT6"],
      heroTitle: "STM32F412",
      subtitle: ["Arm Cortex-M4F", "100MHz", "256KB~1MB Flash", "256KB SRAM", "48~144 pins", "Dynamic Access"],
      intro: "STM32F412 在 Access Line 基础上明显增强了内存、外部存储和特殊接口，是一类很有“向高端靠拢”倾向的 F4 模板。",
      boardCopy: "如果你既想保留相对克制的主频和功耗，又想拿到 FMC、Quad-SPI、更多串口和更大 SRAM，F412 是很典型的中间层结构。",
      layout: "dynamic",
      defaultModule: "RCC_F4",
      quickLabel: "F412",
      selectLabel: "STM32F412 · 100MHz · 256KB~1MB Flash · 256KB SRAM",
      catalogGroup: "Dynamic / Sensor",
      catalogTitle: "F412",
      catalogLines: ["100MHz M4F", "256KB~1MB Flash / 256KB SRAM", "FMC / QSPI / DFSDM 类扩展"],
      stats: [
        { label: "Core", value: "M4F", meta: "100MHz 动态扩展型" },
        { label: "Clock", value: "100MHz", meta: "重视平衡而非极限频率" },
        { label: "Flash", value: "256KB~1MB", meta: "容量跨度大" },
        { label: "SRAM", value: "256KB", meta: "明显高于 F401/F411" },
        { label: "Package", value: "48~144 pins", meta: "支持更大封装扩展" },
        { label: "Signature", value: "FMC / QSPI", meta: "外扩能力很强" }
      ]
    },
    {
      id: "f413",
      title: "STM32F413 / STM32F423",
      short: "F413/F423",
      aliases: ["F413", "STM32F413", "F423", "STM32F423", "STM32F413ZH", "STM32F423MH", "F413ZHT6"],
      heroTitle: "STM32F413 / STM32F423",
      subtitle: ["Arm Cortex-M4F", "100MHz", "up to 1.5MB Flash", "320KB SRAM", "64~144 pins", "Connectivity Rich"],
      intro: "STM32F413/F423 是通信与外设矩阵特别厚实的一支 F4 模板，面向协议网关、音频和复杂传感系统。",
      boardCopy: "这一模板最大的特点不是单项外设极限，而是大量串口、I2C、CAN、音频与滤波扩展同时在线，适合做“接口中枢”。",
      layout: "dynamic",
      defaultModule: "RCC_F4",
      quickLabel: "F413/F423",
      selectLabel: "STM32F413 / STM32F423 · 100MHz · up to 1.5MB Flash · 320KB SRAM",
      catalogGroup: "Dynamic / Sensor",
      catalogTitle: "F413 / F423",
      catalogLines: ["100MHz M4F", "up to 1.5MB Flash / 320KB SRAM", "多 UART / 多 CAN / 音频扩展"],
      stats: [
        { label: "Core", value: "M4F", meta: "接口导向型 F4" },
        { label: "Clock", value: "100MHz", meta: "重视资源而非频率堆叠" },
        { label: "Flash", value: "up to 1.5MB", meta: "大程序空间" },
        { label: "SRAM", value: "320KB", meta: "适合协议缓存和音频流" },
        { label: "Package", value: "64~144 pins", meta: "面向更复杂系统板" },
        { label: "Signature", value: "Heavy Comms", meta: "网关型 F4 模板" }
      ]
    },
    {
      id: "f405",
      title: "STM32F405 / STM32F415",
      short: "F405/F415",
      aliases: ["F405", "STM32F405", "F415", "STM32F415", "STM32F405RG", "STM32F415ZG", "F405RGT6", "F415ZGT6"],
      heroTitle: "STM32F405 / STM32F415",
      subtitle: ["Arm Cortex-M4F", "168MHz", "up to 1MB Flash", "192KB SRAM + 64KB CCM", "64~176 pins", "Foundation High-Perf"],
      intro: "STM32F405/F415 是经典高性能 F4 模板。它提供 168MHz 主频、CCM SRAM、双 DMA、USB OTG FS/HS 与外扩存储能力。",
      boardCopy: "F415 在 F405 的基础上加入安全加速。整体上，它们都是 F4 “真正高性能骨架”的起点。",
      layout: "advanced",
      defaultModule: "RCC_F4",
      quickLabel: "F405/F415",
      selectLabel: "STM32F405 / STM32F415 · 168MHz · up to 1MB Flash · 192KB+64KB CCM SRAM",
      catalogGroup: "Foundation / Connectivity",
      catalogTitle: "F405 / F415",
      catalogLines: ["168MHz M4F", "up to 1MB Flash / 192KB + 64KB CCM", "USB OTG FS/HS / FSMC 类扩展"],
      stats: [
        { label: "Core", value: "M4F", meta: "经典高性能 F4 起点" },
        { label: "Clock", value: "168MHz", meta: "进入真正高性能层级" },
        { label: "Flash", value: "up to 1MB", meta: "主流大固件足够" },
        { label: "SRAM", value: "192KB + 64KB CCM", meta: "实时算法与大缓存兼顾" },
        { label: "Package", value: "64~176 pins", meta: "从中型到大型板" },
        { label: "Signature", value: "USB HS / CCM", meta: "高性能基础模板" }
      ]
    },
    {
      id: "f407",
      title: "STM32F407 / STM32F417",
      short: "F407/F417",
      aliases: ["F407", "STM32F407", "F417", "STM32F417", "STM32F407VG", "STM32F417ZG", "F407VGT6", "F417ZGT6"],
      heroTitle: "STM32F407 / STM32F417",
      subtitle: ["Arm Cortex-M4F", "168MHz", "up to 1MB Flash", "192KB SRAM + 64KB CCM", "100~176 pins", "Net / Camera F4"],
      intro: "STM32F407/F417 在 F405 基础上继续加入 Ethernet MAC、DCMI 与更完整的高速连接能力，是很多经典工业与图形控制板的核心模板。",
      boardCopy: "F417 进一步加入安全加速。整体上，这一模板已经非常接近“综合型高端 MCU”的结构层级。",
      layout: "netcam",
      defaultModule: "RCC_F4",
      quickLabel: "F407/F417",
      selectLabel: "STM32F407 / STM32F417 · 168MHz · up to 1MB Flash · 192KB+64KB CCM SRAM",
      catalogGroup: "Foundation / Connectivity",
      catalogTitle: "F407 / F417",
      catalogLines: ["168MHz M4F", "up to 1MB Flash / 192KB + 64KB CCM", "ETH / DCMI / USB OTG HS"],
      stats: [
        { label: "Core", value: "M4F", meta: "经典 F4 高配模板" },
        { label: "Clock", value: "168MHz", meta: "长期主流高性能档" },
        { label: "Flash", value: "up to 1MB", meta: "适合中大型应用" },
        { label: "SRAM", value: "192KB + 64KB CCM", meta: "图像 / 网络缓冲更从容" },
        { label: "Package", value: "100~176 pins", meta: "高引脚外设型板卡常见" },
        { label: "Signature", value: "ETH / DCMI", meta: "工业与图像项目常见核心" }
      ]
    },
    {
      id: "f446",
      title: "STM32F446",
      short: "F446",
      aliases: ["F446", "STM32F446", "STM32F446RE", "STM32F446VE", "STM32F446ZE", "F446RET6", "F446ZET6"],
      heroTitle: "STM32F446",
      subtitle: ["Arm Cortex-M4F", "180MHz", "256KB~512KB Flash", "128KB SRAM", "64~144 pins", "Fast Mixed-Signal"],
      intro: "STM32F446 是一类非常平衡的高速 F4 模板，提供 180MHz 主频、丰富音频接口、FMC / QSPI 与摄像头能力，但整体复杂度又低于 F429/F469。",
      boardCopy: "如果你需要更高频率、更强音频或外部存储能力，但不一定需要 LTDC / DSI，这个模板通常非常合适。",
      layout: "foundation",
      defaultModule: "RCC_F4",
      quickLabel: "F446",
      selectLabel: "STM32F446 · 180MHz · 256KB~512KB Flash · 128KB SRAM",
      catalogGroup: "Foundation / Connectivity",
      catalogTitle: "F446",
      catalogLines: ["180MHz M4F", "256KB~512KB Flash / 128KB SRAM", "FMC / QSPI / SAI / SPDIFRX"],
      stats: [
        { label: "Core", value: "M4F", meta: "180MHz 高速 F4" },
        { label: "Clock", value: "180MHz", meta: "比 F405/F407 更高" },
        { label: "Flash", value: "256KB~512KB", meta: "中大规模应用" },
        { label: "SRAM", value: "128KB", meta: "配合高速外设足够灵活" },
        { label: "Package", value: "64~144 pins", meta: "Nucleo 常见核心料号" },
        { label: "Signature", value: "Audio + FMC", meta: "高频平衡模板" }
      ]
    },
    {
      id: "f427",
      title: "STM32F427 / STM32F437",
      short: "F427/F437",
      aliases: ["F427", "STM32F427", "F437", "STM32F437", "STM32F427VG", "STM32F437ZG", "F427VGT6", "F437ZGT6"],
      heroTitle: "STM32F427 / STM32F437",
      subtitle: ["Arm Cortex-M4F", "180MHz", "up to 2MB dual-bank Flash", "256KB SRAM", "100~176 pins", "Advanced Graphics Base"],
      intro: "STM32F427/F437 是高端 F4 的图形与外扩基础模板。它带来 180MHz 主频、2MB 级双 Bank Flash、Chrom-ART 与更完整的大总线结构。",
      boardCopy: "F437 在 F427 基础上增加安全加速。它们适合做更复杂的人机界面、网关和带外扩存储的控制平台。",
      layout: "foundation",
      defaultModule: "DMA2D_GFX",
      quickLabel: "F427/F437",
      selectLabel: "STM32F427 / STM32F437 · 180MHz · up to 2MB Flash · 256KB SRAM",
      catalogGroup: "Graphics / Display",
      catalogTitle: "F427 / F437",
      catalogLines: ["180MHz M4F", "up to 2MB Flash / 256KB SRAM", "Chrom-ART / ETH / FMC / DCMI"],
      stats: [
        { label: "Core", value: "M4F", meta: "高端 F4 图形底座" },
        { label: "Clock", value: "180MHz", meta: "图形与大带宽友好" },
        { label: "Flash", value: "up to 2MB", meta: "双 Bank 结构" },
        { label: "SRAM", value: "256KB", meta: "支撑更复杂 GUI 与协议" },
        { label: "Package", value: "100~176 pins", meta: "高端主控板卡常见" },
        { label: "Signature", value: "Chrom-ART", meta: "图形基础模板" }
      ]
    },
    {
      id: "f429",
      title: "STM32F429 / STM32F439",
      short: "F429/F439",
      aliases: ["F429", "STM32F429", "F439", "STM32F439", "STM32F429ZI", "STM32F439IG", "F429ZIT6", "F439IGT6"],
      heroTitle: "STM32F429 / STM32F439",
      subtitle: ["Arm Cortex-M4F", "180MHz", "512KB~2MB dual-bank Flash", "256KB SRAM", "100~216 pins", "Native TFT F4"],
      intro: "STM32F429/F439 在高端 F4 结构上加入 LTDC，使其成为原生 RGB TFT 显示控制模板；F439 进一步叠加安全加速能力。",
      boardCopy: "它非常适合带彩屏的人机界面、工业控制终端、仪表和中型图形系统。",
      layout: "graphics",
      defaultModule: "LTDC",
      quickLabel: "F429/F439",
      selectLabel: "STM32F429 / STM32F439 · 180MHz · 512KB~2MB Flash · 256KB SRAM",
      catalogGroup: "Graphics / Display",
      catalogTitle: "F429 / F439",
      catalogLines: ["180MHz M4F", "512KB~2MB Flash / 256KB SRAM", "LTDC / DMA2D / ETH / FMC"],
      stats: [
        { label: "Core", value: "M4F", meta: "原生 TFT F4 模板" },
        { label: "Clock", value: "180MHz", meta: "高端图形处理档" },
        { label: "Flash", value: "512KB~2MB", meta: "支持更大的 GUI 固件" },
        { label: "SRAM", value: "256KB", meta: "配合 LTDC / DMA2D 使用" },
        { label: "Package", value: "100~216 pins", meta: "面向大板级系统" },
        { label: "Signature", value: "LTDC + DMA2D", meta: "彩屏人机界面核心" }
      ]
    },
    {
      id: "f469",
      title: "STM32F469 / STM32F479",
      short: "F469/F479",
      aliases: ["F469", "STM32F469", "F479", "STM32F479", "STM32F469NI", "STM32F479IG", "F469NIT6", "F479IGT6"],
      heroTitle: "STM32F469 / STM32F479",
      subtitle: ["Arm Cortex-M4F", "180MHz", "512KB~2MB Flash", "384KB SRAM + 4KB BKPSRAM", "168~216 pins", "Multimedia F4"],
      intro: "STM32F469/F479 是 F4 家族中最完整的多媒体模板之一，结合 LTDC、DMA2D、MIPI DSI、双 QSPI 与更大的 SRAM。",
      boardCopy: "如果你需要高分辨率界面、较大图形缓存、现代显示链路和更复杂的外部存储组织，它就是 F4 的上限模板之一。",
      layout: "multimedia",
      defaultModule: "DSI",
      quickLabel: "F469/F479",
      selectLabel: "STM32F469 / STM32F479 · 180MHz · 512KB~2MB Flash · 384KB SRAM",
      catalogGroup: "Graphics / Display",
      catalogTitle: "F469 / F479",
      catalogLines: ["180MHz M4F", "512KB~2MB Flash / 384KB SRAM", "LTDC / DMA2D / MIPI DSI / Dual QSPI"],
      stats: [
        { label: "Core", value: "M4F", meta: "F4 多媒体旗舰模板" },
        { label: "Clock", value: "180MHz", meta: "图形与显示友好" },
        { label: "Flash", value: "512KB~2MB", meta: "适合大 GUI 与协议栈" },
        { label: "SRAM", value: "384KB + 4KB BKP", meta: "F4 中非常充裕" },
        { label: "Package", value: "168~216 pins", meta: "定位高端主控" },
        { label: "Signature", value: "MIPI DSI", meta: "F4 显示上限模板" }
      ]
    }
  ];

  const modelMap = Object.fromEntries(models.map((model) => [model.id, model]));

  atlas.families.f4 = {
    id: "f4",
    name: "STM32F4",
    displayName: "STM32F4 系列",
    eyebrow: "STM32F4 High-Performance Line Visualizer",
    topbarNote: "当前系列为 STM32F4，输入 F401 / F407VGT6 / F429 / F469 等写法时，页面会自动映射到对应子系列结构模板。",
    searchPlaceholder: "例如：STM32F407VGT6 / F401 / F429 / F469NIT6",
    searchHelp: "F4 的具体料号非常多，页面会优先把输入映射到对应子系列模板，例如 F407VGT6 → F407/F417。",
    catalogDesc: "F4 以“子系列结构模板”为主进行展示，因为它的具体料号组合远多于 F103，而总线差异主要由子系列定义。",
    sourceDesc: "F4 数据整理自 ST 官方参考手册与产品页，重点覆盖 F401/F410/F411/F412/F413/F405/F407/F446/F427/F429/F469 各条子线。",
    footnote: "STM32F4 的内部结构差异主要体现在多 AHB 总线、ART、CCM / 多段 SRAM、图形链路、以太网、外扩存储和音频 / 安全加速模块。具体料号会进一步影响 Flash 容量、封装和引脚开放度，但不一定改变总线骨架。",
    quickIds: ["f401", "f411", "f407", "f446", "f429", "f469"],
    defaultModelId: "f407",
    catalogGroups: [
      { title: "Access / Entry", description: "面向紧凑型高性能控制与从 F1 升级的模板。", ids: ["f401", "f410", "f411"] },
      { title: "Dynamic / Sensor", description: "更大 SRAM、更强串口矩阵与外扩能力。", ids: ["f412", "f413"] },
      { title: "Foundation / Connectivity", description: "经典高性能 F4，适合工业控制、网络与复杂外设。", ids: ["f405", "f407", "f446"] },
      { title: "Graphics / Display", description: "图形、人机界面与多媒体导向的高端 F4 模板。", ids: ["f427", "f429", "f469"] }
    ],
    sources: [
      { title: "STM32F4 family overview", url: "https://www.st.com/en/microcontrollers-microprocessors/stm32f4-series.html", note: "STM32F4 系列总览与产品线入口。" },
      { title: "RM0090 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/dm00031020.pdf", note: "STM32F405/407/415/417/427/429/437/439 的主参考手册。" },
      { title: "RM0368 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/dm00096844.pdf", note: "STM32F401 参考手册。" },
      { title: "RM0401 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/rm0401-stm32f410-advanced-armbased-32bit-mcus-stmicroelectronics.pdf", note: "STM32F410 参考手册。" },
      { title: "RM0383 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/dm00119316-stm32f4-series-advanced-armbased-32bit-mcus-stmicroelectronics.pdf", note: "STM32F411 参考手册。" },
      { title: "RM0402 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/dm00180366.pdf", note: "STM32F412 参考手册。" },
      { title: "RM0430 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/dm00305666.pdf", note: "STM32F413/423 参考手册。" },
      { title: "RM0390 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/rm0390-stm32f446xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf", note: "STM32F446 参考手册。" },
      { title: "RM0386 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/rm0386-stm32f469xx-and-stm32f479xx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf", note: "STM32F469/F479 参考手册。" }
    ],
    modules,
    layouts,
    models,
    modelMap
  };
})();
