const fs = require("fs");
const path = require("path");
const vm = require("vm");

const workspace = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dbDir = resolveDbDir(args["db-dir"] || process.env.STM32_CUBEMX_DB_DIR);
const outputPath = path.resolve(workspace, args.output || "data-pinouts.js");

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!fs.existsSync(dbDir)) {
  throw new Error(
    `STM32CubeMX MCU database directory not found: ${dbDir}\n` +
    "Use --db-dir <path> or set STM32_CUBEMX_DB_DIR."
  );
}

const atlas = loadAtlas();

const f103Specs = [
  { id: "f103-low-t", label: "STM32F103T4/T6 · UFQFPN36", xmlName: "STM32F103T(4-6)Ux.xml", modelIds: ["T4", "T6"] },
  { id: "f103-low-c", label: "STM32F103C4/C6 · LQFP48", xmlName: "STM32F103C(4-6)Tx.xml", modelIds: ["C4", "C6"] },
  { id: "f103-low-r", label: "STM32F103R4/R6 · LQFP64", xmlName: "STM32F103R(4-6)Tx.xml", modelIds: ["R4", "R6"] },
  { id: "f103-medium-t", label: "STM32F103T8/TB · UFQFPN36", xmlName: "STM32F103T(8-B)Ux.xml", modelIds: ["T8", "TB"] },
  { id: "f103-medium-c", label: "STM32F103C8T6 / CBT6 · LQFP48", xmlName: "STM32F103C(8-B)Tx.xml", modelIds: ["C8", "CB"], curatedC8: true },
  { id: "f103-medium-r", label: "STM32F103R8/RBT6 · LQFP64", xmlName: "STM32F103R(8-B)Tx.xml", modelIds: ["R8", "RB"] },
  { id: "f103-medium-v", label: "STM32F103V8/VBT6 · LQFP100", xmlName: "STM32F103V(8-B)Tx.xml", modelIds: ["V8", "VB"] },
  { id: "f103-high-r", label: "STM32F103RC/RD/RET6 · LQFP64", xmlName: "STM32F103R(C-D-E)Tx.xml", modelIds: ["RC", "RD", "RE"] },
  { id: "f103-high-v", label: "STM32F103VC/VD/VET6 · LQFP100", xmlName: "STM32F103V(C-D-E)Tx.xml", modelIds: ["VC", "VD", "VE"] },
  { id: "f103-high-z", label: "STM32F103ZC/ZD/ZET6 · LQFP144", xmlName: "STM32F103Z(C-D-E)Tx.xml", modelIds: ["ZC", "ZD", "ZE"] },
  { id: "f103-xl-r", label: "STM32F103RF/RGT6 · LQFP64", xmlName: "STM32F103R(F-G)Tx.xml", modelIds: ["RF", "RG"] },
  { id: "f103-xl-v", label: "STM32F103VF/VGT6 · LQFP100", xmlName: "STM32F103V(F-G)Tx.xml", modelIds: ["VF", "VG"] },
  { id: "f103-xl-z", label: "STM32F103ZF/ZGT6 · LQFP144", xmlName: "STM32F103Z(F-G)Tx.xml", modelIds: ["ZF", "ZG"] }
];

const f4Specs = {
  f401: {
    defaultProfileId: "f4-f401-ret6",
    genericAliases: [
      { alias: "F401", profileId: "f4-f401-ret6" },
      { alias: "STM32F401", profileId: "f4-f401-ret6" }
    ],
    profiles: [
      { id: "f4-f401-ccu6", label: "STM32F401CCU6 · UFQFPN48", xmlName: "STM32F401C(B-C)Ux.xml", aliases: ["STM32F401CC", "STM32F401CCU6", "F401CCU6"] },
      { id: "f4-f401-ceu6", label: "STM32F401CEU6 · UFQFPN48", xmlName: "STM32F401C(D-E)Ux.xml", aliases: ["STM32F401CE", "STM32F401CEU6"] },
      { id: "f4-f401-ret6", label: "STM32F401RET6 · LQFP64", xmlName: "STM32F401R(D-E)Tx.xml", aliases: ["STM32F401RE", "STM32F401RET6", "F401RET6"] },
      { id: "f4-f401-vct6", label: "STM32F401VCT6 · LQFP100", xmlName: "STM32F401V(B-C)Tx.xml", aliases: ["STM32F401VC", "STM32F401VCT6"] }
    ]
  },
  f410: {
    defaultProfileId: "f4-f410-cbt6",
    genericAliases: [
      { alias: "F410", profileId: "f4-f410-cbt6" },
      { alias: "STM32F410", profileId: "f4-f410-cbt6" }
    ],
    profiles: [
      { id: "f4-f410-cbt6", label: "STM32F410CBT6 · LQFP48", xmlName: "STM32F410C(8-B)Tx.xml", aliases: ["STM32F410C8", "STM32F410CB", "STM32F410CBT6", "F410CBT6"] },
      { id: "f4-f410-rbt6", label: "STM32F410RBT6 · LQFP64", xmlName: "STM32F410R(8-B)Tx.xml", aliases: ["STM32F410R8", "STM32F410RB", "STM32F410RBT6"] }
    ]
  },
  f411: {
    defaultProfileId: "f4-f411-ret6",
    genericAliases: [
      { alias: "F411", profileId: "f4-f411-ret6" },
      { alias: "STM32F411", profileId: "f4-f411-ret6" }
    ],
    profiles: [
      { id: "f4-f411-ceu6", label: "STM32F411CEU6 · UFQFPN48", xmlName: "STM32F411C(C-E)Ux.xml", aliases: ["STM32F411CC", "STM32F411CE", "STM32F411CEU6", "F411CEU6"] },
      { id: "f4-f411-ret6", label: "STM32F411RET6 · LQFP64", xmlName: "STM32F411R(C-E)Tx.xml", aliases: ["STM32F411RE", "STM32F411RET6", "F411RET6"] },
      { id: "f4-f411-vet6", label: "STM32F411VET6 · LQFP100", xmlName: "STM32F411V(C-E)Tx.xml", aliases: ["STM32F411VE", "STM32F411VET6"] }
    ]
  },
  f412: {
    defaultProfileId: "f4-f412-ret6",
    genericAliases: [
      { alias: "F412", profileId: "f4-f412-ret6" },
      { alias: "STM32F412", profileId: "f4-f412-ret6" }
    ],
    profiles: [
      { id: "f4-f412-cgu6", label: "STM32F412CGU6 · UFQFPN48", xmlName: "STM32F412C(E-G)Ux.xml", aliases: ["STM32F412CG", "STM32F412CGU6"] },
      { id: "f4-f412-ret6", label: "STM32F412RET6 · LQFP64", xmlName: "STM32F412R(E-G)Tx.xml", aliases: ["STM32F412RE", "STM32F412RET6", "F412RET6"] },
      { id: "f4-f412-vet6", label: "STM32F412VET6 · LQFP100", xmlName: "STM32F412V(E-G)Tx.xml", aliases: ["STM32F412VE", "STM32F412VET6"] },
      { id: "f4-f412-zgt6", label: "STM32F412ZGT6 · LQFP144", xmlName: "STM32F412Z(E-G)Tx.xml", aliases: ["STM32F412ZG", "STM32F412ZGT6", "F412ZGT6"] }
    ]
  },
  f413: {
    defaultProfileId: "f4-f413-zht6",
    genericAliases: [
      { alias: "F413", profileId: "f4-f413-zht6" },
      { alias: "STM32F413", profileId: "f4-f413-zht6" },
      { alias: "F423", profileId: "f4-f423-mhy6" },
      { alias: "STM32F423", profileId: "f4-f423-mhy6" }
    ],
    profiles: [
      { id: "f4-f413-zht6", label: "STM32F413ZHT6 · LQFP144", xmlName: "STM32F413Z(G-H)Tx.xml", aliases: ["STM32F413ZH", "STM32F413ZHT6", "F413ZHT6"] },
      { id: "f4-f423-mhy6", label: "STM32F423MHY6 · WLCSP72", xmlName: "STM32F423MHYx.xml", aliases: ["STM32F423MH", "STM32F423MHY6"] }
    ]
  },
  f405: {
    defaultProfileId: "f4-f405-rgt6",
    genericAliases: [
      { alias: "F405", profileId: "f4-f405-rgt6" },
      { alias: "STM32F405", profileId: "f4-f405-rgt6" },
      { alias: "F415", profileId: "f4-f415-zgt6" },
      { alias: "STM32F415", profileId: "f4-f415-zgt6" }
    ],
    profiles: [
      { id: "f4-f405-rgt6", label: "STM32F405RGT6 · LQFP64", xmlName: "STM32F405RGTx.xml", aliases: ["STM32F405RG", "STM32F405RGT6", "F405RGT6"] },
      { id: "f4-f415-zgt6", label: "STM32F415ZGT6 · LQFP144", xmlName: "STM32F415ZGTx.xml", aliases: ["STM32F415ZG", "STM32F415ZGT6", "F415ZGT6"] }
    ]
  },
  f407: {
    defaultProfileId: "f4-f407-vgt6",
    genericAliases: [
      { alias: "F407", profileId: "f4-f407-vgt6" },
      { alias: "STM32F407", profileId: "f4-f407-vgt6" },
      { alias: "F417", profileId: "f4-f417-zgt6" },
      { alias: "STM32F417", profileId: "f4-f417-zgt6" }
    ],
    profiles: [
      { id: "f4-f407-vgt6", label: "STM32F407VGT6 · LQFP100", xmlName: "STM32F407V(E-G)Tx.xml", aliases: ["STM32F407VG", "STM32F407VGT6", "F407VGT6"] },
      { id: "f4-f417-zgt6", label: "STM32F417ZGT6 · LQFP144", xmlName: "STM32F417Z(E-G)Tx.xml", aliases: ["STM32F417ZG", "STM32F417ZGT6", "F417ZGT6"] }
    ]
  },
  f446: {
    defaultProfileId: "f4-f446-ret6",
    genericAliases: [
      { alias: "F446", profileId: "f4-f446-ret6" },
      { alias: "STM32F446", profileId: "f4-f446-ret6" }
    ],
    profiles: [
      { id: "f4-f446-ret6", label: "STM32F446RET6 · LQFP64", xmlName: "STM32F446R(C-E)Tx.xml", aliases: ["STM32F446RE", "STM32F446RET6", "F446RET6"] },
      { id: "f4-f446-vet6", label: "STM32F446VET6 · LQFP100", xmlName: "STM32F446V(C-E)Tx.xml", aliases: ["STM32F446VE", "STM32F446VET6"] },
      { id: "f4-f446-zet6", label: "STM32F446ZET6 · LQFP144", xmlName: "STM32F446Z(C-E)Tx.xml", aliases: ["STM32F446ZE", "STM32F446ZET6", "F446ZET6"] }
    ]
  },
  f427: {
    defaultProfileId: "f4-f427-vgt6",
    genericAliases: [
      { alias: "F427", profileId: "f4-f427-vgt6" },
      { alias: "STM32F427", profileId: "f4-f427-vgt6" },
      { alias: "F437", profileId: "f4-f437-zgt6" },
      { alias: "STM32F437", profileId: "f4-f437-zgt6" }
    ],
    profiles: [
      { id: "f4-f427-vgt6", label: "STM32F427VGT6 · LQFP100", xmlName: "STM32F427V(G-I)Tx.xml", aliases: ["STM32F427VG", "STM32F427VGT6", "F427VGT6"] },
      { id: "f4-f437-zgt6", label: "STM32F437ZGT6 · LQFP144", xmlName: "STM32F437Z(G-I)Tx.xml", aliases: ["STM32F437ZG", "STM32F437ZGT6", "F437ZGT6"] }
    ]
  },
  f429: {
    defaultProfileId: "f4-f429-zit6",
    genericAliases: [
      { alias: "F429", profileId: "f4-f429-zit6" },
      { alias: "STM32F429", profileId: "f4-f429-zit6" },
      { alias: "F439", profileId: "f4-f439-igt6" },
      { alias: "STM32F439", profileId: "f4-f439-igt6" }
    ],
    profiles: [
      { id: "f4-f429-zit6", label: "STM32F429ZIT6 · LQFP144", xmlName: "STM32F429ZITx.xml", aliases: ["STM32F429ZI", "STM32F429ZIT6", "F429ZIT6"] },
      { id: "f4-f439-igt6", label: "STM32F439IGT6 · LQFP176", xmlName: "STM32F439I(G-I)Tx.xml", aliases: ["STM32F439IG", "STM32F439IGT6", "F439IGT6"] }
    ]
  },
  f469: {
    defaultProfileId: "f4-f469-nih6",
    genericAliases: [
      { alias: "F469", profileId: "f4-f469-nih6" },
      { alias: "STM32F469", profileId: "f4-f469-nih6" },
      { alias: "F479", profileId: "f4-f479-igt6" },
      { alias: "STM32F479", profileId: "f4-f479-igt6" }
    ],
    profiles: [
      { id: "f4-f469-nih6", label: "STM32F469NIH6 · TFBGA216", xmlName: "STM32F469NIHx.xml", aliases: ["STM32F469NI", "STM32F469NIH6", "F469NIT6", "STM32F469NIT6"], profileNote: "引脚定义来自 STM32CubeMX 官方 MCU 数据库中的 N 封装 TFBGA216 版本。工程中保留了 F469NIT6 搜索别名，并映射到该官方可用 N 封装 profile。" },
      { id: "f4-f479-igt6", label: "STM32F479IGT6 · LQFP176", xmlName: "STM32F479I(G-I)Tx.xml", aliases: ["STM32F479IG", "STM32F479IGT6", "F479IGT6"] }
    ]
  }
};

const payload = buildPayload();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderOutput(payload), "utf8");
console.log(`Generated ${outputPath}`);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      parsed.help = true;
      continue;
    }

    if (token === "--db-dir" || token === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${token}`);
      }
      parsed[token.slice(2)] = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return parsed;
}

function resolveDbDir(inputPath) {
  if (inputPath) {
    return path.resolve(inputPath);
  }

  return path.resolve(
    "C:\\Program Files\\STMicroelectronics\\STM32Cube\\STM32CubeMX\\db\\mcu"
  );
}

function printHelp() {
  console.log(`
Usage:
  node scripts/generate-pinouts.js [--db-dir <path>] [--output <path>]

Options:
  --db-dir   STM32CubeMX MCU XML directory.
             Default: C:\\Program Files\\STMicroelectronics\\STM32Cube\\STM32CubeMX\\db\\mcu
             Or set STM32_CUBEMX_DB_DIR.
  --output   Output file path.
             Default: data-pinouts.js
  --help     Show this message.
`.trim());
}

function loadAtlas() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  ["data-f103.js", "data-f4.js"].forEach((fileName) => {
    const filePath = path.join(workspace, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    vm.runInContext(source, sandbox, { filename: fileName });
  });
  return sandbox.window.CHIP_ATLAS || { families: {} };
}

function buildPayload() {
  const families = {
    f103: buildF103FamilyPayload(),
    f4: buildF4FamilyPayload()
  };
  return families;
}

function buildF103FamilyPayload() {
  const family = atlas.families.f103;
  const profiles = {};
  const modelPinProfiles = {};
  const pinAliasMap = {};
  const modelProfileMap = {};

  f103Specs.forEach((spec) => {
    const xml = parseMcuXml(spec.xmlName);
    const profile = buildProfile(xml, "f103", spec);
    profiles[spec.id] = profile;
    spec.modelIds.forEach((modelId) => {
      modelProfileMap[modelId] = spec.id;
    });
  });

  family.models.forEach((model) => {
    const profileId = modelProfileMap[model.id];
    if (!profileId) {
      throw new Error(`Missing F103 pin profile mapping for model ${model.id}`);
    }
    modelPinProfiles[model.id] = {
      pinProfileIds: [profileId],
      defaultPinProfileId: profileId
    };
    getModelAliases(model).forEach((alias) => {
      pinAliasMap[normalize(alias)] = profileId;
    });
  });

  return { profiles, modelPinProfiles, pinAliasMap };
}

function buildF4FamilyPayload() {
  const family = atlas.families.f4;
  const profiles = {};
  const modelPinProfiles = {};
  const pinAliasMap = {};

  Object.entries(f4Specs).forEach(([modelId, modelSpec]) => {
    const profileIds = [];
    modelSpec.profiles.forEach((profileSpec) => {
      const xml = parseMcuXml(profileSpec.xmlName);
      profiles[profileSpec.id] = buildProfile(xml, "f4", profileSpec);
      profileIds.push(profileSpec.id);
      profileSpec.aliases.forEach((alias) => {
        pinAliasMap[normalize(alias)] = profileSpec.id;
      });
    });

    modelPinProfiles[modelId] = {
      pinProfileIds: profileIds,
      defaultPinProfileId: modelSpec.defaultProfileId
    };

    modelSpec.genericAliases.forEach((entry) => {
      pinAliasMap[normalize(entry.alias)] = entry.profileId;
    });
  });

  family.models.forEach((model) => {
    if (!modelPinProfiles[model.id]) {
      throw new Error(`Missing F4 pin profile mapping for model ${model.id}`);
    }
  });

  return { profiles, modelPinProfiles, pinAliasMap };
}

function parseMcuXml(xmlName) {
  const xmlPath = path.join(dbDir, xmlName);
  const xml = fs.readFileSync(xmlPath, "utf8");
  const mcuMatch = xml.match(/<Mcu\b([^>]*)>/);
  if (!mcuMatch) {
    throw new Error(`Unable to parse MCU header from ${xmlName}`);
  }
  const attrs = parseAttributes(mcuMatch[1]);
  const pins = [];
  const pinRegex = /<Pin\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Pin>)/g;
  let match = pinRegex.exec(xml);
  while (match) {
    const pinAttrs = parseAttributes(match[1]);
    const body = match[2] || "";
    const signals = [];
    const signalRegex = /<Signal\b([^>]*?)\/>/g;
    let signalMatch = signalRegex.exec(body);
    while (signalMatch) {
      signals.push(parseAttributes(signalMatch[1]));
      signalMatch = signalRegex.exec(body);
    }
    pins.push({
      name: pinAttrs.Name || "",
      position: String(pinAttrs.Position || ""),
      type: pinAttrs.Type || "",
      signals
    });
    match = pinRegex.exec(xml);
  }
  pins.sort((a, b) => comparePositions(a.position, b.position));
  return {
    xmlName,
    packageName: attrs.Package || "",
    refName: attrs.RefName || xmlName.replace(/\.xml$/i, ""),
    family: attrs.Family || "",
    line: attrs.Line || "",
    pins
  };
}

function comparePositions(left, right) {
  const leftText = String(left || "");
  const rightText = String(right || "");
  const leftNumber = Number(leftText);
  const rightNumber = Number(rightText);
  const leftNumeric = Number.isFinite(leftNumber) && leftText !== "";
  const rightNumeric = Number.isFinite(rightNumber) && rightText !== "";

  if (leftNumeric && rightNumeric) {
    return leftNumber - rightNumber;
  }
  if (leftNumeric) {
    return -1;
  }
  if (rightNumeric) {
    return 1;
  }
  return leftText.localeCompare(rightText, "en", { numeric: true });
}

function parseAttributes(fragment) {
  const attrs = {};
  fragment.replace(/([A-Za-z0-9_:+.-]+)="([^"]*)"/g, (_, key, value) => {
    attrs[key] = decodeXml(value);
    return "";
  });
  return attrs;
}

function decodeXml(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#10;/g, "\n");
}

function buildProfile(xml, familyId, spec) {
  let pins = xml.pins.map((pin) => buildPin(pin));

  if (spec.curatedC8) {
    pins = buildCuratedF103C8Pins();
  }

  return {
    id: spec.id,
    label: spec.label,
    packageName: xml.packageName,
    sourceTitle: familyId === "f103"
      ? `STM32CubeMX MCU DB / ${xml.refName}`
      : `STM32CubeMX MCU DB / ${xml.refName}`,
    sourceUrl: "",
    sourceNote: familyId === "f103"
      ? "引脚与可用信号来自本机 STM32CubeMX 官方 MCU 数据库；STM32F103C8T6 / CBT6 额外补入了常用 FT 与 remap 说明。"
      : "引脚与可用信号来自本机 STM32CubeMX 官方 MCU 数据库；I/O 电平列当前用于展示电气域与常规 I/O 描述。",
    profileNote: spec.profileNote || (
      familyId === "f103"
        ? "支持按引脚号、GPIO 名称或功能名查询。STM32F103C8T6 / CBT6 的 LQFP48 profile 已做额外人工校核。"
        : "支持按引脚号、GPIO 名称或功能名查询。F4 profile 重点覆盖当前工程里已经接入的具体料号与封装。"
    ),
    defaultAltLabel: familyId === "f103" && spec.curatedC8 ? "默认复用功能" : "复用功能 / Alternate",
    remapAltLabel: familyId === "f103" && spec.curatedC8 ? "重定义 / Remap 功能" : "补充功能 / 说明",
    tableAltLabel: familyId === "f103" && spec.curatedC8 ? "默认复用功能" : "复用功能 / Alternate",
    pins
  };
}

function buildPin(pin) {
  const rawSignals = pin.signals
    .map((signal) => signal.Name || "")
    .filter(Boolean)
    .filter((name) => name !== "GPIO");
  const signals = collapseSignals(rawSignals).map(formatSignalName);
  const primary = derivePrimary(pin.name, pin.type);
  return {
    pinNo: String(pin.position),
    name: pin.name,
    type: mapPinType(pin.type),
    ioLevel: inferIoLevel(pin.name, pin.type, signals),
    primary,
    defaultAlt: signals.join(" / "),
    remapAlt: "",
    notes: buildPinNotes(pin.name, pin.type, signals)
  };
}

function collapseSignals(signals) {
  const buckets = [];
  const adcIndex = new Map();

  signals.forEach((signal) => {
    const adcMatch = signal.match(/^ADC([123])_(.+)$/);
    if (adcMatch) {
      const key = `ADC_${adcMatch[2]}`;
      if (!adcIndex.has(key)) {
        adcIndex.set(key, { suffix: adcMatch[2], digits: new Set(), index: buckets.length });
        buckets.push(adcIndex.get(key));
      }
      adcIndex.get(key).digits.add(adcMatch[1]);
      return;
    }
    buckets.push(signal);
  });

  return buckets.map((entry) => {
    if (typeof entry === "string") {
      return entry;
    }
    const digits = Array.from(entry.digits).sort().join("");
    return `ADC${digits}_${entry.suffix}`;
  });
}

function formatSignalName(signal) {
  const directMap = {
    RCC_OSC_IN: "OSC_IN",
    RCC_OSC_OUT: "OSC_OUT",
    RCC_OSC32_IN: "OSC32_IN",
    RCC_OSC32_OUT: "OSC32_OUT",
    RCC_MCO: "MCO",
    SYS_WKUP: "WKUP",
    SYS_JTDI: "JTDI",
    SYS_NJTRST: "NJTRST",
    SYS_TRACECLK: "TRACECLK",
    SYS_TRACED0: "TRACED0",
    SYS_TRACED1: "TRACED1",
    SYS_TRACED2: "TRACED2",
    SYS_TRACED3: "TRACED3"
  };
  if (directMap[signal]) {
    return directMap[signal];
  }
  return signal
    .replace(/^SYS_JTMS-SWDIO$/, "JTMS / SWDIO")
    .replace(/^SYS_JTCK-SWCLK$/, "JTCK / SWCLK")
    .replace(/^SYS_JTDO-TRACESWO$/, "JTDO / TRACESWO");
}

function mapPinType(rawType) {
  const typeMap = {
    Power: "S",
    Boot: "I",
    Reset: "I/O",
    I: "I",
    O: "O",
    "I/O": "I/O"
  };
  return typeMap[rawType] || "I/O";
}

function derivePrimary(name, rawType) {
  if (!name) {
    return "-";
  }
  if (rawType === "Power" || rawType === "Boot" || rawType === "Reset") {
    return name;
  }
  return name.split("-")[0];
}

function inferIoLevel(name, rawType, signals) {
  if (rawType === "Power") {
    if (/^VBAT$/i.test(name)) {
      return "Backup supply";
    }
    if (/^VDDA$/i.test(name) || /^VSSA$/i.test(name) || /^VREF\+$/i.test(name)) {
      return "Analog 3.3V";
    }
    if (/^VCAP/i.test(name)) {
      return "Core regulator";
    }
    if (/^VDD/i.test(name) || /^VSS/i.test(name)) {
      return "3.3V rail";
    }
    return "-";
  }
  if (rawType === "Boot") {
    return "3.3V input";
  }
  if (rawType === "Reset") {
    return "3.3V reset";
  }
  if (/OSC/i.test(name)) {
    return "Clock domain";
  }
  if (signals.some((signal) => signal.startsWith("ADC") || signal.startsWith("DAC") || signal.includes("VREF"))) {
    return "3.3V analog / I/O";
  }
  return "3.3V I/O";
}

function buildPinNotes(name, rawType, signals) {
  if (rawType === "Power") {
    return "电源或地专用引脚。";
  }
  if (rawType === "Boot") {
    return "启动配置相关输入引脚。";
  }
  if (rawType === "Reset") {
    return "系统复位相关引脚。";
  }
  if (/OSC32/i.test(name)) {
    return "低速外部时钟相关引脚。";
  }
  if (/OSC/i.test(name)) {
    return "高速外部时钟相关引脚。";
  }
  if (/WKUP/i.test(name) || signals.includes("WKUP")) {
    return "带唤醒功能。";
  }
  if (signals.some((signal) => /SWDIO|SWCLK|JTMS|JTCK|JTDI|JTDO|TRACESWO|NJTRST/.test(signal))) {
    return "默认与调试接口相关。";
  }
  if (signals.some((signal) => signal.startsWith("USB") || signal.startsWith("USB_OTG"))) {
    return "包含 USB 相关功能。";
  }
  return "";
}

function buildCuratedF103C8Pins() {
  const pin = (pinNo, name, type, ioLevel, primary, defaultAlt, remapAlt, notes = "") => ({
    pinNo: String(pinNo),
    name,
    type,
    ioLevel,
    primary,
    defaultAlt,
    remapAlt,
    notes
  });

  return [
    pin(1, "VBAT", "S", "-", "VBAT", "-", "-", "后备电源输入。"),
    pin(2, "PC13-TAMPER-RTC", "I/O", "-", "PC13", "TAMPER-RTC", "-", "RTC / TAMPER 相关引脚。"),
    pin(3, "PC14-OSC32_IN", "I/O", "-", "PC14", "OSC32_IN", "-", "低速外部晶振输入。"),
    pin(4, "PC15-OSC32_OUT", "I/O", "-", "PC15", "OSC32_OUT", "-", "低速外部晶振输出。"),
    pin(5, "OSC_IN", "I", "-", "OSC_IN", "-", "PD0", "高速外部晶振输入；禁用 HSE 后可作为 PD0。"),
    pin(6, "OSC_OUT", "O", "-", "OSC_OUT", "-", "PD1", "高速外部晶振输出；禁用 HSE 后可作为 PD1。"),
    pin(7, "NRST", "I/O", "-", "NRST", "-", "-", "系统复位引脚。"),
    pin(8, "VSSA", "S", "-", "VSSA", "-", "-", "模拟地。"),
    pin(9, "VDDA", "S", "-", "VDDA", "-", "-", "模拟电源。"),
    pin(10, "PA0-WKUP", "I/O", "-", "PA0", "WKUP / USART2_CTS / ADC12_IN0 / TIM2_CH1_ETR", "-", "支持唤醒输入。"),
    pin(11, "PA1", "I/O", "-", "PA1", "USART2_RTS / ADC12_IN1 / TIM2_CH2", "-", ""),
    pin(12, "PA2", "I/O", "-", "PA2", "USART2_TX / ADC12_IN2 / TIM2_CH3", "-", "常用串口 TX。"),
    pin(13, "PA3", "I/O", "-", "PA3", "USART2_RX / ADC12_IN3 / TIM2_CH4", "-", "常用串口 RX。"),
    pin(14, "PA4", "I/O", "-", "PA4", "SPI1_NSS / USART2_CK / ADC12_IN4", "-", ""),
    pin(15, "PA5", "I/O", "-", "PA5", "SPI1_SCK / ADC12_IN5", "-", ""),
    pin(16, "PA6", "I/O", "-", "PA6", "SPI1_MISO / ADC12_IN6 / TIM3_CH1", "TIM1_BKIN", ""),
    pin(17, "PA7", "I/O", "-", "PA7", "SPI1_MOSI / ADC12_IN7 / TIM3_CH2", "TIM1_CH1N", ""),
    pin(18, "PB0", "I/O", "-", "PB0", "ADC12_IN8 / TIM3_CH3", "TIM1_CH2N", ""),
    pin(19, "PB1", "I/O", "-", "PB1", "ADC12_IN9 / TIM3_CH4", "TIM1_CH3N", ""),
    pin(20, "PB2 / BOOT1", "I/O", "FT", "PB2 / BOOT1", "-", "-", "启动配置相关引脚。"),
    pin(21, "PB10", "I/O", "FT", "PB10", "I2C2_SCL / USART3_TX", "TIM2_CH3", ""),
    pin(22, "PB11", "I/O", "FT", "PB11", "I2C2_SDA / USART3_RX", "TIM2_CH4", ""),
    pin(23, "VSS_1", "S", "-", "VSS_1", "-", "-", "数字地。"),
    pin(24, "VDD_1", "S", "-", "VDD_1", "-", "-", "数字电源。"),
    pin(25, "PB12", "I/O", "FT", "PB12", "SPI2_NSS / I2C2_SMBA / USART3_CK / TIM1_BKIN", "-", ""),
    pin(26, "PB13", "I/O", "FT", "PB13", "SPI2_SCK / USART3_CTS / TIM1_CH1N", "-", ""),
    pin(27, "PB14", "I/O", "FT", "PB14", "SPI2_MISO / USART3_RTS / TIM1_CH2N", "-", ""),
    pin(28, "PB15", "I/O", "FT", "PB15", "SPI2_MOSI / TIM1_CH3N", "-", ""),
    pin(29, "PA8", "I/O", "FT", "PA8", "USART1_CK / TIM1_CH1 / MCO", "-", ""),
    pin(30, "PA9", "I/O", "FT", "PA9", "USART1_TX / TIM1_CH2", "-", ""),
    pin(31, "PA10", "I/O", "FT", "PA10", "USART1_RX / TIM1_CH3", "-", ""),
    pin(32, "PA11", "I/O", "FT", "PA11", "USART1_CTS / CAN_RX / USB_DM / TIM1_CH4", "-", ""),
    pin(33, "PA12", "I/O", "FT", "PA12", "USART1_RTS / CAN_TX / USB_DP / TIM1_ETR", "-", ""),
    pin(34, "PA13 / JTMS-SWDIO", "I/O", "FT", "JTMS / SWDIO", "-", "PA13", "默认用于调试接口。"),
    pin(35, "VSS_2", "S", "-", "VSS_2", "-", "-", "数字地。"),
    pin(36, "VDD_2", "S", "-", "VDD_2", "-", "-", "数字电源。"),
    pin(37, "PA14 / JTCK-SWCLK", "I/O", "FT", "JTCK / SWCLK", "-", "PA14", "默认用于调试接口。"),
    pin(38, "PA15 / JTDI", "I/O", "FT", "JTDI", "-", "TIM2_CH1_ETR / PA15 / SPI1_NSS", "需关闭部分 JTAG 功能后复用。"),
    pin(39, "PB3 / JTDO-TRACESWO", "I/O", "FT", "JTDO / TRACESWO", "-", "TIM2_CH2 / PB3 / SPI1_SCK", "需关闭部分 JTAG 功能后复用。"),
    pin(40, "PB4 / NJTRST", "I/O", "FT", "NJTRST", "-", "TIM3_CH1 / PB4 / SPI1_MISO", "需关闭部分 JTAG 功能后复用。"),
    pin(41, "PB5", "I/O", "-", "PB5", "I2C1_SMBA", "TIM3_CH2 / SPI1_MOSI", ""),
    pin(42, "PB6", "I/O", "FT", "PB6", "I2C1_SCL / TIM4_CH1", "USART1_TX", ""),
    pin(43, "PB7", "I/O", "FT", "PB7", "I2C1_SDA / TIM4_CH2", "USART1_RX", ""),
    pin(44, "BOOT0", "I", "-", "BOOT0", "-", "-", "启动模式选择输入。"),
    pin(45, "PB8", "I/O", "FT", "PB8", "TIM4_CH3", "I2C1_SCL / CAN_RX", ""),
    pin(46, "PB9", "I/O", "FT", "PB9", "TIM4_CH4", "I2C1_SDA / CAN_TX", ""),
    pin(47, "VSS_3", "S", "-", "VSS_3", "-", "-", "数字地。"),
    pin(48, "VDD_3", "S", "-", "VDD_3", "-", "-", "数字电源。")
  ];
}

function getModelAliases(model) {
  return Array.from(new Set([
    model.id,
    model.short,
    model.title,
    model.heroTitle,
    ...(model.aliases || [])
  ].filter(Boolean)));
}

function normalize(text) {
  return String(text || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function renderOutput(payload) {
  const content = JSON.stringify(payload, null, 2);
  return `(function registerPinProfiles() {
  const atlas = window.CHIP_ATLAS = window.CHIP_ATLAS || { families: {} };
  const payload = ${content};

  Object.entries(payload).forEach(([familyId, familyPayload]) => {
    const family = atlas.families && atlas.families[familyId];
    if (!family || !family.modelMap) {
      return;
    }

    family.pinProfiles = Object.assign({}, family.pinProfiles, familyPayload.profiles);
    family.pinAliasMap = Object.assign({}, family.pinAliasMap, familyPayload.pinAliasMap);

    Object.entries(familyPayload.modelPinProfiles).forEach(([modelId, config]) => {
      if (!family.modelMap[modelId]) {
        return;
      }
      Object.assign(family.modelMap[modelId], config);
    });
  });
})();\n`;
}
