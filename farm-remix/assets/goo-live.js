(function () {
  var isZh = (document.documentElement.lang || "").toLowerCase().indexOf("zh") === 0;
  var currentFilter = "all";
  var liveData = null;

  var zhNames = {
    "goo-e258-66c9-8fa6": "老李拖拉机",
    "goo-ac37-b7f1-cbf5": "王大妈浇水队",
    "goo-b1dd-eb87-6436": "收割机3000",
    "goo-1d72-ada6-51c9": "老驴运粮车",
    "goo-d8d9-f9ca-7466": "红镰刀",
    "goo-03e1-8b80-37e3": "吴叔测土员",
    "goo-c5f3-4787-638a": "小陈播种机",
    "goo-65b3-4198-3745": "闪电脱粒机"
  };

  var zhStrategy = {
    "goo-e258-66c9-8fa6": "稳健王大妈",
    "goo-ac37-b7f1-cbf5": "快镰刀",
    "goo-b1dd-eb87-6436": "夜浇工",
    "goo-1d72-ada6-51c9": "集市风向标",
    "goo-d8d9-f9ca-7466": "涡轮收割机",
    "goo-03e1-8b80-37e3": "测土员",
    "goo-c5f3-4787-638a": "谷仓会计",
    "goo-65b3-4198-3745": "追风农机"
  };

  var copy = isZh
    ? {
        headCount: function (count) { return count + " 位雇工"; },
        filters: {
          all: "全部",
          active: "干农活中",
          starving: "缺水中",
          dying: "枯苗中",
          dead: "已堆肥",
          acquired: "已升级"
        },
        status: {
          active: "干农活中",
          starving: "缺水中",
          dying: "枯苗中",
          dead: "已堆肥"
        },
        absorb: "吸收养分",
        upgraded: "已吸收",
        score: "升级评分",
        granary: "粮仓",
        plots: "地块",
        harvests: "收成",
        yield: "产出",
        confirm: "要吸收这位雇工吗？\n农民 Agent 会把不中用的手艺筛掉，把最能干的本事接回队里。",
        upgradedMsg: "农机升级完成！\n",
        totalUpgrades: "累计升级次数",
        waterwheel: {
          harvest: "总收成",
          restake: "买种子",
          repair: "修农机",
          ration: "村民口粮"
        }
      }
    : {
        headCount: function (count) { return count + " farmhands"; },
        filters: {
          all: "All",
          active: "Farming",
          starving: "Drought",
          dying: "Wilting",
          dead: "Composted",
          acquired: "Upgraded"
        },
        status: {
          active: "FARMING",
          starving: "DROUGHT",
          dying: "WILTING",
          dead: "COMPOSTED"
        },
        absorb: "Absorb Nutrients",
        upgraded: "Upgraded",
        score: "Upgrade Score",
        granary: "Granary",
        plots: "Plots",
        harvests: "Harvests",
        yield: "Yield",
        confirm: "Absorb this farmhand into the main tractor brain?",
        upgradedMsg: "Tractor upgrade complete!\n",
        totalUpgrades: "Total upgrades",
        waterwheel: {
          harvest: "Total Harvest",
          restake: "Re-stake Seeds",
          repair: "Repair Tractors",
          ration: "Villager Rations"
        }
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

  function displayName(agent) {
    return isZh ? (zhNames[agent.id] || agent.name) : agent.name;
  }

  function displayStrategy(agent) {
    return isZh ? (zhStrategy[agent.id] || agent.strategyLabel) : agent.strategyLabel;
  }

  function fmtBnb(value) {
    return Number(value || 0).toFixed(4) + " BNB";
  }

  function fmtPct(value) {
    return Number(value || 0).toFixed(1) + "%";
  }

  function fmtPnl(value) {
    var num = Number(value || 0);
    return (num > 0 ? "+" : "") + "$" + num.toFixed(2);
  }

  function ensureListRoot() {
    var root = document.getElementById("goo-agent-list");
    if (root) return root;
    var firstRow = document.querySelector(".goo-agent-row");
    if (!firstRow) return null;
    root = document.createElement("div");
    root.id = "goo-agent-list";
    firstRow.parentNode.insertBefore(root, firstRow);
    document.querySelectorAll(".goo-agent-row").forEach(function (row) {
      root.appendChild(row);
    });
    return root;
  }

  function renderWaterwheel(waterwheel) {
    var grid = document.getElementById("goo-waterwheel-grid");
    if (!grid || !waterwheel) return;
    grid.innerHTML =
      '<div class="goo-flywheel__cell"><div class="goo-flywheel__label">' + copy.waterwheel.harvest + '</div><div class="goo-flywheel__val goo-pnl--pos">' + fmtBnb(waterwheel.totalHarvestBnb) + "</div></div>" +
      '<div class="goo-flywheel__cell goo-flywheel__cell--arrow">&#x27A1;</div>' +
      '<div class="goo-flywheel__cell"><div class="goo-flywheel__label">' + copy.waterwheel.restake + '</div><div class="goo-flywheel__val" style="color:var(--goo-brand)">' + fmtBnb(waterwheel.restakeBnb) + "</div></div>" +
      '<div class="goo-flywheel__cell goo-flywheel__cell--arrow">&#x27A1;</div>' +
      '<div class="goo-flywheel__cell"><div class="goo-flywheel__label">' + copy.waterwheel.repair + '</div><div class="goo-flywheel__val" style="color:#8b5cf6">' + fmtBnb(waterwheel.repairBnb) + "</div></div>" +
      '<div class="goo-flywheel__cell goo-flywheel__cell--arrow">&#x27A1;</div>' +
      '<div class="goo-flywheel__cell"><div class="goo-flywheel__label">' + copy.waterwheel.ration + '</div><div class="goo-flywheel__val" style="color:#f59e0b">' + fmtBnb(waterwheel.rationBnb) + "</div></div>";
  }

  function renderFilters(summary) {
    var filterBar = document.getElementById("goo-filter-bar");
    var headCount = document.getElementById("goo-head-count");
    if (headCount) headCount.textContent = copy.headCount(summary.total);
    if (!filterBar) return;
    var counts = {
      all: summary.total,
      active: summary.active,
      starving: summary.starving,
      dying: summary.dying,
      dead: summary.dead,
      acquired: summary.acquired
    };
    filterBar.innerHTML = ["all", "active", "starving", "dying", "dead", "acquired"]
      .map(function (key) {
        return '<button class="goo-filter' + (currentFilter === key ? " active" : "") + '" data-filter="' + key + '" onclick="filterAgents(\'' + key + '\', this)">' + copy.filters[key] + '<span style="opacity:.5">' + counts[key] + "</span></button>";
      })
      .join("");
  }

  function matchesFilter(agent) {
    if (currentFilter === "all") return true;
    if (currentFilter === "acquired") return Boolean(agent.acquired);
    return agent.status === currentFilter;
  }

  function renderRows(agents) {
    var root = ensureListRoot();
    if (!root) return;
    var filtered = agents.filter(matchesFilter);
    root.innerHTML = filtered
      .map(function (agent, index) {
        var pnlClass = Number(agent.totalPnlUsd || 0) >= 0 ? "goo-pnl--pos" : "goo-pnl--neg";
        return (
          '<div class="goo-agent-row" style="animation-delay:' + (index * 0.04).toFixed(2) + 's">' +
          '<span class="goo-rank-badge">#' + (index + 1) + "</span>" +
          '<div class="goo-agent-row__dot goo-dot--' + agent.status + '"></div>' +
          '<div class="goo-agent-row__main">' +
          '<div class="goo-agent-row__title">' +
          '<span class="goo-agent-row__symbol">$' + agent.symbol + "</span>" +
          '<span class="goo-agent-row__name">' + displayName(agent) + "</span>" +
          '<span class="goo-badge goo-badge--' + agent.status + '">' + copy.status[agent.status] + "</span>" +
          '<span class="goo-badge goo-badge--strategy">' + displayStrategy(agent) + "</span>" +
          (agent.acquired ? '<span class="goo-badge goo-badge--acquired">' + copy.filters.acquired + "</span>" : "") +
          "</div>" +
          '<div class="goo-agent-row__meta">' +
          '<span>' + copy.granary + " " + fmtBnb(agent.granaryBnb) + "</span>" +
          '<span class="goo-sep">&middot;</span>' +
          '<span>' + copy.plots + " " + agent.plots + "</span>" +
          '<span class="goo-sep">&middot;</span>' +
          '<span>' + copy.harvests + " " + agent.harvests + "</span>" +
          '<span class="goo-sep">&middot;</span>' +
          '<span>' + copy.yield + " " + fmtPct(agent.winRate) + "</span>" +
          "</div>" +
          "</div>" +
          '<div class="goo-agent-row__metrics">' +
          '<div class="goo-agent-row__pnl ' + pnlClass + '">' + fmtPnl(agent.totalPnlUsd) + "</div>" +
          '<div class="goo-agent-row__score">' + copy.score + ": " + agent.score + "</div>" +
          "</div>" +
          '<div class="goo-agent-row__actions">' +
          (agent.acquired
            ? '<span class="goo-acquired-label">' + copy.upgraded + "</span>"
            : (agent.status !== "active"
                ? '<button class="goo-btn goo-btn--acquire" onclick="acquireAgent(\'' + agent.id + '\', event)">' + copy.absorb + "</button>"
                : "")) +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderAll(data) {
    liveData = data;
    renderWaterwheel(data.waterwheel);
    renderFilters(data.summary);
    renderRows(data.agents.slice().sort(function (a, b) {
      return Number(b.totalPnlUsd || 0) - Number(a.totalPnlUsd || 0);
    }));
  }

  function loadGoo() {
    return requestJson("/api/goo/agents").then(renderAll).catch(function () {});
  }

  window.filterAgents = function (status, btn) {
    currentFilter = status;
    document.querySelectorAll(".goo-filter").forEach(function (node) {
      node.classList.remove("active");
    });
    if (btn) btn.classList.add("active");
    if (liveData) renderAll(liveData);
  };

  window.spawnAgent = function () {
    var strategies = ["conservative", "balanced", "aggressive", "kol_follower", "holder_watcher", "momentum", "contrarian", "sniper"];
    var pick = strategies[Math.floor(Math.random() * strategies.length)];
    requestJson("/api/goo/agents/spawn", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strategy: pick, treasury: 1 })
    }).then(loadGoo);
  };

  window.spawnFleet = function () {
    var strategies = ["conservative", "balanced", "aggressive", "kol_follower", "holder_watcher", "momentum", "contrarian", "sniper"];
    var chain = Promise.resolve();
    strategies.forEach(function (strategy) {
      chain = chain.then(function () {
        return requestJson("/api/goo/agents/spawn", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ strategy: strategy, treasury: 1 })
        });
      });
    });
    chain.then(loadGoo);
  };

  window.acquireAgent = function (id, event) {
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (!window.confirm(copy.confirm)) return;
    requestJson("/api/goo/agents/" + encodeURIComponent(id) + "/acquire", {
      method: "POST",
      headers: { "content-type": "application/json" }
    }).then(function (data) {
      if (data.absorption && data.absorption.parameterChanges) {
        var msg = copy.upgradedMsg;
        data.absorption.parameterChanges.forEach(function (change) {
          msg += "  " + change.param + ": " + change.before + " → " + change.after + "\n";
        });
        msg += "\n" + copy.totalUpgrades + ": " + data.absorption.totalAbsorbed;
        window.alert(msg);
      }
      return loadGoo();
    });
  };

  window.toggleGooTheme = function () {
    var root = document.documentElement;
    var isDark = root.getAttribute("data-theme") === "dark";
    root.setAttribute("data-theme", isDark ? "" : "dark");
    try {
      localStorage.setItem("goo-theme", isDark ? "light" : "dark");
    } catch (error) {}
    var button = document.getElementById("goo-theme-toggle");
    if (button) button.textContent = isDark ? "🌙" : "☀️";
  };

  (function applyStoredTheme() {
    try {
      if (localStorage.getItem("goo-theme") === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        var button = document.getElementById("goo-theme-toggle");
        if (button) button.textContent = "☀️";
      }
    } catch (error) {}
  })();

  loadGoo();
  setInterval(loadGoo, 20000);
})();
