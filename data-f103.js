(function registerF103Family() {
  const atlas = window.CHIP_ATLAS = window.CHIP_ATLAS || { families: {} };

  const packages = {
    T: { pins: "36 pins", gpio: "up to 26", note: "超紧凑封装" },
    C: { pins: "48 pins", gpio: "up to 37", note: "最常见开发板尺寸" },
    R: { pins: "64 pins", gpio: "up to 51", note: "中等规模接口扩展" },
    V: { pins: "100 pins", gpio: "up to 80", note: "高引脚控制板" },
    Z: { pins: "144 pins", gpio: "up to 112", note: "F103 顶级引脚封装" }
  };

  const densityProfiles = {
    low: {
      label: "低密度",
      flashMap: { 4: "16KB", 6: "32KB" },
      sramMap: { 4: "6KB", 6: "10KB" },
      subtitle: "基础控制型 F103",
      layout: "low",
      periphs: "6 个定时器、2 个 ADC、1 个 I2C、2 个 USART、1 个 SPI、USB FS Device、CAN、DMA1",
      summary: "保留 Cortex-M3 主干和基础总线，适合小型控制板与入门项目。"
    },
    medium: {
      label: "中密度",
      flashMap: { 8: "64KB", B: "128KB" },
      sramMap: { 8: "20KB", B: "20KB" },
      subtitle: "主流开发板模板",
      layout: "medium",
      periphs: "7 个定时器、2 个 ADC、2 个 I2C、3 个 USART、2 个 SPI、USB FS Device、CAN、DMA1",
      summary: "C8T6 / CBT6 / R8T6 一类型号的典型内部结构，也是最常见的 F103 主流模板。"
    },
    high: {
      label: "高密度",
      flashMap: { C: "256KB", D: "384KB", E: "512KB" },
      sramMap: { C: "48KB", D: "64KB", E: "64KB" },
      subtitle: "扩展总线型 F103",
      layout: "high",
      periphs: "DMA2、FSMC、SDIO、ADC3、双 DAC、TIM8、更多串口和 GPIO",
      summary: "在中密度骨架上继续扩展 AHB / APB 外设，是 F103 真正的高端版图。"
    },
    xl: {
      label: "XL 密度",
      flashMap: { F: "768KB", G: "1MB" },
      sramMap: { F: "96KB", G: "96KB" },
      subtitle: "F103 完整形态",
      layout: "xl",
      periphs: "在高密度基础上增加 MPU 与 TIM9~TIM14，代码空间与时间资源都更充裕",
      summary: "F103 系列内部结构最完整的一档，适合复杂固件、更多任务与更大资源需求。"
    }
  };

  const modelGroups = [
    { density: "low", title: "低密度", description: "x4 / x6", roots: ["T4", "C4", "R4", "T6", "C6", "R6"] },
    { density: "medium", title: "中密度", description: "x8 / xB", roots: ["T8", "C8", "R8", "V8", "TB", "CB", "RB", "VB"] },
    { density: "high", title: "高密度", description: "xC / xD / xE", roots: ["RC", "VC", "ZC", "RD", "VD", "ZD", "RE", "VE", "ZE"] },
    { density: "xl", title: "XL 密度", description: "xF / xG", roots: ["RF", "VF", "ZF", "RG", "VG", "ZG"] }
  ];

  const modules = {
    CORE: {
      title: "Cortex-M3",
      base: "0xE000E000+",
      accent: "var(--core)",
      lane: "Core",
      note: "72MHz Arm Cortex-M3 内核。",
      description: "F103 全系共享同一颗 Cortex-M3 控制核心，由 NVIC、SysTick 和调试组件构成控制中枢。",
      roles: "指令执行、异常响应、中断仲裁、系统节拍。",
      availability: "STM32F103 全系列。",
      detailNote: "无论是 C8T6 还是 ZGT6，真正决定它们差异的不是 CPU 核心，而是挂在总线后的存储和外设层级。",
      registers: [
        { name: "CPUID", offset: "0xD00", desc: "核心标识" },
        { name: "ICSR", offset: "0xD04", desc: "异常活动状态" },
        { name: "AIRCR", offset: "0xD0C", desc: "优先级分组 / 软复位" },
        { name: "SYST_CSR", offset: "0x010", desc: "SysTick 控制" }
      ]
    },
    MEMORY: {
      title: "Flash / SRAM",
      base: "0x08000000 / 0x20000000",
      accent: "var(--core)",
      lane: "Core",
      note: "容量随具体料号变化。",
      description: "F103 的 Flash / SRAM 是区分 C8、CB、ZE、ZG 这类型号的核心参数，也是整张结构图模板切换的起点。",
      roles: "程序存放、堆栈与全局数据、运行时缓冲。",
      availability: "全系列必带。",
      detailNote: "页面顶部显示的 Flash / SRAM 容量，会决定当前型号属于低、中、高还是 XL 密度模板。",
      registers: [
        { name: "FLASH_ACR", offset: "0x00", desc: "等待周期与预取" },
        { name: "FLASH_KEYR", offset: "0x04", desc: "解锁密钥" },
        { name: "FLASH_SR", offset: "0x0C", desc: "状态寄存器" },
        { name: "FLASH_CR", offset: "0x10", desc: "擦写控制" }
      ]
    },
    BOOT: {
      title: "Boot / Debug",
      base: "System Memory / SWD / JTAG",
      accent: "var(--core)",
      lane: "Core",
      note: "上电启动、ISP 与调试入口。",
      description: "BOOT0 / BOOT1、系统存储器启动、选项字节与 SWD / JTAG 共同组成 F103 的带机入口。",
      roles: "启动源切换、系统 Bootloader、在线下载调试。",
      availability: "全系列。",
      detailNote: "实际开发里最常见的是 SWD 下载，以及利用系统 Bootloader 走串口升级。",
      registers: [
        { name: "OBR", offset: "Flash 0x1C", desc: "选项字节状态" },
        { name: "WRPR", offset: "Flash 0x20", desc: "写保护状态" },
        { name: "DBGMCU_IDCODE", offset: "0xE0042000", desc: "芯片调试标识" }
      ]
    },
    RCC: {
      title: "RCC",
      base: "0x40021000",
      accent: "var(--ahb)",
      lane: "AHB",
      note: "时钟树与总线门控中心。",
      description: "RCC 负责 HSI / HSE / PLL、AHB / APB 分频与外设时钟使能，是所有外设初始化的第一站。",
      roles: "时钟源选择、PLL 倍频、门控与复位。",
      availability: "全系列。",
      detailNote: "虽然每个密度级外设数量不同，但所有模块几乎都要经过 RCC 才能真正开始工作。",
      registers: [
        { name: "CR", offset: "0x00", desc: "时钟控制" },
        { name: "CFGR", offset: "0x04", desc: "时钟配置" },
        { name: "APB2ENR", offset: "0x18", desc: "APB2 使能" },
        { name: "APB1ENR", offset: "0x1C", desc: "APB1 使能" }
      ]
    },
    DMA1: {
      title: "DMA1",
      base: "0x40020000",
      accent: "var(--ahb)",
      lane: "AHB",
      note: "基础 7 通道搬运引擎。",
      description: "DMA1 是所有 F103 型号都具备的数据搬运模块，负责 ADC、SPI、USART 等流式数据的内存交换。",
      roles: "内存到外设、外设到内存、循环搬运。",
      availability: "全系列。",
      detailNote: "在 C8T6 这类常用板上，ADC + DMA 往往是最先用到的高效率外设组合。",
      registers: [
        { name: "ISR", offset: "0x00", desc: "中断状态" },
        { name: "IFCR", offset: "0x04", desc: "标志清除" },
        { name: "CCR1", offset: "0x08", desc: "通道控制" },
        { name: "CNDTR1", offset: "0x0C", desc: "剩余数量" }
      ]
    },
    DMA2: {
      title: "DMA2",
      base: "0x40020400",
      accent: "var(--ahb)",
      lane: "AHB",
      note: "高密度以上扩展 DMA。",
      description: "DMA2 只出现在高密度和 XL 密度模板里，为 ADC3、SDIO、TIM8 等高级模块提供更强的数据搬运能力。",
      roles: "更高带宽 DMA、服务扩展外设。",
      availability: "高密度 / XL 密度。",
      detailNote: "这是高端 F103 和 C8T6 这类主流小芯片之间的一个很直观的结构差异。",
      registers: [
        { name: "ISR", offset: "0x00", desc: "中断状态" },
        { name: "IFCR", offset: "0x04", desc: "标志清除" },
        { name: "CCR5", offset: "0x58", desc: "高通道配置" },
        { name: "CMAR5", offset: "0x64", desc: "内存地址" }
      ]
    },
    FLASH: {
      title: "FLASH IF",
      base: "0x40022000",
      accent: "var(--ahb)",
      lane: "AHB",
      note: "片上 Flash 接口控制器。",
      description: "Flash 接口影响取指等待周期、预取与在线擦写，是性能与在线升级的关键节点。",
      roles: "等待周期、页擦除、半字编程。",
      availability: "全系列。",
      detailNote: "当主频升到 72MHz 时，Flash 等待周期设置是否正确会直接影响系统稳定性。",
      registers: [
        { name: "ACR", offset: "0x00", desc: "访问控制" },
        { name: "KEYR", offset: "0x04", desc: "解锁" },
        { name: "SR", offset: "0x0C", desc: "忙 / 错误状态" },
        { name: "CR", offset: "0x10", desc: "编程控制" }
      ]
    },
    CRC: {
      title: "CRC",
      base: "0x40023000",
      accent: "var(--ahb)",
      lane: "AHB",
      note: "硬件 CRC 校验单元。",
      description: "CRC 模块常用于引导镜像校验、通信数据验证和参数块完整性检查。",
      roles: "硬件 CRC 计算。",
      availability: "全系列。",
      detailNote: "它体积不大，但在 Bootloader、固件升级与总线协议中很实用。",
      registers: [
        { name: "DR", offset: "0x00", desc: "数据寄存器" },
        { name: "IDR", offset: "0x04", desc: "独立数据" },
        { name: "CR", offset: "0x08", desc: "复位控制" }
      ]
    },
    FSMC: {
      title: "FSMC",
      base: "0xA0000000",
      accent: "var(--ahb)",
      lane: "AHB",
      note: "并行外扩存储控制器。",
      description: "FSMC 只在高密度以上模板中出现，可挂接 SRAM、NOR / NAND Flash 和并口 LCD。",
      roles: "外扩存储、8080/6800 LCD 总线。",
      availability: "高密度 / XL 密度。",
      detailNote: "带 FSMC 的 F103 可以明显突破 C8T6 那种“小型控制器”定位，进入图形与存储扩展场景。",
      registers: [
        { name: "BCR1", offset: "0x00", desc: "Bank1 控制" },
        { name: "BTR1", offset: "0x04", desc: "Bank1 时序" },
        { name: "PCR2", offset: "0x60", desc: "NAND 控制" },
        { name: "PMEM2", offset: "0x68", desc: "存储时序" }
      ]
    },
    SDIO: {
      title: "SDIO",
      base: "0x40018000",
      accent: "var(--ahb)",
      lane: "AHB",
      note: "高速 SD / MMC 主机接口。",
      description: "SDIO 是高密度以上模板的重要特征，让 F103 可以更高效地驱动 SD 卡而不是退回 SPI 模式。",
      roles: "命令通道、块数据传输、FIFO。",
      availability: "高密度 / XL 密度。",
      detailNote: "如果你要做数据记录、文件系统或图片缓存，SDIO 往往是高端 F103 的关键加分项。",
      registers: [
        { name: "POWER", offset: "0x00", desc: "电源控制" },
        { name: "CLKCR", offset: "0x04", desc: "时钟控制" },
        { name: "CMD", offset: "0x0C", desc: "命令寄存器" },
        { name: "DCTRL", offset: "0x2C", desc: "数据控制" }
      ]
    },
    AFIO: {
      title: "AFIO / EXTI",
      base: "0x40010000 / 0x40010400",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "复用重映射和中断路由入口。",
      description: "AFIO 与 EXTI 是 F1 时代特征非常鲜明的两块逻辑，承担 JTAG 释放、串口重映射和外部中断映射。",
      roles: "引脚重映射、事件路由、外部中断控制。",
      availability: "全系列。",
      detailNote: "STM32F1 的 AFIO 用法和后续 F4/F7 的 SYSCFG 思路不同，是这个系列很有代表性的部分。",
      registers: [
        { name: "MAPR", offset: "0x04", desc: "复用重映射" },
        { name: "EXTICR1", offset: "0x08", desc: "EXTI 路由" },
        { name: "IMR", offset: "0x00", desc: "中断屏蔽" },
        { name: "PR", offset: "0x14", desc: "挂起标志" }
      ]
    },
    GPIO: {
      title: "GPIO A-C",
      base: "0x40010800+",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "基础 GPIO 群。",
      description: "GPIOA/B/C 是绝大多数 F103 开发板最常接触的引脚群，也是 SPI、USART、定时器通道等复用功能的主要承载区。",
      roles: "数字 IO、复用输出、位操作控制。",
      availability: "全系列。",
      detailNote: "在小封装型号里，GPIOA~C 基本覆盖了主要功能；更高封装则会继续扩展到 D~G。",
      registers: [
        { name: "CRL", offset: "0x00", desc: "Pin0~7 配置" },
        { name: "CRH", offset: "0x04", desc: "Pin8~15 配置" },
        { name: "IDR", offset: "0x08", desc: "输入数据" },
        { name: "BSRR", offset: "0x10", desc: "原子置位复位" }
      ]
    },
    GPIOX: {
      title: "GPIO D-G",
      base: "0x40011400+",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "高封装扩展端口。",
      description: "GPIOD/E/F/G 主要出现在高密度或高引脚封装的模板中，用来承载 FSMC、SDIO、更多定时器和并行总线信号。",
      roles: "扩展 GPIO、高速并口与外设复用。",
      availability: "中密度高封装 / 高密度 / XL 密度。",
      detailNote: "如果要判断一颗 F103 是否具备明显的板级扩展潜力，看它有没有这些附加端口会很直观。",
      registers: [
        { name: "CRL", offset: "0x00", desc: "低 8 位配置" },
        { name: "CRH", offset: "0x04", desc: "高 8 位配置" },
        { name: "ODR", offset: "0x0C", desc: "输出数据" },
        { name: "LCKR", offset: "0x18", desc: "配置锁定" }
      ]
    },
    ADC12: {
      title: "ADC1 / ADC2",
      base: "0x40012400 / 0x40012800",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "F103 标准双 ADC 组合。",
      description: "ADC1 / ADC2 是 F103 系列最稳定的模拟输入资源，支持扫描、注入组、DMA 和模拟看门狗。",
      roles: "多通道采样、触发采集、DMA 扫描。",
      availability: "全系列。",
      detailNote: "即便是低密度模板，ADC1 / ADC2 也已经足够覆盖很多控制与采样项目。",
      registers: [
        { name: "SR", offset: "0x00", desc: "状态" },
        { name: "CR1", offset: "0x04", desc: "扫描与看门狗" },
        { name: "CR2", offset: "0x08", desc: "启动 / DMA / 校准" },
        { name: "SQR1", offset: "0x2C", desc: "序列长度" }
      ]
    },
    ADC3DAC: {
      title: "ADC3 / DAC",
      base: "0x40013C00 / 0x40007400",
      accent: "var(--apb2)",
      lane: "APB2 / APB1",
      note: "高密度以上模拟扩展。",
      description: "ADC3 与双 DAC 只在高密度和 XL 密度模板中出现，让 F103 拥有更强的采样与模拟输出能力。",
      roles: "第三路 ADC、双 DAC 输出。",
      availability: "高密度 / XL 密度。",
      detailNote: "这是高端 F103 和中低端 F103 在模拟链路上最核心的区别之一。",
      registers: [
        { name: "ADC3_CR2", offset: "0x08", desc: "ADC3 启动控制" },
        { name: "ADC3_DR", offset: "0x4C", desc: "ADC3 数据寄存器" },
        { name: "DAC_CR", offset: "0x00", desc: "DAC 使能" },
        { name: "DAC_DHR12R1", offset: "0x08", desc: "通道 1 数据" }
      ]
    },
    TIM_ADV: {
      title: "TIM1 / TIM8",
      base: "0x40012C00 / 0x40013400",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "高级 PWM / 电机控制定时器。",
      description: "TIM1 是全系列都在的高级定时器，高密度以上还会加入 TIM8，适合互补 PWM、死区与同步控制。",
      roles: "高级 PWM、互补输出、刹车与编码器接口。",
      availability: "TIM1: 全系列；TIM8: 高密度 / XL 密度。",
      detailNote: "F103 在电机控制和高质量 PWM 场景的能力，很大程度上就建立在这组高级定时器上。",
      registers: [
        { name: "CR1", offset: "0x00", desc: "基本控制" },
        { name: "SMCR", offset: "0x08", desc: "从模式" },
        { name: "CCER", offset: "0x20", desc: "输出使能" },
        { name: "BDTR", offset: "0x44", desc: "死区 / 刹车" }
      ]
    },
    SPI1: {
      title: "SPI1 / USART1",
      base: "0x40013000 / 0x40013800",
      accent: "var(--apb2)",
      lane: "APB2",
      note: "高速同步 / 异步通信入口。",
      description: "SPI1 与 USART1 都挂在 APB2 上，通常承担更高时钟或更关键的上位机通信任务。",
      roles: "高速 SPI、调试串口、DMA 协同通信。",
      availability: "全系列。",
      detailNote: "很多开发板默认串口就是 USART1，而高速 SPI 设备也常常优先挂在 SPI1。",
      registers: [
        { name: "SPI1_CR1", offset: "0x00", desc: "SPI 控制" },
        { name: "SPI1_SR", offset: "0x08", desc: "SPI 状态" },
        { name: "USART1_BRR", offset: "0x08", desc: "波特率" },
        { name: "USART1_CR1", offset: "0x0C", desc: "串口控制" }
      ]
    },
    TIM_APB1: {
      title: "TIM2 ~ TIM7",
      base: "0x40000000+",
      accent: "var(--apb1)",
      lane: "APB1",
      note: "通用与基础定时器群。",
      description: "低密度以 TIM2 / TIM3 为主，中密度扩展到 TIM4，高密度以上再加入 TIM5 / TIM6 / TIM7。",
      roles: "通用 PWM、输入捕获、时基、中断触发。",
      availability: "不同密度数量不同。",
      detailNote: "这是 F103 结构里最容易随密度增加而不断扩容的一组模块。",
      registers: [
        { name: "CR1", offset: "0x00", desc: "控制寄存器" },
        { name: "PSC", offset: "0x28", desc: "预分频" },
        { name: "ARR", offset: "0x2C", desc: "自动重装载" },
        { name: "CCR1", offset: "0x34", desc: "比较 / 捕获" }
      ]
    },
    TIM_XL: {
      title: "TIM9 ~ TIM14",
      base: "0x40014C00+ / 0x40001800+",
      accent: "var(--apb1)",
      lane: "APB2 / APB1",
      note: "XL 密度专属小型定时器。",
      description: "TIM9 ~ TIM14 只出现在 XL 密度中，让 F103xF / xG 的时间资源总量显著高于其它版本。",
      roles: "附加 PWM、轻量计时与捕获。",
      availability: "XL 密度。",
      detailNote: "如果你把 F103 当成复杂多任务控制器来用，这组附加定时器会非常有价值。",
      registers: [
        { name: "TIM9_CR1", offset: "0x00", desc: "TIM9 控制" },
        { name: "TIM10_CCR1", offset: "0x34", desc: "输出比较" },
        { name: "TIM12_PSC", offset: "0x28", desc: "预分频" },
        { name: "TIM14_ARR", offset: "0x2C", desc: "重装载" }
      ]
    },
    COM_APB1: {
      title: "USART / SPI / I2C",
      base: "0x40003800+ / 0x40004400+ / 0x40005400+",
      accent: "var(--apb1)",
      lane: "APB1",
      note: "中低速通信矩阵。",
      description: "APB1 上承载了剩余的大部分通信外设。密度越高，USART / UART、SPI / I2S、I2C 的数量越多。",
      roles: "串口扩展、I2C 传感网络、SPI / I2S 外设链路。",
      availability: "不同密度数量不同。",
      detailNote: "低密度偏精简，中密度足够主流开发，高密度以上则开始面向复杂的多串口 / 多总线系统。",
      registers: [
        { name: "USART2_BRR", offset: "0x08", desc: "串口波特率" },
        { name: "USART3_CR1", offset: "0x0C", desc: "串口控制" },
        { name: "I2C1_CR1", offset: "0x00", desc: "I2C 控制" },
        { name: "SPI2_I2SCFGR", offset: "0x1C", desc: "I2S 模式" }
      ]
    },
    USB_CAN: {
      title: "USB FS / CAN",
      base: "0x40005C00 / 0x40006400",
      accent: "var(--apb1)",
      lane: "APB1",
      note: "F103 标志性连接特性。",
      description: "USB FS Device 和 bxCAN 是 F103 相比更低端控制器很有辨识度的一组连接能力。",
      roles: "USB 设备枚举、CAN 报文收发。",
      availability: "性能线 F103 常见模板。",
      detailNote: "对很多项目来说，USB 和 CAN 正是 F103 依然有生命力的原因之一。",
      registers: [
        { name: "USB_CNTR", offset: "0x40", desc: "USB 控制" },
        { name: "USB_ISTR", offset: "0x44", desc: "USB 中断状态" },
        { name: "CAN_MCR", offset: "0x00", desc: "CAN 主控制" },
        { name: "CAN_TSR", offset: "0x08", desc: "发送状态" }
      ]
    },
    RTC_PWR: {
      title: "RTC / BKP / PWR",
      base: "0x40002800 / 0x40006C00 / 0x40007000",
      accent: "var(--apb1)",
      lane: "APB1",
      note: "低功耗与后备域。",
      description: "RTC、BKP 和 PWR 一起组成掉电保持、待机唤醒与低功耗控制区域。",
      roles: "RTC、备份寄存器、待机 / 停机模式。",
      availability: "全系列。",
      detailNote: "任何需要待机唤醒或掉电保存少量状态的方案，都会用到这一块。",
      registers: [
        { name: "RTC_CRL", offset: "0x04", desc: "RTC 状态" },
        { name: "RTC_CNTH", offset: "0x18", desc: "RTC 高位计数" },
        { name: "PWR_CR", offset: "0x00", desc: "低功耗控制" },
        { name: "BKP_DR1", offset: "0x04", desc: "备份寄存器" }
      ]
    }
  };

  const layouts = {
    low: [
      { label: "Core", subtitle: "ARM Core + Memory", accent: "var(--core)", items: [{ key: "CORE", span: 4 }, { key: "MEMORY", span: 4 }, { key: "BOOT", span: 4 }] },
      { label: "AHB", subtitle: "System Bus", accent: "var(--ahb)", items: [{ key: "RCC", span: 3 }, { key: "DMA1", span: 3 }, { key: "FLASH", span: 3 }, { key: "CRC", span: 3 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "AFIO", span: 3 }, { key: "GPIO", span: 4 }, { key: "ADC12", span: 3 }, { key: "TIM_ADV", span: 2 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COM_APB1", span: 3 }, { key: "USB_CAN", span: 3 }, { key: "RTC_PWR", span: 3 }] }
    ],
    medium: [
      { label: "Core", subtitle: "ARM Core + Memory", accent: "var(--core)", items: [{ key: "CORE", span: 4 }, { key: "MEMORY", span: 4 }, { key: "BOOT", span: 4 }] },
      { label: "AHB", subtitle: "System Bus", accent: "var(--ahb)", items: [{ key: "RCC", span: 3 }, { key: "DMA1", span: 3 }, { key: "FLASH", span: 3 }, { key: "CRC", span: 3 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "AFIO", span: 2 }, { key: "GPIO", span: 3 }, { key: "GPIOX", span: 2 }, { key: "ADC12", span: 2 }, { key: "TIM_ADV", span: 2 }, { key: "SPI1", span: 1 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COM_APB1", span: 4 }, { key: "USB_CAN", span: 3 }, { key: "RTC_PWR", span: 2 }] }
    ],
    high: [
      { label: "Core", subtitle: "ARM Core + Memory", accent: "var(--core)", items: [{ key: "CORE", span: 4 }, { key: "MEMORY", span: 4 }, { key: "BOOT", span: 4 }] },
      { label: "AHB", subtitle: "Extended System Bus", accent: "var(--ahb)", items: [{ key: "RCC", span: 2 }, { key: "DMA1", span: 2 }, { key: "DMA2", span: 2 }, { key: "FLASH", span: 2 }, { key: "CRC", span: 1 }, { key: "FSMC", span: 2 }, { key: "SDIO", span: 1 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "AFIO", span: 2 }, { key: "GPIO", span: 2 }, { key: "GPIOX", span: 2 }, { key: "ADC12", span: 2 }, { key: "ADC3DAC", span: 1 }, { key: "TIM_ADV", span: 2 }, { key: "SPI1", span: 1 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "COM_APB1", span: 4 }, { key: "USB_CAN", span: 3 }, { key: "RTC_PWR", span: 2 }] }
    ],
    xl: [
      { label: "Core", subtitle: "ARM Core + Memory", accent: "var(--core)", items: [{ key: "CORE", span: 4 }, { key: "MEMORY", span: 4 }, { key: "BOOT", span: 4 }] },
      { label: "AHB", subtitle: "Extended System Bus", accent: "var(--ahb)", items: [{ key: "RCC", span: 2 }, { key: "DMA1", span: 2 }, { key: "DMA2", span: 2 }, { key: "FLASH", span: 2 }, { key: "CRC", span: 1 }, { key: "FSMC", span: 2 }, { key: "SDIO", span: 1 }] },
      { label: "APB2", subtitle: "Fast Peripheral Bus", accent: "var(--apb2)", items: [{ key: "AFIO", span: 1 }, { key: "GPIO", span: 2 }, { key: "GPIOX", span: 2 }, { key: "ADC12", span: 2 }, { key: "ADC3DAC", span: 1 }, { key: "TIM_ADV", span: 2 }, { key: "SPI1", span: 2 }] },
      { label: "APB1", subtitle: "Peripheral Bus", accent: "var(--apb1)", items: [{ key: "TIM_APB1", span: 3 }, { key: "TIM_XL", span: 2 }, { key: "COM_APB1", span: 3 }, { key: "USB_CAN", span: 2 }, { key: "RTC_PWR", span: 2 }] }
    ]
  };

  function makeOrderCode(root) {
    return root[0] === "T" ? `STM32F103${root}` : `STM32F103${root}T6`;
  }

  function buildModel(root, density, groupTitle) {
    const pkg = packages[root[0]];
    const code = root[1];
    const profile = densityProfiles[density];
    const flashText = profile.flashMap[code];
    const sramText = profile.sramMap[code];
    const orderCode = makeOrderCode(root);

    return {
      id: root,
      title: orderCode,
      short: orderCode.replace("STM32F103", ""),
      aliases: [root, `${root}T6`, orderCode, `STM32F103${root}`],
      heroTitle: orderCode,
      subtitle: ["Arm Cortex-M3", "72MHz", `${flashText} Flash`, `${sramText} SRAM`, pkg.pins, profile.label],
      intro: `${orderCode} 属于 ${profile.label} STM32F103 模板。它和同密度的其它料号共享同一套内部总线骨架，主要差异集中在 Flash / SRAM 容量、封装引脚数和是否开放扩展端口。`,
      boardCopy: `${profile.summary} 当前型号是 ${pkg.note} 版本，适合在理解同密度结构的同时，结合具体封装做板级资源判断。`,
      layout: profile.layout,
      defaultModule: "RCC",
      quickLabel: orderCode.replace("STM32F103", ""),
      selectLabel: `${orderCode} · ${flashText} Flash · ${sramText} SRAM · ${pkg.pins}`,
      catalogGroup: groupTitle,
      catalogTitle: orderCode.replace("STM32F103", ""),
      catalogLines: [`${flashText} Flash / ${sramText} SRAM`, `${pkg.pins} / ${pkg.gpio} GPIO`, profile.periphs],
      stats: [
        { label: "Core", value: "Cortex-M3", meta: "72MHz Armv7-M" },
        { label: "Flash", value: flashText, meta: `${orderCode} 程序存储容量` },
        { label: "SRAM", value: sramText, meta: "运行时数据与 DMA 缓冲" },
        { label: "Package", value: pkg.pins, meta: pkg.note },
        { label: "GPIO", value: pkg.gpio, meta: "实际可用引脚依封装而定" },
        { label: "Density", value: profile.label, meta: profile.periphs }
      ]
    };
  }

  const models = modelGroups.flatMap((group) => group.roots.map((root) => buildModel(root, group.density, group.title)));
  const modelMap = Object.fromEntries(models.map((model) => [model.id, model]));

  atlas.families.f103 = {
    id: "f103",
    name: "STM32F103",
    displayName: "STM32F103 系列",
    eyebrow: "STM32F103 Performance Line Visualizer",
    topbarNote: "当前系列为 STM32F103，支持按 C8T6 / ZET6 / VGT6 这类具体料号直接切换结构模板。",
    searchPlaceholder: "例如：C8T6 / R8T6 / ZET6 / STM32F103CBT6",
    searchHelp: "可输入 C8T6、CBT6、R8T6、ZET6、STM32F103VGT6 等常见写法。",
    catalogDesc: "F103 采用“密度模板 + 具体料号映射”的方式展示，便于直接查看 C8T6、R8T6、ZET6 等常用芯片。",
    sourceDesc: "F103 数据按 RM0008 与各密度数据手册整理。",
    footnote: "STM32F103 的具体料号很多，但内部结构差异主要由密度等级决定。页面因此把具体料号映射到低、中、高、XL 四套总线模板上，再叠加封装与容量信息。",
    quickIds: ["C8", "CB", "R8", "RB", "RC", "RE", "ZE", "VG"],
    defaultModelId: "C8",
    catalogGroups: modelGroups.map((group) => ({
      title: `${group.title} · ${group.description}`,
      description: densityProfiles[group.density].summary,
      ids: group.roots
    })),
    sources: [
      { title: "RM0008 Reference Manual", url: "https://www.st.com/resource/en/reference_manual/cd00171190.pdf", note: "STM32F101/102/103 参考手册，提供总线、基址与寄存器布局。" },
      { title: "STM32F103 low-density datasheet", url: "https://www.st.com/resource/en/datasheet/stm32f103t6.pdf", note: "覆盖 STM32F103x4 / x6。" },
      { title: "STM32F103 medium-density datasheet", url: "https://www.st.com/resource/en/datasheet/stm32f103rb.pdf", note: "覆盖 STM32F103x8 / xB。" },
      { title: "STM32F103 high-density datasheet", url: "https://www.st.com/resource/en/datasheet/stm32f103zc.pdf", note: "覆盖 STM32F103xC / xD / xE。" },
      { title: "STM32F103 XL-density datasheet", url: "https://www.st.com/resource/en/datasheet/stm32f103zg.pdf", note: "覆盖 STM32F103xF / xG。" }
    ],
    modules,
    layouts,
    models,
    modelMap
  };
})();
