(function () {
  var body = document.body;
  if (!body) return;

  var locale = body.getAttribute("data-locale") || "zh";
  var page = body.getAttribute("data-cloud-page") || "agents";
  var appRoot = document.getElementById("cloud-app");
  var authHero = document.getElementById("cloud-auth-hero");
  var statusNote = document.getElementById("cloud-status-note");
  var navAuth = document.getElementById("cloud-nav-auth");
  var heroAuth = document.getElementById("cloud-hero-auth");

  if (!appRoot || !authHero) return;

  var copy = {
    zh: {
      launchUrl: {
        agents: "http://localhost:3000/cloud/agents",
        credits: "http://localhost:3000/cloud/credits"
      },
      linked: "公社已接入",
      loadFail: "本地后端暂时没响应，请先运行 `npm start`，或者双击启动脚本。",
      fileMode: "当前页面是通过 `file://` 打开的，后端接口不会生效。请先启动本地服务，再从这里进入：",
      loadAgents: "正在从拖拉机云读取生产队状态...",
      loadCredits: "正在读取工分账本与补仓规则...",
      actionSaved: "操作已提交，生产队状态已刷新。",
      topupSaved: "自动买种子规则已经保存。",
      agents: {
        title: "云端生产队",
        subtitle: "接入后的生产队会直接展示本地后端里的实时状态、预算、磨损和运转情况。",
        liveBadge: "本地后端已接通",
        profileTitle: "公社档案",
        quickTitle: "本地运行方式",
        total: "总农夫",
        running: "干活中",
        paused: "歇工中",
        error: "故障",
        workerDeck: "农夫与农机名册",
        workerDeckBadge: "实时状态",
        lastSeen: "最后上报",
        task: "当前任务",
        model: "驱动模型",
        budget: "预算剩余",
        wear: "农机健康",
        usage: "24h 成本",
        org: "所属公社",
        account: "接入账号",
        chain: "耕种链路",
        session: "会话状态",
        workerRights: "管理权限",
        tractor: "拖拉机云直连",
        launchHint: "以后不要再直接点 `file://`，请从本地服务地址打开整站。",
        openApp: "打开本地项目",
        noAgents: "当前还没有生产队成员。"
      },
      credits: {
        title: "工分与粮票账本",
        subtitle: "这里已经接上本地持久化数据，可以看余额、账单和自动补仓规则。",
        liveBadge: "本地账本已接通",
        profileTitle: "粮仓账户",
        ledgerTitle: "最近账单",
        autoTitle: "自动买种子",
        monthlyTitle: "本月概览",
        totalCredits: "当前工分",
        creditUsd: "折合美元",
        seedBalance: "种子余额",
        grainBalance: "粮票余额",
        monthUsed: "本月已用",
        autoStatus: "自动补仓",
        threshold: "触发阈值",
        amount: "补仓数量",
        enable: "开启余额不足自动买种子",
        save: "保存规则",
        source: "来源",
        description: "说明",
        createdAt: "记账时间",
        account: "接入账号",
        commune: "所属公社",
        status: "仓储状态",
        billing: "计费模式",
        openApp: "打开本地项目",
        noLedger: "账本还没有新的记录。"
      },
      statusLabels: {
        running: "干活中",
        paused: "歇工中",
        error: "故障",
        active: "运行中"
      },
      actions: {
        start: "启动",
        pause: "暂停",
        restart: "重启",
        resume: "继续"
      }
    },
    en: {
      launchUrl: {
        agents: "http://localhost:3000/en/cloud/agents",
        credits: "http://localhost:3000/en/cloud/credits"
      },
      linked: "Commune Linked",
      loadFail: "The local backend is not responding yet. Run `npm start` or open the launcher script first.",
      fileMode: "This page is being opened via `file://`, so backend APIs cannot load. Start the local app and open:",
      loadAgents: "Loading live commune workers from TractorCloud...",
      loadCredits: "Loading credits, grain tickets, and refill rules...",
      actionSaved: "Action sent. The worker roster has been refreshed.",
      topupSaved: "Auto top-up rules saved.",
      agents: {
        title: "Cloud Agents",
        subtitle: "Once connected, this page shows live local backend data for worker status, budgets, machinery wear, and uptime.",
        liveBadge: "Local backend online",
        profileTitle: "Commune Profile",
        quickTitle: "How to run locally",
        total: "Total Workers",
        running: "Running",
        paused: "Paused",
        error: "Fault",
        workerDeck: "Worker and Machine Roster",
        workerDeckBadge: "Live states",
        lastSeen: "Last Seen",
        task: "Current Task",
        model: "Model",
        budget: "Budget Left",
        wear: "Machine Health",
        usage: "24h Cost",
        org: "Commune",
        account: "Linked Account",
        chain: "Chain",
        session: "Session",
        workerRights: "Permissions",
        tractor: "Direct TractorCloud link",
        launchHint: "Do not open the app from `file://` anymore. Use the local server URL instead.",
        openApp: "Open Local App",
        noAgents: "No workers have been provisioned yet."
      },
      credits: {
        title: "Work Points and Grain Ledger",
        subtitle: "This page now reads persistent local data for balances, invoices, and auto-top-up rules.",
        liveBadge: "Local ledger online",
        profileTitle: "Silo Account",
        ledgerTitle: "Recent Ledger",
        autoTitle: "Auto Seed Refill",
        monthlyTitle: "Monthly Overview",
        totalCredits: "Credit Balance",
        creditUsd: "USD Value",
        seedBalance: "Seed Balance",
        grainBalance: "Grain Tickets",
        monthUsed: "Used This Month",
        autoStatus: "Auto Top-up",
        threshold: "Trigger Threshold",
        amount: "Top-up Amount",
        enable: "Enable automatic seed refill when the balance falls below the threshold",
        save: "Save Rules",
        source: "Source",
        description: "Description",
        createdAt: "Created",
        account: "Linked Account",
        commune: "Commune",
        status: "Storage State",
        billing: "Billing Mode",
        openApp: "Open Local App",
        noLedger: "No ledger entries yet."
      },
      statusLabels: {
        running: "Running",
        paused: "Paused",
        error: "Fault",
        active: "Active"
      },
      actions: {
        start: "Start",
        pause: "Pause",
        restart: "Restart",
        resume: "Resume"
      }
    }
  };

  var text = copy[locale] || copy.zh;
  var launchUrl = text.launchUrl[page];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtNumber(value) {
    return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US").format(Number(value || 0));
  }

  function fmtUsd(value) {
    return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function fmtDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function fmtPct(value) {
    return Number(value || 0).toFixed(Number(value || 0) % 1 ? 1 : 0) + "%";
  }

  function setNote(kind, html) {
    if (!statusNote) return;
    statusNote.hidden = false;
    statusNote.className = "cp-note" + (kind ? " cp-note--" + kind : "");
    statusNote.innerHTML = html;
  }

  function clearNote() {
    if (!statusNote) return;
    statusNote.hidden = true;
    statusNote.className = "cp-note";
    statusNote.innerHTML = "";
  }

  function replaceAuthButton(node, nextText, href) {
    if (!node) return null;
    var clone = node.cloneNode(true);
    clone.textContent = nextText || clone.textContent;
    clone.removeAttribute("data-cloud-auth");
    clone.href = href || "#";
    clone.style.cursor = href ? "pointer" : "default";
    node.replaceWith(clone);
    return clone;
  }

  function setLinkedState() {
    navAuth = replaceAuthButton(navAuth, text.linked, page === "agents" ? "agents.html" : "credits.html");
  }

  async function requestJson(url, options) {
    var response = await fetch(
      url,
      Object.assign({ credentials: "same-origin" }, options || {})
    );
    var data = {};
    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }
    if (!response.ok) {
      var err = new Error(data.error || ("HTTP " + response.status));
      err.status = response.status;
      throw err;
    }
    return data;
  }

  function renderFileMode() {
    replaceAuthButton(navAuth, text[page].openApp, launchUrl);
    replaceAuthButton(heroAuth, text[page].openApp, launchUrl);
    setNote(
      "error",
      escapeHtml(text.fileMode) +
        ' <a href="' +
        launchUrl +
        '">' +
        escapeHtml(launchUrl) +
        "</a>"
    );
  }

  function renderServerDown() {
    replaceAuthButton(navAuth, text[page].openApp, launchUrl);
    replaceAuthButton(heroAuth, text[page].openApp, launchUrl);
    setNote(
      "error",
      escapeHtml(text.loadFail) +
        ' <a href="' +
        launchUrl +
        '">' +
        escapeHtml(launchUrl) +
        "</a>"
    );
  }

  function workerActions(status) {
    if (status === "paused") {
      return ["resume", "restart"];
    }
    if (status === "error") {
      return ["start", "restart"];
    }
    return ["pause", "restart"];
  }

  function renderAgents(session, data) {
    var pageText = text.agents;
    var items = data.items || [];
    var cards = items.length
      ? items
          .map(function (item) {
            return (
              '<div class="cp-agent" data-agent-id="' +
              escapeHtml(item.id) +
              '">' +
              '<div class="cp-agent__head">' +
              '<div class="cp-agent__name">' +
              escapeHtml(item.name) +
              "</div>" +
              '<div class="cp-agent__status cp-agent__status--' +
              escapeHtml(item.status) +
              '">' +
              escapeHtml(text.statusLabels[item.status] || item.status) +
              "</div>" +
              "</div>" +
              '<div class="cp-agent__body">' +
              '<div class="cp-agent__row"><span>' +
              escapeHtml(pageText.task) +
              "</span><strong>" +
              escapeHtml(item.currentTask) +
              "</strong></div>" +
              '<div class="cp-agent__row"><span>' +
              escapeHtml(pageText.model) +
              "</span><strong>" +
              escapeHtml(item.model + " · v" + item.version) +
              "</strong></div>" +
              '<div class="cp-agent__row"><span>' +
              escapeHtml(pageText.budget) +
              "</span><strong>" +
              escapeHtml(fmtUsd(item.budget.remainingUsd)) +
              "</strong></div>" +
              '<div class="cp-agent__row"><span>' +
              escapeHtml(pageText.wear) +
              "</span><strong>" +
              escapeHtml(fmtPct(item.wear.healthPct)) +
              "</strong></div>" +
              '<div class="cp-agent__row"><span>' +
              escapeHtml(pageText.usage) +
              "</span><strong>" +
              escapeHtml(fmtUsd(item.usage.cost24hUsd)) +
              "</strong></div>" +
              '<div class="cp-agent__row"><span>' +
              escapeHtml(pageText.lastSeen) +
              "</span><strong>" +
              escapeHtml(fmtDate(item.lastSeenAt)) +
              "</strong></div>" +
              "</div>" +
              '<div class="cp-actions">' +
              workerActions(item.status)
                .map(function (action) {
                  return (
                    '<button class="cp-btn' +
                    (action === "restart" ? "" : " cp-btn--accent") +
                    '" data-agent-action="' +
                    escapeHtml(action) +
                    '" data-agent-id="' +
                    escapeHtml(item.id) +
                    '">' +
                    escapeHtml(text.actions[action] || action) +
                    "</button>"
                  );
                })
                .join("") +
              "</div>" +
              "</div>"
            );
          })
          .join("")
      : '<div class="cp-empty">' + escapeHtml(pageText.noAgents) + "</div>";

    appRoot.innerHTML =
      '<div class="cp-shell">' +
      '<div class="cp-app-header">' +
      "<div>" +
      '<div class="cp-app-header__title">' +
      escapeHtml(pageText.title) +
      "</div>" +
      '<div class="cp-app-header__sub">' +
      escapeHtml(pageText.subtitle) +
      "</div>" +
      "</div>" +
      '<a class="cp-btn cp-btn--accent" href="' +
      launchUrl +
      '">' +
      escapeHtml(pageText.openApp) +
      "</a>" +
      "</div>" +
      '<div class="cp-grid">' +
      '<div class="cp-col-8">' +
      '<div class="cp-card">' +
      '<div class="cp-card__head"><h2>' +
      escapeHtml(pageText.profileTitle) +
      '</h2><span class="cp-card__head-badge">' +
      escapeHtml(pageText.liveBadge) +
      "</span></div>" +
      '<div class="cp-profile">' +
      '<div class="cp-profile__avatar">' +
      (locale === "zh" ? "社" : "FA") +
      "</div>" +
      "<div>" +
      '<div class="cp-profile__name">' +
      escapeHtml(session.user.name) +
      "</div>" +
      '<div class="cp-profile__org">' +
      escapeHtml(session.org.name) +
      "</div>" +
      '<div class="cp-meta-badges">' +
      '<span class="cp-badge cp-badge--accent">' +
      escapeHtml(pageText.chain) +
      ": BSC Chain</span>" +
      '<span class="cp-badge">' +
      escapeHtml(pageText.session) +
      ": " +
      escapeHtml(pageText.tractor) +
      "</span>" +
      '<span class="cp-badge">' +
      escapeHtml(pageText.workerRights) +
      ": manage agents</span>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="cp-col-4">' +
      '<div class="cp-card">' +
      '<div class="cp-card__head"><h2>' +
      escapeHtml(pageText.quickTitle) +
      "</h2></div>" +
      '<div class="cp-card__body">' +
      '<div class="cp-inline-list">' +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.account) +
      '</div><div class="cp-inline-item__value">' +
      escapeHtml(session.user.email) +
      "</div></div>" +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.org) +
      '</div><div class="cp-inline-item__value">' +
      escapeHtml(session.org.name) +
      "</div></div>" +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.launchHint) +
      '</div><div class="cp-inline-item__value"><a class="cp-muted-link" href="' +
      launchUrl +
      '">' +
      escapeHtml(launchUrl) +
      "</a></div></div>" +
      "</div></div></div></div>" +
      '<div class="cp-col-12">' +
      '<div class="cp-card"><div class="cp-card__head"><h2>' +
      escapeHtml(pageText.liveBadge) +
      "</h2></div>" +
      '<div class="cp-card__body"><div class="cp-kpis">' +
      '<div class="cp-kpi"><div class="cp-kpi__label">' +
      escapeHtml(pageText.total) +
      '</div><div class="cp-kpi__value">' +
      escapeHtml(fmtNumber(data.summary.total)) +
      "</div></div>" +
      '<div class="cp-kpi"><div class="cp-kpi__label">' +
      escapeHtml(pageText.running) +
      '</div><div class="cp-kpi__value">' +
      escapeHtml(fmtNumber(data.summary.running)) +
      "</div></div>" +
      '<div class="cp-kpi"><div class="cp-kpi__label">' +
      escapeHtml(pageText.paused) +
      '</div><div class="cp-kpi__value">' +
      escapeHtml(fmtNumber(data.summary.paused)) +
      "</div></div>" +
      '<div class="cp-kpi"><div class="cp-kpi__label">' +
      escapeHtml(pageText.error) +
      '</div><div class="cp-kpi__value">' +
      escapeHtml(fmtNumber(data.summary.error)) +
      "</div></div>" +
      "</div></div></div></div>" +
      '<div class="cp-col-12">' +
      '<div class="cp-card"><div class="cp-card__head"><h2>' +
      escapeHtml(pageText.workerDeck) +
      '</h2><span class="cp-card__head-badge">' +
      escapeHtml(pageText.workerDeckBadge) +
      "</span></div>" +
      '<div class="cp-agents">' +
      cards +
      "</div></div></div>" +
      "</div>" +
      "</div>";
  }

  function renderCredits(session, overview, ledger, autoTopup) {
    var pageText = text.credits;
    var rows = (ledger.items || []).length
      ? ledger.items
          .map(function (item) {
            var positive = Number(item.amountCredits) >= 0;
            return (
              '<div class="cp-ledger__row">' +
              '<div class="cp-ledger__meta"><div class="cp-ledger__title">' +
              escapeHtml(item.source) +
              '</div><div class="cp-ledger__sub">' +
              escapeHtml(pageText.source) +
              "</div></div>" +
              '<div class="cp-ledger__meta"><div class="cp-ledger__title">' +
              escapeHtml(item.description) +
              '</div><div class="cp-ledger__sub">' +
              escapeHtml(pageText.description) +
              "</div></div>" +
              '<div class="cp-ledger__meta"><div class="cp-ledger__title">' +
              escapeHtml(fmtDate(item.createdAt)) +
              '</div><div class="cp-ledger__sub">' +
              escapeHtml(pageText.createdAt) +
              "</div></div>" +
              '<div class="cp-ledger__amount ' +
              (positive ? "cp-ledger__amount--pos" : "cp-ledger__amount--neg") +
              '">' +
              escapeHtml((positive ? "+" : "") + fmtNumber(item.amountCredits) + " cr") +
              "<br />" +
              escapeHtml(fmtUsd(item.amountUsd)) +
              "</div>" +
              "</div>"
            );
          })
          .join("")
      : '<div class="cp-empty">' + escapeHtml(pageText.noLedger) + "</div>";

    appRoot.innerHTML =
      '<div class="cp-shell">' +
      '<div class="cp-app-header">' +
      "<div>" +
      '<div class="cp-app-header__title">' +
      escapeHtml(pageText.title) +
      "</div>" +
      '<div class="cp-app-header__sub">' +
      escapeHtml(pageText.subtitle) +
      "</div>" +
      "</div>" +
      '<a class="cp-btn cp-btn--accent" href="' +
      launchUrl +
      '">' +
      escapeHtml(pageText.openApp) +
      "</a>" +
      "</div>" +
      '<div class="cp-grid">' +
      '<div class="cp-col-8">' +
      '<div class="cp-card"><div class="cp-card__head"><h2>' +
      escapeHtml(pageText.profileTitle) +
      '</h2><span class="cp-card__head-badge">' +
      escapeHtml(pageText.liveBadge) +
      "</span></div>" +
      '<div class="cp-profile">' +
      '<div class="cp-profile__avatar">' +
      (locale === "zh" ? "仓" : "CR") +
      "</div>" +
      "<div>" +
      '<div class="cp-profile__name">' +
      escapeHtml(session.user.name) +
      "</div>" +
      '<div class="cp-profile__org">' +
      escapeHtml(session.org.name) +
      "</div>" +
      '<div class="cp-meta-badges">' +
      '<span class="cp-badge cp-badge--accent">' +
      escapeHtml(pageText.account) +
      ": " +
      escapeHtml(session.user.email) +
      "</span>" +
      '<span class="cp-badge">' +
      escapeHtml(pageText.commune) +
      ": " +
      escapeHtml(session.org.name) +
      "</span>" +
      '<span class="cp-badge">' +
      escapeHtml(pageText.billing) +
      ': local JSON ledger</span>' +
      "</div>" +
      "</div></div></div></div>" +
      '<div class="cp-col-4">' +
      '<div class="cp-card"><div class="cp-card__head"><h2>' +
      escapeHtml(pageText.monthlyTitle) +
      "</h2></div>" +
      '<div class="cp-card__body">' +
      '<div class="cp-inline-list">' +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.monthUsed) +
      '</div><div class="cp-inline-item__value">' +
      escapeHtml(fmtNumber(overview.monthlyUsedCredits) + " cr") +
      "</div></div>" +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.autoStatus) +
      '</div><div class="cp-inline-item__value">' +
      escapeHtml(autoTopup.enabled ? (locale === "zh" ? "已开启" : "Enabled") : (locale === "zh" ? "已关闭" : "Disabled")) +
      "</div></div>" +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.status) +
      '</div><div class="cp-inline-item__value">' +
      escapeHtml(locale === "zh" ? "本地持久化已生效" : "Local persistence active") +
      "</div></div>" +
      "</div></div></div></div>" +
      '<div class="cp-col-12">' +
      '<div class="cp-card"><div class="cp-card__head"><h2>' +
      escapeHtml(pageText.liveBadge) +
      "</h2></div><div class=\"cp-card__body\"><div class=\"cp-kpis\">" +
      '<div class="cp-kpi"><div class="cp-kpi__label">' +
      escapeHtml(pageText.totalCredits) +
      '</div><div class="cp-kpi__value">' +
      escapeHtml(fmtNumber(overview.creditBalance)) +
      '</div><div class="cp-kpi__sub">credits</div></div>' +
      '<div class="cp-kpi"><div class="cp-kpi__label">' +
      escapeHtml(pageText.creditUsd) +
      '</div><div class="cp-kpi__value">' +
      escapeHtml(fmtUsd(overview.creditBalanceUsd)) +
      "</div></div>" +
      '<div class="cp-kpi"><div class="cp-kpi__label">' +
      escapeHtml(pageText.seedBalance) +
      '</div><div class="cp-kpi__value">' +
      escapeHtml(fmtNumber(overview.seedBalance)) +
      "</div></div>" +
      '<div class="cp-kpi"><div class="cp-kpi__label">' +
      escapeHtml(pageText.grainBalance) +
      '</div><div class="cp-kpi__value">' +
      escapeHtml(fmtNumber(overview.grainTicketBalance)) +
      "</div></div>" +
      "</div></div></div></div>" +
      '<div class="cp-col-6">' +
      '<div class="cp-card"><div class="cp-card__head"><h2>' +
      escapeHtml(pageText.autoTitle) +
      "</h2></div><div class=\"cp-card__body\">" +
      '<form id="cloud-auto-topup-form" class="cp-form">' +
      '<label class="cp-check"><input type="checkbox" name="enabled"' +
      (autoTopup.enabled ? " checked" : "") +
      " />" +
      escapeHtml(pageText.enable) +
      "</label>" +
      '<div class="cp-form-grid">' +
      '<label class="cp-field"><span>' +
      escapeHtml(pageText.threshold) +
      '</span><input type="number" name="threshold" min="0" step="1" value="' +
      escapeHtml(autoTopup.threshold) +
      '" /></label>' +
      '<label class="cp-field"><span>' +
      escapeHtml(pageText.amount) +
      '</span><input type="number" name="topupAmount" min="0" step="1" value="' +
      escapeHtml(autoTopup.topupAmount) +
      '" /></label>' +
      "</div>" +
      '<button class="cp-btn cp-btn--accent" type="submit">' +
      escapeHtml(pageText.save) +
      "</button></form></div></div></div>" +
      '<div class="cp-col-6">' +
      '<div class="cp-card"><div class="cp-card__head"><h2>' +
      escapeHtml(pageText.monthlyTitle) +
      "</h2></div><div class=\"cp-card__body\">" +
      '<div class="cp-inline-list">' +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.monthUsed) +
      '</div><div class="cp-inline-item__value">' +
      escapeHtml(fmtUsd(overview.monthlyUsedUsd)) +
      "</div></div>" +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.threshold) +
      '</div><div class="cp-inline-item__value">' +
      escapeHtml(fmtNumber(autoTopup.threshold) + " cr") +
      "</div></div>" +
      '<div class="cp-inline-item"><div class="cp-inline-item__label">' +
      escapeHtml(pageText.amount) +
      '</div><div class="cp-inline-item__value">' +
      escapeHtml(fmtNumber(autoTopup.topupAmount) + " cr") +
      "</div></div>" +
      "</div></div></div></div>" +
      '<div class="cp-col-12">' +
      '<div class="cp-card"><div class="cp-card__head"><h2>' +
      escapeHtml(pageText.ledgerTitle) +
      "</h2></div><div class=\"cp-card__body\"><div class=\"cp-ledger\">" +
      rows +
      "</div></div></div></div>" +
      "</div>" +
      "</div>";
  }

  async function loadSession() {
    if (window.location.protocol === "file:") {
      renderFileMode();
      return null;
    }
    try {
      return await requestJson("/api/cloud/session");
    } catch (error) {
      renderServerDown();
      return null;
    }
  }

  async function refreshAgents(session) {
    setNote("", escapeHtml(text.loadAgents));
    var data = await requestJson("/api/cloud/agents");
    clearNote();
    renderAgents(session, data);
  }

  async function refreshCredits(session) {
    setNote("", escapeHtml(text.loadCredits));
    var data = await Promise.all([
      requestJson("/api/cloud/credits/overview"),
      requestJson("/api/cloud/credits/ledger"),
      requestJson("/api/cloud/credits/auto-topup")
    ]);
    clearNote();
    renderCredits(session, data[0], data[1], data[2]);
  }

  appRoot.addEventListener("click", async function (event) {
    var button = event.target.closest("[data-agent-action]");
    if (!button) return;
    event.preventDefault();
    button.disabled = true;
    try {
      await requestJson("/api/cloud/agents/" + encodeURIComponent(button.getAttribute("data-agent-id")) + "/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: button.getAttribute("data-agent-action") })
      });
      setNote("success", escapeHtml(text.actionSaved));
      var session = await requestJson("/api/cloud/session");
      await refreshAgents(session);
    } catch (error) {
      setNote("error", escapeHtml(error.message || text.loadFail));
    } finally {
      button.disabled = false;
    }
  });

  appRoot.addEventListener("submit", async function (event) {
    if (event.target.id !== "cloud-auto-topup-form") return;
    event.preventDefault();
    var form = event.target;
    var payload = {
      enabled: !!form.elements.enabled.checked,
      threshold: Number(form.elements.threshold.value || 0),
      topupAmount: Number(form.elements.topupAmount.value || 0)
    };
    try {
      await requestJson("/api/cloud/credits/auto-topup", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      setNote("success", escapeHtml(text.topupSaved));
      var session = await requestJson("/api/cloud/session");
      await refreshCredits(session);
    } catch (error) {
      setNote("error", escapeHtml(error.message || text.loadFail));
    }
  });

  loadSession().then(function (session) {
    if (!session || !session.authenticated) return;
    setLinkedState();
    authHero.hidden = true;
    appRoot.hidden = false;
    if (page === "credits") {
      refreshCredits(session).catch(function (error) {
        setNote("error", escapeHtml(error.message || text.loadFail));
      });
      return;
    }
    refreshAgents(session).catch(function (error) {
      setNote("error", escapeHtml(error.message || text.loadFail));
    });
  });
})();
