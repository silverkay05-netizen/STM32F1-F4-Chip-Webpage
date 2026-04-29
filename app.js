(function startChipAtlas() {
  const atlas = window.CHIP_ATLAS || { families: {} };
  const familyOrder = ["f103", "f4"].filter((id) => atlas.families[id]);
  const families = Object.fromEntries(familyOrder.map((id) => [id, atlas.families[id]]));

  Object.values(families).forEach((family) => {
    family.models.forEach((model) => {
      model.normalizedAliases = Array.from(new Set(
        [model.id, model.short, model.title, model.heroTitle, ...(model.aliases || [])]
          .filter(Boolean)
          .map(normalize)
      )).sort((a, b) => b.length - a.length);
    });
  });

  const el = {
    topbarNote: document.getElementById("topbarNote"),
    heroEyebrow: document.getElementById("heroEyebrow"),
    heroSku: document.getElementById("heroSku"),
    heroSubtitle: document.getElementById("heroSubtitle"),
    heroCopy: document.getElementById("heroCopy"),
    familyTabs: document.getElementById("familyTabs"),
    chipSearch: document.getElementById("chipSearch"),
    chipSelect: document.getElementById("chipSelect"),
    searchHint: document.getElementById("searchHint"),
    quickTags: document.getElementById("quickTags"),
    stats: document.getElementById("stats"),
    boardDesc: document.getElementById("boardDesc"),
    fabric: document.getElementById("fabric"),
    detailChip: document.getElementById("detailChip"),
    detailTitle: document.getElementById("detailTitle"),
    detailBase: document.getElementById("detailBase"),
    detailDesc: document.getElementById("detailDesc"),
    detailRoles: document.getElementById("detailRoles"),
    detailAvailability: document.getElementById("detailAvailability"),
    detailNote: document.getElementById("detailNote"),
    detailRegisters: document.getElementById("detailRegisters"),
    pinDesc: document.getElementById("pinDesc"),
    pinProfileSelect: document.getElementById("pinProfileSelect"),
    pinSearch: document.getElementById("pinSearch"),
    pinSelect: document.getElementById("pinSelect"),
    pinHint: document.getElementById("pinHint"),
    pinEmpty: document.getElementById("pinEmpty"),
    pinLayout: document.getElementById("pinLayout"),
    pinBadge: document.getElementById("pinBadge"),
    pinTitle: document.getElementById("pinTitle"),
    pinMeta: document.getElementById("pinMeta"),
    pinType: document.getElementById("pinType"),
    pinLevel: document.getElementById("pinLevel"),
    pinPrimary: document.getElementById("pinPrimary"),
    pinSource: document.getElementById("pinSource"),
    pinDefaultAlt: document.getElementById("pinDefaultAlt"),
    pinRemapAlt: document.getElementById("pinRemapAlt"),
    pinNotes: document.getElementById("pinNotes"),
    pinTableBody: document.getElementById("pinTableBody"),
    pinAltLabels: document.querySelectorAll(".pin-alt-group strong"),
    pinTableAltLabel: document.querySelector(".pin-table thead th:last-child"),
    catalogDesc: document.getElementById("catalogDesc"),
    catalog: document.getElementById("catalog"),
    sourceDesc: document.getElementById("sourceDesc"),
    sources: document.getElementById("sources"),
    footnote: document.getElementById("footnote")
  };

  let activeFamilyId = familyOrder[0];
  let activeModelId = families[activeFamilyId].defaultModelId;
  let activeModuleKey = families[activeFamilyId].modelMap[activeModelId].defaultModule;
  let activePinProfileId = "";
  let activePinKey = "";

  renderFamilyTabs();
  renderAll("可以直接输入具体料号，页面会自动匹配到对应系列和结构模板。");

  el.familyTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-family]");
    if (!button) {
      return;
    }
    const familyId = button.dataset.family;
    switchFamily(familyId, families[familyId].defaultModelId, `已切换到 ${families[familyId].displayName}。`);
  });

  el.chipSelect.addEventListener("change", (event) => {
    setActiveModel(activeFamilyId, event.target.value, `已切换到 ${families[activeFamilyId].modelMap[event.target.value].heroTitle}。`);
  });

  el.quickTags.addEventListener("click", (event) => {
    const button = event.target.closest("[data-model]");
    if (!button) {
      return;
    }
    setActiveModel(activeFamilyId, button.dataset.model, `快捷切换到 ${families[activeFamilyId].modelMap[button.dataset.model].heroTitle}。`);
  });

  el.catalog.addEventListener("click", (event) => {
    const button = event.target.closest("[data-model]");
    if (!button) {
      return;
    }
    setActiveModel(activeFamilyId, button.dataset.model, `已从型号矩阵切换到 ${families[activeFamilyId].modelMap[button.dataset.model].heroTitle}。`);
  });

  el.fabric.addEventListener("click", (event) => {
    const button = event.target.closest("[data-module]");
    if (!button) {
      return;
    }
    activeModuleKey = button.dataset.module;
    renderDetail();
  });

  el.chipSearch.addEventListener("input", (event) => {
    const value = event.target.value.trim();
    if (!value) {
      el.searchHint.textContent = families[activeFamilyId].searchHelp;
      return;
    }

    const match = findModelAcrossFamilies(value);
    if (!match) {
      el.searchHint.textContent = "未匹配到型号。可以试试完整料号、系列前缀或常见简写。";
      return;
    }

    const hint = match.familyId === activeFamilyId
      ? `识别成功：${value} → ${match.model.heroTitle}`
      : `识别成功：${value} → ${match.model.heroTitle}，并自动切换到 ${families[match.familyId].displayName}`;

    setActiveModel(
      match.familyId,
      match.model.id,
      hint,
      false,
      resolvePinProfileForInput(match.familyId, match.model.id, value)
    );
  });

  el.pinProfileSelect.addEventListener("change", (event) => {
    activePinProfileId = event.target.value;
    activePinKey = "";
    renderPinExplorer();
  });

  el.pinSelect.addEventListener("change", (event) => {
    activePinKey = event.target.value;
    renderPinExplorer();
  });

  el.pinSearch.addEventListener("input", () => {
    renderPinExplorer();
  });

  el.pinTableBody.addEventListener("click", (event) => {
    const row = event.target.closest("[data-pin]");
    if (!row) {
      return;
    }
    activePinKey = row.dataset.pin;
    renderPinExplorer();
  });

  function normalize(text) {
    return String(text || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function findModelAcrossFamilies(input) {
    const normalized = normalize(input);
    if (!normalized) {
      return null;
    }

    const order = [activeFamilyId, ...familyOrder.filter((id) => id !== activeFamilyId)];
    let best = null;

    order.forEach((familyId) => {
      families[familyId].models.forEach((model) => {
        model.normalizedAliases.forEach((alias) => {
          let score = 0;
          if (normalized === alias) {
            score = 3000 + alias.length;
          } else if (normalized.startsWith(alias)) {
            score = 2000 + alias.length;
          } else if (alias.startsWith(normalized)) {
            score = 1000 + alias.length;
          } else if (normalized.includes(alias)) {
            score = 500 + alias.length;
          }

          if (!best || score > best.score) {
            if (score > 0) {
              best = { familyId, model, score };
            }
          }
        });
      });
    });

    return best;
  }

  function renderFamilyTabs() {
    el.familyTabs.innerHTML = familyOrder.map((familyId) => {
      const family = families[familyId];
      return `<button class="family-btn" type="button" data-family="${familyId}">${family.name}</button>`;
    }).join("");
  }

  function switchFamily(familyId, modelId, hint) {
    activeFamilyId = familyId;
    activeModelId = modelId;
    activeModuleKey = families[familyId].modelMap[modelId].defaultModule;
    activePinProfileId = "";
    activePinKey = "";
    el.pinSearch.value = "";
    renderAll(hint);
  }

  function setActiveModel(familyId, modelId, hint, syncSearch = true, preferredPinProfileId = "") {
    activeFamilyId = familyId;
    activeModelId = modelId;
    activeModuleKey = families[familyId].modelMap[modelId].defaultModule || activeModuleKey;
    activePinProfileId = preferredPinProfileId;
    activePinKey = "";
    el.pinSearch.value = "";
    renderAll(hint, syncSearch);
  }

  function currentFamily() {
    return families[activeFamilyId];
  }

  function currentModel() {
    return currentFamily().modelMap[activeModelId];
  }

  function currentPinProfiles() {
    const family = currentFamily();
    const model = currentModel();
    if (!family.pinProfiles) {
      return [];
    }
    const ids = Array.from(new Set(
      [...(model.pinProfileIds || []), model.pinProfileId].filter(Boolean)
    ));
    return ids.map((id) => family.pinProfiles[id]).filter(Boolean);
  }

  function currentPinProfile() {
    const model = currentModel();
    const profiles = currentPinProfiles();
    if (!profiles.length) {
      return null;
    }

    const profileMap = Object.fromEntries(profiles.map((profile) => [profile.id, profile]));
    const fallbackId = model.defaultPinProfileId || model.pinProfileId || profiles[0].id;

    if (!profileMap[activePinProfileId]) {
      activePinProfileId = profileMap[fallbackId] ? fallbackId : profiles[0].id;
    }

    return profileMap[activePinProfileId] || profiles[0];
  }

  function resolvePinProfileForInput(familyId, modelId, input) {
    const family = families[familyId];
    const model = family.modelMap[modelId];
    const normalized = normalize(input);
    const allowed = new Set([...(model.pinProfileIds || []), model.pinProfileId].filter(Boolean));
    if (!normalized || !family.pinAliasMap) {
      return "";
    }
    const profileId = family.pinAliasMap[normalized];
    if (!profileId) {
      return "";
    }
    return !allowed.size || allowed.has(profileId) ? profileId : "";
  }

  function pinSearchText(pin) {
    return normalize([
      pin.pinNo,
      pin.name,
      pin.primary,
      pin.defaultAlt,
      pin.remapAlt
    ].join(" "));
  }

  function filterPins(profile, query) {
    const normalized = normalize(query);
    if (!normalized) {
      return profile.pins;
    }
    return profile.pins.filter((pin) => pinSearchText(pin).includes(normalized));
  }

  function renderAll(hintText = "", syncSearch = true) {
    const family = currentFamily();
    const model = currentModel();

    el.topbarNote.textContent = family.topbarNote;
    el.heroEyebrow.textContent = family.eyebrow;
    el.heroSku.textContent = model.heroTitle;
    el.heroSubtitle.innerHTML = model.subtitle.map((item) => `<span>${item}</span>`).join("");
    el.heroCopy.textContent = model.intro;
    el.catalogDesc.textContent = family.catalogDesc;
    el.sourceDesc.textContent = family.sourceDesc;
    el.footnote.textContent = family.footnote;
    el.pinDesc.textContent = "按引脚号、引脚名或功能关键字查询当前型号的封装定义、I/O 类型、电平和复用功能。";
    el.chipSearch.placeholder = family.searchPlaceholder;
    el.searchHint.textContent = hintText || family.searchHelp;

    if (syncSearch) {
      el.chipSearch.value = model.heroTitle;
    }

    renderStats(family, model);
    renderModelSelect(family, model);
    renderQuickTags(family, model);
    renderBoard(family, model);
    renderPinExplorer();
    renderCatalog(family, model);
    renderSources(family);
    renderDetail();

    document.querySelectorAll(".family-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.family === activeFamilyId);
    });
  }

  function renderModelSelect(family, model) {
    el.chipSelect.innerHTML = family.models.map((item) => `
      <option value="${item.id}" ${item.id === model.id ? "selected" : ""}>${item.selectLabel}</option>
    `).join("");
  }

  function renderQuickTags(family, model) {
    el.quickTags.innerHTML = family.quickIds.map((id) => {
      const item = family.modelMap[id];
      return `<button class="tag ${item.id === model.id ? "active" : ""}" type="button" data-model="${item.id}">${item.quickLabel}</button>`;
    }).join("");
  }

  function renderStats(family, model) {
    el.stats.innerHTML = model.stats.map((card) => `
      <div class="stat-card">
        <div class="stat-label">${card.label}</div>
        <div class="stat-value">${card.value}</div>
        <div class="stat-meta">${card.meta}</div>
      </div>
    `).join("");
  }

  function renderBoard(family, model) {
    const layout = family.layouts[model.layout];
    el.boardDesc.textContent = model.boardCopy;

    el.fabric.innerHTML = layout.map((lane) => `
      <section class="lane" style="--lane:${lane.accent}">
        <div class="lane-label">${lane.label}</div>
        <div class="lane-subtitle">${lane.subtitle}</div>
        <div class="track"></div>
        <div class="lane-grid">
          ${lane.items.map((item) => {
            const module = family.modules[item.key];
            return `
              <button class="module-card" type="button" data-module="${item.key}" style="--accent:${module.accent};--span:${item.span || 2};">
                <div class="module-head">
                  <div>
                    <h3 class="module-name">${module.title}</h3>
                    <p class="module-base">${module.base}</p>
                  </div>
                  <div class="module-lane">${module.lane}</div>
                </div>
                <p class="module-note">${module.note}</p>
                <div class="register-preview">${module.registers.slice(0, 3).map((register) => `
                  <div class="register-line">
                    <span>${register.name}</span>
                    <span>${register.offset}</span>
                  </div>
                `).join("")}</div>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `).join("");
  }

  function renderPinExplorer() {
    const model = currentModel();
    const profiles = currentPinProfiles();
    const profile = currentPinProfile();
    const query = el.pinSearch.value.trim();

    if (el.pinAltLabels[0]) {
      el.pinAltLabels[0].textContent = (profile && profile.defaultAltLabel) || "复用功能 / Alternate";
    }
    if (el.pinAltLabels[1]) {
      el.pinAltLabels[1].textContent = (profile && profile.remapAltLabel) || "补充功能 / 说明";
    }
    if (el.pinTableAltLabel) {
      el.pinTableAltLabel.textContent = (profile && profile.tableAltLabel) || "复用功能 / Alternate";
    }

    if (!profile) {
      activePinProfileId = "";
      activePinKey = "";
      el.pinProfileSelect.innerHTML = `<option>当前型号暂未录入封装 profile</option>`;
      el.pinProfileSelect.disabled = true;
      el.pinSelect.innerHTML = `<option>当前型号暂未录入引脚表</option>`;
      el.pinSelect.disabled = true;
      el.pinSearch.disabled = true;
      el.pinHint.textContent = "目前已录入 STM32F103C8T6 / CBT6 的 LQFP48 引脚定义，可先切换到该型号查看。";
      el.pinEmpty.textContent = "当前选中的型号还没有录入引脚数据，所以这里暂时无法查询引脚号与复用功能。后续只要继续补充 pin profile，就能复用同一套查询界面。";
      el.pinEmpty.classList.add("show");
      el.pinLayout.classList.add("hidden");
      el.pinDesc.textContent = "当前型号暂无引脚表数据。";
      return;
    }

    const filteredPins = filterPins(profile, query);
    const pinMap = Object.fromEntries(profile.pins.map((pin) => [pin.pinNo, pin]));

    if (!pinMap[activePinKey]) {
      activePinKey = profile.pins[0].pinNo;
    }
    if (filteredPins.length && !filteredPins.some((pin) => pin.pinNo === activePinKey)) {
      activePinKey = filteredPins[0].pinNo;
    }

    const selectedPin = pinMap[activePinKey] || filteredPins[0] || profile.pins[0];
    if (selectedPin) {
      activePinKey = selectedPin.pinNo;
    }

    el.pinProfileSelect.disabled = profiles.length <= 1;
    el.pinProfileSelect.innerHTML = profiles.map((item) => `
      <option value="${item.id}" ${item.id === activePinProfileId ? "selected" : ""}>${item.label}</option>
    `).join("");
    el.pinSelect.disabled = false;
    el.pinSearch.disabled = false;
    el.pinEmpty.classList.remove("show");
    el.pinLayout.classList.remove("hidden");
    el.pinDesc.textContent = `${profile.label} · ${profile.profileNote}`;
    el.pinHint.textContent = filteredPins.length
      ? `当前匹配 ${filteredPins.length} 个引脚。可输入引脚号、引脚名或功能关键字，例如 12 / PA2 / USART2_TX。`
      : "没有找到匹配引脚。可以试试引脚号、GPIO 名或功能名。";

    el.pinSelect.innerHTML = profile.pins.map((pin) => `
      <option value="${pin.pinNo}" ${pin.pinNo === activePinKey ? "selected" : ""}>Pin ${pin.pinNo} · ${pin.name} · ${pin.primary}</option>
    `).join("");

    if (selectedPin) {
      el.pinBadge.textContent = `${profile.packageName} · Pin ${selectedPin.pinNo}`;
      el.pinBadge.style.setProperty("--detail-accent", "var(--apb2)");
      el.pinTitle.textContent = `${selectedPin.name}`;
      el.pinTitle.style.setProperty("--detail-accent", "var(--apb2)");
      el.pinMeta.textContent = `${model.heroTitle} · ${profile.label}`;
      el.pinType.textContent = selectedPin.type;
      el.pinLevel.textContent = selectedPin.ioLevel || "-";
      el.pinPrimary.textContent = selectedPin.primary || "-";
      el.pinSource.textContent = `${profile.sourceTitle} / ${profile.packageName}`;
      el.pinDefaultAlt.textContent = selectedPin.defaultAlt || "-";
      el.pinRemapAlt.textContent = selectedPin.remapAlt || "-";
      el.pinNotes.textContent = selectedPin.notes || profile.sourceNote || profile.profileNote;
    }

    el.pinTableBody.innerHTML = filteredPins.map((pin) => `
      <tr class="${pin.pinNo === activePinKey ? "active" : ""}" data-pin="${pin.pinNo}">
        <td><strong>${pin.pinNo}</strong></td>
        <td>${pin.name}</td>
        <td>${pin.type}</td>
        <td>${pin.ioLevel || "-"}</td>
        <td>${pin.primary || "-"}</td>
        <td>${pin.defaultAlt || "-"}</td>
      </tr>
    `).join("");
  }

  function renderDetail() {
    const family = currentFamily();
    const model = currentModel();
    if (!family.modules[activeModuleKey]) {
      activeModuleKey = model.defaultModule;
    }
    const module = family.modules[activeModuleKey];

    document.querySelectorAll(".module-card").forEach((button) => {
      button.classList.toggle("active", button.dataset.module === activeModuleKey);
    });

    el.detailChip.textContent = `${family.name} · ${module.lane}`;
    el.detailChip.style.setProperty("--detail-accent", module.accent);
    el.detailTitle.textContent = module.title;
    el.detailTitle.style.setProperty("--detail-accent", module.accent);
    el.detailBase.textContent = module.base;
    el.detailDesc.textContent = module.description;
    el.detailRoles.textContent = module.roles;
    el.detailAvailability.textContent = module.availability;
    el.detailNote.textContent = module.detailNote;
    el.detailRegisters.innerHTML = module.registers.map((register) => `
      <li>
        <code>${register.name}</code> @ <code>${register.offset}</code><br>
        ${register.desc}
      </li>
    `).join("");
  }

  function renderCatalog(family, model) {
    el.catalog.innerHTML = family.catalogGroups.map((group) => `
      <section class="catalog-group">
        <div class="catalog-group-head">
          <div>
            <h3>${group.title}</h3>
            <p>${group.description}</p>
          </div>
        </div>
        <div class="catalog-grid">
          ${group.ids.map((id) => {
            const item = family.modelMap[id];
            return `
              <button class="catalog-card ${item.id === model.id ? "active" : ""}" type="button" data-model="${item.id}">
                <strong>${item.catalogTitle}</strong>
                ${item.catalogLines.map((line) => `<span>${line}</span>`).join("")}
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `).join("");
  }

  function renderSources(family) {
    el.sources.innerHTML = family.sources.map((source) => `
      <li>
        <strong>${source.title}</strong><br>
        <a href="${source.url}" target="_blank" rel="noreferrer">${source.url}</a><br>
        <span>${source.note}</span>
      </li>
    `).join("");
  }
})();
