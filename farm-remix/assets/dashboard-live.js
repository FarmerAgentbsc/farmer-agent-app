(function () {
  var isZh = (document.documentElement.lang || "").toLowerCase().indexOf("zh") === 0;
  var cropNamesZh = {
    SCALLION: "大葱币",
    POTATO: "土豆币",
    BEAN: "豆角田"
  };
  var gooNamesZh = {
    "goo-e258-66c9-8fa6": "老李拖拉机",
    "goo-ac37-b7f1-cbf5": "王大妈浇水队",
    "goo-b1dd-eb87-6436": "收割机3000",
    "goo-1d72-ada6-51c9": "老驴运粮车",
    "goo-d8d9-f9ca-7466": "红镰刀",
    "goo-03e1-8b80-37e3": "吴叔测土员",
    "goo-c5f3-4787-638a": "小陈播种机",
    "goo-65b3-4198-3745": "闪电脱粒机"
  };
  var copy = isZh
    ? {
        discoveryTitle: "最值得下种的地",
        watchTitle: "天气预报",
        portfolioTitle: "粮仓持仓",
        ledgerTitle: "播种台账",
        distributionTitle: "丰收庆典准备",
        recipientsTitle: "上榜村民",
        ledgerFestivalTitle: "口粮账本",
        gooTitle: "农夫船队",
        evolutionTitle: "农机迭代",
        liquidity: "流动性",
        volume5m: "5 分钟成交",
        pool: "粮仓池",
        readiness: "准备度",
        totalAgents: "雇工总数",
        activeAgents: "在岗",
        yieldRate: "产出率",
        treasury: "粮仓",
        trades: "收成次数",
        villagers: "位村民",
        wr: "胜率",
        scoreLabel: "评分",
        acqScore: "吸收评分",
        noLedgerRecords: "口粮账本还没有记录。",
        overview: {
          scouting: "勘田",
          silo: "粮仓",
          greenhouse: "温室",
          waterwheel: "水车",
          festival: "丰收节",
          arena: "雇工"
        },
        ready: "播种",
        watch: "观察",
        blocked: "谨慎",
        discoveryMeta: function (data) { return "已勘探 " + data.discovery.scanned + " 块地 · 可播种 " + data.discovery.buyReady + " 块 · 均分 " + data.discovery.avgScore; },
        portfolioMeta: function (data) { return data.portfolio.activeCount + " 个仓位 · " + data.portfolio.totalBnb.toFixed(4) + " BNB"; },
        distributionMeta: function (data) { return data.distribution.eligibleVillagers + " 位村民 · " + usd(data.distribution.festivalPoolUsd) + " 粮仓池 · 本地演示"; },
        gooMeta: function (data) { return data.goo.total + " 位雇工 · 在岗 " + data.goo.active + " 位 · 可吸收 " + data.goo.acquirable + " 位"; },
        arenaDesc: "合作社会观察老练农夫、坏掉的农机和奇怪的高产工具，表现差的就堆肥，高手的经验会被并回主拖拉机。",
        distributionIntro: "水车会把每轮秋收的 15% 拨给村民口粮，当前这份名单和账本都来自本地后端演示数据。",
        signalReason: "天气预报",
        allocation: "配比",
        position: "仓位",
        score: "分数",
        harvest: "总收成",
        restake: "买种子",
        repair: "修农机",
        ration: "发口粮",
        readinessReady: "就绪",
        readinessTodo: "待办"
      }
    : {
        discoveryTitle: "Best Fields To Plant",
        watchTitle: "Weather Forecast",
        portfolioTitle: "Silo Positions",
        ledgerTitle: "Planting Ledger",
        distributionTitle: "Harvest Festival Prep",
        recipientsTitle: "Listed Villagers",
        ledgerFestivalTitle: "Ration Ledger",
        gooTitle: "Farmhand Fleet",
        evolutionTitle: "Tractor Evolution",
        liquidity: "Liquidity",
        volume5m: "Vol (5m)",
        pool: "Pool",
        readiness: "Readiness",
        totalAgents: "Total Agents",
        activeAgents: "Active",
        yieldRate: "Yield Rate",
        treasury: "Treasury",
        trades: "Trades",
        villagers: "villagers",
        wr: "WR",
        scoreLabel: "Score",
        acqScore: "Acq. Score",
        noLedgerRecords: "No ledger records.",
        overview: {
          scouting: "Scouting",
          silo: "Silo",
          greenhouse: "Greenhouse",
          waterwheel: "Waterwheel",
          festival: "Festival",
          arena: "Arena"
        },
        ready: "Plant",
        watch: "Watch",
        blocked: "Caution",
        discoveryMeta: function (data) { return data.discovery.scanned + " scanned · " + data.discovery.buyReady + " buy-ready · avg " + data.discovery.avgScore; },
        portfolioMeta: function (data) { return data.portfolio.activeCount + " positions · " + data.portfolio.totalBnb.toFixed(4) + " BNB"; },
        distributionMeta: function (data) { return data.distribution.eligibleVillagers + " holders · " + usd(data.distribution.festivalPoolUsd) + " pool · local demo"; },
        gooMeta: function (data) { return data.goo.total + " agents · " + data.goo.active + " active · " + data.goo.acquirable + " acquirable"; },
        arenaDesc: "The coop watches veteran farmhands, broken tractors, and miracle tools. Poor performers get composted while the best instincts are folded back into the main tractor brain.",
        distributionIntro: "The waterwheel routes 15% of each harvest into villager rations. This recipient list and ledger are now backed by the local demo backend.",
        signalReason: "Weather Desk",
        allocation: "Allocation",
        position: "Position",
        score: "Score",
        harvest: "Total Harvest",
        restake: "Re-stake Seeds",
        repair: "Repair Tractors",
        ration: "Villager Rations",
        readinessReady: "READY",
        readinessTodo: "TODO"
      };

  function requestJson(url, options) {
    return fetch(url, Object.assign({ credentials: "same-origin" }, options || {}))
      .then(function (response) {
        return response.json().catch(function () {
          return {};
        }).then(function (data) {
          if (!response.ok) {
            var error = new Error(data.error || ("HTTP " + response.status));
            error.status = response.status;
            throw error;
          }
          return data;
        });
      });
  }

  function usd(value) {
    return new Intl.NumberFormat(isZh ? "zh-CN" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cropName(item) {
    return isZh ? (cropNamesZh[item.symbol] || item.name) : item.name;
  }

  function agentName(agent) {
    return isZh ? (gooNamesZh[agent.id] || agent.name) : agent.name;
  }

  function candidateCard(item, index, mode) {
    var pillClass = mode === "ready" ? "tone-hot" : mode === "held" ? "tone-info" : "tone-warn";
    var pillText = mode === "ready" ? copy.ready : mode === "held" ? copy.overview.silo : copy.watch;
    return (
      '<article class="candidate-card">' +
      '<div class="candidate-card__meta"><span class="candidate-rank">' + String(index + 1).padStart(2, "0") + '</span><span class="pill ' + pillClass + '">' + escapeHtml(pillText) + "</span></div>" +
      '<h3><a class="candidate-link" href="' + escapeHtml(item.pairUrl || "#") + '" target="_blank" rel="noreferrer">' + escapeHtml(cropName(item)) + "</a></h3>" +
      '<p class="candidate-subtitle">' + escapeHtml(copy.score + " " + item.score + "/100 · " + item.ageMinutes + "m · " + (item.source || "BSC")) + "</p>" +
      '<div class="candidate-stats" style="grid-template-columns:1fr 1fr">' +
      '<div><span>FDV</span><strong>' + escapeHtml(usd(item.fdvUsd)) + "</strong></div>" +
      '<div><span>' + escapeHtml(copy.liquidity) + '</span><strong>' + escapeHtml(usd(item.liquidityUsd)) + "</strong></div>" +
      '<div><span>' + escapeHtml(copy.volume5m) + '</span><strong>' + escapeHtml(usd(item.vol5mUsd || 0)) + "</strong></div>" +
      '<div><span>' + escapeHtml(copy.position) + '</span><strong>' + escapeHtml(Number(item.estSizeBnb || item.positionBnb || 0).toFixed(4) + " BNB") + "</strong></div>" +
      "</div></article>"
    );
  }

  function renderDiscovery(section, data) {
    section.querySelector(".panel-accord__meta").innerHTML = copy.discoveryMeta(data);
    section.querySelector(".panel-accord__body").innerHTML =
      '<div class="split-grid">' +
      '<div><div class="split-h">' + escapeHtml(copy.discoveryTitle) + "</div>" +
      data.discovery.items.slice(0, 3).map(function (item, index) { return candidateCard(item, index, item.action === "plant" ? "ready" : "watch"); }).join("") +
      "</div>" +
      '<div><div class="split-h">' + escapeHtml(copy.watchTitle) + "</div>" +
      data.discovery.watchlist.map(function (item) {
        return '<div class="status-row"><span>' + escapeHtml(item.name) + '</span><strong>' + escapeHtml(item.score + " · " + item.reason) + "</strong></div>";
      }).join("") +
      "</div></div>";
  }

  function renderPortfolio(section, data) {
    section.querySelector(".panel-accord__meta").innerHTML = copy.portfolioMeta(data);
    section.querySelector(".panel-accord__body").innerHTML =
      '<div class="metric-grid">' +
      '<div class="metric-card"><div class="metric-card__label">' + escapeHtml(copy.overview.silo) + '</div><div class="metric-card__val">' + escapeHtml(String(data.portfolio.activeCount)) + '</div><div class="metric-card__desc">' + escapeHtml(copy.position) + "</div></div>" +
      '<div class="metric-card"><div class="metric-card__label">BNB</div><div class="metric-card__val">' + escapeHtml(data.portfolio.totalBnb.toFixed(4)) + '</div><div class="metric-card__desc">' + escapeHtml(copy.allocation || "Allocation") + "</div></div>" +
      '<div class="metric-card"><div class="metric-card__label">' + escapeHtml(copy.harvest) + '</div><div class="metric-card__val">' + escapeHtml(usd(data.waterwheel.totalHarvestUsd)) + '</div><div class="metric-card__desc">' + escapeHtml(copy.overview.waterwheel) + "</div></div>" +
      '<div class="metric-card"><div class="metric-card__label">' + escapeHtml(copy.restake) + '</div><div class="metric-card__val">' + escapeHtml(data.waterwheel.restakeBnb.toFixed(4) + " BNB") + '</div><div class="metric-card__desc">70%</div></div>' +
      "</div>" +
      '<div class="split-grid" style="margin-top:12px">' +
      '<div><div class="split-h">' + escapeHtml(copy.portfolioTitle) + "</div>" +
      data.portfolio.positions.map(function (item, index) { return candidateCard(item, index, "held"); }).join("") +
      "</div>" +
      '<div><div class="split-h">' + escapeHtml(copy.ledgerTitle) + "</div>" +
      data.portfolio.seedLedger.map(function (item) {
        return '<div class="status-row"><span>' + escapeHtml(item.name) + '</span><strong>' + escapeHtml(item.status + " · " + item.allocationPct + "% · " + item.detail) + "</strong></div>";
      }).join("") +
      "</div></div>";
  }

  function renderDistribution(section, data) {
    section.querySelector(".panel-accord__meta").innerHTML = copy.distributionMeta(data);
    section.querySelector(".panel-accord__body").innerHTML =
      '<p class="candidate-thesis" style="margin-bottom:10px">' + escapeHtml(copy.distributionIntro) + "</p>" +
      '<div class="metric-grid">' +
      '<div class="metric-card"><div class="metric-card__label">' + escapeHtml(copy.pool) + '</div><div class="metric-card__val">' + escapeHtml(usd(data.distribution.festivalPoolUsd)) + "</div></div>" +
      '<div class="metric-card"><div class="metric-card__label">Villagers</div><div class="metric-card__val">' + escapeHtml(String(data.distribution.eligibleVillagers)) + "</div></div>" +
      '<div class="metric-card"><div class="metric-card__label">Rations Sent</div><div class="metric-card__val">' + escapeHtml(String(data.distribution.sentCount)) + "</div></div>" +
      '<div class="metric-card"><div class="metric-card__label">' + escapeHtml(copy.readiness) + '</div><div class="metric-card__val">' + escapeHtml(data.distribution.readinessDone + "/" + data.distribution.readinessTotal) + "</div></div>" +
      "</div>" +
      '<div class="split-h" style="margin-top:12px">' + escapeHtml(copy.distributionTitle) + "</div>" +
      data.distribution.recipients.slice(0, 4).map(function (recipient) {
        return '<div class="status-row"><span>' + escapeHtml(recipient.alias) + '</span><strong>' + escapeHtml(recipient.amountToken + " FARM · " + Number(recipient.sharePct).toFixed(1) + "% · " + (recipient.claimed ? copy.readinessReady : copy.readinessTodo)) + "</strong></div>";
      }).join("") +
      '<div class="split-h" style="margin-top:12px">' + escapeHtml(copy.ledgerFestivalTitle) + "</div>" +
      (data.distribution.ledger.length
        ? data.distribution.ledger.map(function (entry) {
            return '<div class="status-row"><span>' + escapeHtml(entry.alias) + '</span><strong>' + escapeHtml(entry.amountToken + " " + entry.assetSymbol + " · " + usd(entry.amountUsd)) + "</strong></div>";
          }).join("")
        : '<p class="candidate-thesis">' + escapeHtml(copy.noLedgerRecords) + "</p>");
  }

  function renderGoo(section, data) {
    section.querySelector(".panel-accord__meta").innerHTML = copy.gooMeta(data);
    section.querySelector(".panel-accord__body").innerHTML =
      '<div class="metric-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:10px">' +
      '<div class="metric"><span>' + escapeHtml(copy.totalAgents) + '</span><strong>' + escapeHtml(String(data.goo.total)) + "</strong></div>" +
      '<div class="metric"><span>' + escapeHtml(copy.activeAgents) + '</span><strong class="g">' + escapeHtml(String(data.goo.active)) + "</strong></div>" +
      '<div class="metric"><span>' + escapeHtml(copy.yieldRate) + '</span><strong class="g">' + escapeHtml(data.goo.yieldRatePct.toFixed(1) + "%") + "</strong></div>" +
      '<div class="metric"><span>Total P&L</span><strong class="g">' + escapeHtml(usd(data.goo.totalPnlUsd)) + "</strong></div>" +
      "</div>" +
      '<div class="split-h">' + escapeHtml(copy.gooTitle) + "</div>" +
      data.goo.topAgents.slice(0, 5).map(function (agent, index) {
        return (
          '<article class="candidate-card">' +
          '<div class="candidate-card__meta"><span class="candidate-rank">#' + (index + 1) + '</span><span class="pill tone-warm">' + escapeHtml(agent.status) + "</span></div>" +
          '<h3>' + escapeHtml(agentName(agent)) + "</h3>" +
          '<p class="candidate-subtitle">$' + escapeHtml(agent.symbol) + " · " + escapeHtml(copy.scoreLabel) + " " + escapeHtml(agent.score) + "/100 · " + escapeHtml(String(agent.plots)) + (isZh ? " 块地" : " positions") + "</p>" +
          '<div class="candidate-stats" style="grid-template-columns:1fr 1fr">' +
          '<div><span>' + escapeHtml(copy.treasury) + '</span><strong>' + escapeHtml(Number(agent.granaryBnb || 0).toFixed(4) + " BNB") + "</strong></div>" +
          '<div><span>Yield</span><strong class="g">' + escapeHtml(Number(agent.winRate || 0).toFixed(1) + "%") + "</strong></div>" +
          '<div><span>P&L</span><strong class="' + (Number(agent.totalPnlUsd || 0) >= 0 ? "g" : "r") + '">' + escapeHtml(usd(agent.totalPnlUsd)) + "</strong></div>" +
          '<div><span>' + escapeHtml(copy.trades) + '</span><strong>' + escapeHtml(String(agent.harvests)) + "</strong></div>" +
          "</div></article>"
        );
      }).join("") +
      '<div class="split-h" style="margin-top:12px">' + escapeHtml(copy.evolutionTitle) + "</div>" +
      data.goo.topAgents.filter(function (agent) { return !agent.acquired; }).slice(0, 3).map(function (agent) {
        return '<div class="status-row"><span>' + escapeHtml(agentName(agent)) + '</span><strong>' + escapeHtml(copy.scoreLabel + " " + agent.score + " · " + Number(agent.winRate || 0).toFixed(1) + "% " + copy.wr) + "</strong></div>";
      }).join("");
  }

  function renderStatusStrip(data) {
    var strip = document.getElementById("dashboard-status-strip");
    if (!strip) return;
    strip.innerHTML =
      '<a class="ss-chip" href="#discovery-section"><span class="ss-dot" style="background:var(--green)"></span><span class="ss-label">' + escapeHtml(copy.overview.scouting) + '</span><strong>' + escapeHtml(data.discovery.buyReady + "/" + data.discovery.scanned) + "</strong></a>" +
      '<a class="ss-chip" href="#portfolio-section"><span class="ss-dot" style="background:var(--green)"></span><span class="ss-label">' + escapeHtml(copy.overview.silo) + '</span><strong>' + escapeHtml(data.portfolio.activeCount + " · " + data.portfolio.totalBnb.toFixed(4) + " BNB") + "</strong></a>" +
      '<a class="ss-chip" href="#flywheel-section"><span class="ss-dot" style="background:var(--yellow)"></span><span class="ss-label">' + escapeHtml(copy.overview.waterwheel) + '</span><strong>' + escapeHtml(usd(data.waterwheel.totalHarvestUsd)) + "</strong></a>" +
      '<a class="ss-chip" href="#distribution-section"><span class="ss-dot" style="background:rgba(255,255,255,.3)"></span><span class="ss-label">' + escapeHtml(copy.overview.festival) + '</span><strong>' + escapeHtml(data.distribution.eligibleVillagers + " " + copy.villagers) + "</strong></a>" +
      '<a class="ss-chip" href="#goo-section"><span class="ss-dot" style="background:var(--green)"></span><span class="ss-label">' + escapeHtml(copy.overview.arena) + '</span><strong>' + escapeHtml(data.goo.acquired + "/" + data.goo.total) + "</strong></a>";
  }

  function renderArenaPreview(data) {
    var arenaGrid = document.getElementById("dashboard-arena-grid");
    var arenaDesc = document.getElementById("dashboard-arena-desc");
    if (arenaDesc) arenaDesc.textContent = copy.arenaDesc;
    if (!arenaGrid) return;
    arenaGrid.innerHTML = data.goo.topAgents.slice(0, 8).map(function (agent, index) {
      var score = Math.max(8, Math.min(100, Number(agent.score || 0)));
      return (
        '<div class="arena-card' + (index === 0 ? " arena-card--leader" : "") + '">' +
        '<div class="arena-card__rank">#' + (index + 1) + "</div>" +
        '<div class="arena-card__head"><div class="arena-card__dot" style="background:' + (agent.status === "starving" ? "var(--yellow)" : agent.status === "dead" ? "var(--red, #ef4444)" : "var(--green)") + '"></div><div class="arena-card__name">' + escapeHtml(agentName(agent)) + '</div><span class="arena-card__badge">' + escapeHtml(agent.strategyLabel) + "</span></div>" +
        '<div class="arena-card__pnl ' + (Number(agent.totalPnlUsd || 0) >= 0 ? "g" : "r") + '">' + escapeHtml(usd(agent.totalPnlUsd)) + "</div>" +
        '<div class="arena-card__stats"><span>' + escapeHtml(Number(agent.granaryBnb || 0).toFixed(2) + " BNB") + "</span><span>" + escapeHtml(Number(agent.winRate || 0).toFixed(0) + "% " + copy.wr) + "</span><span>" + escapeHtml(copy.scoreLabel + " " + score) + "</span></div>" +
        '<div class="arena-card__bar"><div class="arena-card__bar-fill" style="width:' + score + '%"></div></div>' +
        '<div class="arena-card__score">' + escapeHtml(copy.acqScore) + ' <strong>' + score + "/100</strong></div>" +
        "</div>"
      );
    }).join("");
  }

  function loadDashboard() {
    requestJson("/api/dashboard/overview")
      .then(function (data) {
        renderStatusStrip(data);
        renderArenaPreview(data);
        renderDiscovery(document.getElementById("discovery-section"), data);
        renderPortfolio(document.getElementById("portfolio-section"), data);
        renderDistribution(document.getElementById("distribution-section"), data);
        renderGoo(document.getElementById("goo-section"), data);
      })
      .catch(function () {});
  }

  loadDashboard();
  setInterval(loadDashboard, 30000);
})();
