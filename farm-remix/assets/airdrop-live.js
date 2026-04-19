(function () {
  var isZh = (document.documentElement.lang || "").toLowerCase().indexOf("zh") === 0;
  var copy = isZh
    ? {
        statusReady: "口粮名单已备好",
        statusClaiming: "口粮发放中",
        note: "这一页现在已经接上本地后端。你可以直接查钱包、模拟领粮，记录会写进本地账本。",
        checkPlaceholder: "输入村民钱包地址（0x...）",
        checking: "正在查找这位村民的口粮卡...",
        found: "这位村民已经在本轮分粮名单里。",
        notFound: "这只钱包暂时不在本轮分粮名单里。",
        claimed: "这份口粮已经领取过了。",
        claimButton: "领取口粮",
        claimSuccess: "口粮已经记到账本里了。",
        stats: {
          pool: "丰收粮仓",
          villagers: "合格村民",
          sent: "已发口粮",
          rehearsals: "彩排次数",
          harvest: "总收成",
          listed: "名单村民"
        },
        statsSub: {
          pool: "本轮分粮储备",
          villagers: "已登记口粮卡",
          sent: "本次庆典",
          rehearsals: "模拟发放",
          harvest: "全部谷仓合计",
          listed: "已上车名单"
        },
        supplyTitle: "庆典物资",
        kitchenTitle: "发放厨房",
        recipientTitle: function (shown, total) {
          return "丰收名单（前 " + shown + " / 共 " + total + "）";
        },
        ledgerTitle: function (count) {
          return "口粮账本（最近 " + count + " 条记录）";
        },
        emptyRecipients: "今日粮车还没装人。",
        emptyLedger: "还没有发粮记录。",
        mode: "模式",
        crop: "作物",
        totalBags: "总袋数",
        treasury: "仓内余粮",
        marketValue: "市场估值",
        noteLabel: "厨房备注",
        kitchenFire: "厨房开火",
        batchLimit: "每锅上限",
        wallet: "厨房钱包",
        nextStep: "下一步",
        readiness: "庆典准备",
        source: "来源",
        desc: "说明",
        createdAt: "记账时间",
        amount: "口粮",
        tx: "单号",
        walletCol: "钱包",
        aliasCol: "村民",
        shareCol: "占比",
        rationCol: "份额",
        claimedCol: "状态",
        yes: "是",
        no: "否",
        dryRun: "熬粥彩排",
        live: "真发口粮",
        open: "待领取",
        done: "已领取",
        recentScan: "最近扫描：",
        prepTodo: "待办",
        prepReady: "就绪"
      }
    : {
        statusReady: "Festival List Ready",
        statusClaiming: "Claiming In Progress",
        note: "This page now runs on the local backend. Wallet checks and rehearsal claims both write into the local ledger.",
        checkPlaceholder: "Enter a villager wallet (0x...)",
        checking: "Checking the ration card...",
        found: "This wallet is on the current harvest list.",
        notFound: "This wallet is not on the current harvest list.",
        claimed: "This ration has already been claimed.",
        claimButton: "Claim Harvest",
        claimSuccess: "The harvest claim has been written to the ledger.",
        stats: {
          pool: "Festival Granary",
          villagers: "Eligible Villagers",
          sent: "Ration Sends",
          rehearsals: "Rehearsal Runs",
          harvest: "Total Harvest",
          listed: "Villagers Listed"
        },
        statsSub: {
          pool: "allocated for this round",
          villagers: "ration cards on file",
          sent: "this festival",
          rehearsals: "practice distributions",
          harvest: "across all barns",
          listed: "current recipient list"
        },
        supplyTitle: "Festival Supplies",
        kitchenTitle: "Distribution Kitchen",
        recipientTitle: function (shown, total) {
          return "Harvest List (Top " + shown + " / " + total + ")";
        },
        ledgerTitle: function (count) {
          return "Ration Ledger (Latest " + count + ")";
        },
        emptyRecipients: "The grain cart is still empty.",
        emptyLedger: "No ration sends yet.",
        mode: "Mode",
        crop: "Asset",
        totalBags: "Total Bags",
        treasury: "Remaining Pantry",
        marketValue: "Market Value",
        noteLabel: "Kitchen Note",
        kitchenFire: "Kitchen Fire",
        batchLimit: "Batch Limit",
        wallet: "Kitchen Wallet",
        nextStep: "Next Step",
        readiness: "Festival Readiness",
        source: "Source",
        desc: "Description",
        createdAt: "Created",
        amount: "Ration",
        tx: "Receipt",
        walletCol: "Wallet",
        aliasCol: "Villager",
        shareCol: "Share",
        rationCol: "Allocation",
        claimedCol: "Status",
        yes: "Yes",
        no: "No",
        dryRun: "Dry Run",
        live: "Live",
        open: "Ready",
        done: "Claimed",
        recentScan: "Last scan: ",
        prepTodo: "TODO",
        prepReady: "READY"
      };

  var state = null;
  var resultEl = document.getElementById("wallet-result");
  var inputEl = document.getElementById("wallet-input");
  var statsEl = document.getElementById("airdrop-stats");
  var noteEl = document.getElementById("airdrop-note");
  var badgeEl = document.getElementById("airdrop-status-badge");
  var timeEl = document.getElementById("airdrop-status-time");
  var supplyEl = document.getElementById("airdrop-supply-card");
  var kitchenEl = document.getElementById("airdrop-kitchen-card");
  var recipientsEl = document.getElementById("airdrop-recipient-wrap");
  var ledgerEl = document.getElementById("airdrop-ledger-wrap");

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtUsd(value) {
    return new Intl.NumberFormat(isZh ? "zh-CN" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function fmtNumber(value) {
    return new Intl.NumberFormat(isZh ? "zh-CN" : "en-US").format(Number(value || 0));
  }

  function fmtDate(value) {
    return new Intl.DateTimeFormat(isZh ? "zh-CN" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

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

  function renderStats(summary) {
    statsEl.innerHTML = [
      [copy.stats.pool, fmtUsd(summary.festivalPoolUsd), copy.statsSub.pool],
      [copy.stats.villagers, fmtNumber(summary.eligibleVillagers), copy.statsSub.villagers],
      [copy.stats.sent, fmtNumber(summary.sentCount), copy.statsSub.sent],
      [copy.stats.rehearsals, fmtNumber(summary.rehearsalRuns), copy.statsSub.rehearsals],
      [copy.stats.harvest, fmtUsd(summary.totalHarvestUsd), copy.statsSub.harvest],
      [copy.stats.listed, fmtNumber(summary.recipientListCount), copy.statsSub.listed]
    ]
      .map(function (item) {
        return (
          '<div class="a-stat">' +
          '<div class="a-stat__label">' + escapeHtml(item[0]) + "</div>" +
          '<div class="a-stat__val">' + escapeHtml(item[1]) + "</div>" +
          '<div class="a-stat__sub">' + escapeHtml(item[2]) + "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderKitchen(status) {
    var kitchen = status.kitchen;
    supplyEl.innerHTML =
      "<h2>" + escapeHtml(copy.supplyTitle) + "</h2>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.mode) + '</span><strong class="yellow">' + escapeHtml(kitchen.mode === "dry-run" ? copy.dryRun : copy.live) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.crop) + "</span><strong>" + escapeHtml(kitchen.assetSymbol) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.totalBags) + "</span><strong>" + escapeHtml(fmtNumber(kitchen.totalAmount)) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.treasury) + "</span><strong>" + escapeHtml(fmtNumber(kitchen.treasuryRemaining)) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.marketValue) + "</span><strong>" + escapeHtml(fmtUsd(kitchen.marketValueUsd)) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.noteLabel) + '</span><strong style="font-size:10px;color:var(--muted);max-width:180px;white-space:normal;">' + escapeHtml(kitchen.note) + "</strong></div>";

    kitchenEl.innerHTML =
      "<h2>" + escapeHtml(copy.kitchenTitle) + "</h2>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.kitchenFire) + "</span><strong>" + escapeHtml(kitchen.executionEnabled ? copy.yes : copy.no) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.mode) + '</span><strong class="yellow">' + escapeHtml(kitchen.mode === "dry-run" ? copy.dryRun : copy.live) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.batchLimit) + "</span><strong>" + escapeHtml(fmtNumber(kitchen.perBatchLimit)) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.wallet) + '</span><strong style="font-size:10px;color:var(--muted);">' + escapeHtml(kitchen.wallet) + "</strong></div>" +
      '<div class="a-kv"><span>' + escapeHtml(copy.nextStep) + '</span><strong style="font-size:10px;max-width:200px;white-space:normal;">' + escapeHtml(status.readiness.filter(function (item) { return item.status !== "ready"; }).map(function (item) { return item.detail; }).join(" ")) + "</strong></div>";
  }

  function renderRecipients(status) {
    var recipients = status.recipients || [];
    recipientsEl.innerHTML =
      "<h2>" + escapeHtml(copy.recipientTitle(Math.min(10, recipients.length), recipients.length)) + "</h2>" +
      (recipients.length
        ? '<table class="a-table"><thead><tr><th class="a-th">' + escapeHtml(copy.aliasCol) + '</th><th class="a-th">' + escapeHtml(copy.walletCol) + '</th><th class="a-th">' + escapeHtml(copy.shareCol) + '</th><th class="a-th">' + escapeHtml(copy.rationCol) + '</th><th class="a-th">' + escapeHtml(copy.claimedCol) + "</th></tr></thead><tbody>" +
          recipients.slice(0, 10).map(function (recipient) {
            return (
              '<tr class="a-tr">' +
              '<td class="a-td">' + escapeHtml(recipient.alias) + "</td>" +
              '<td class="a-td mono">' + escapeHtml(recipient.wallet) + "</td>" +
              '<td class="a-td">' + escapeHtml(Number(recipient.sharePct).toFixed(1) + "%") + "</td>" +
              '<td class="a-td yellow">' + escapeHtml(fmtNumber(recipient.amountToken) + " " + state.kitchen.assetSymbol) + "<br />" + escapeHtml(fmtUsd(recipient.amountUsd)) + "</td>" +
              '<td class="a-td ' + (recipient.claimed ? "green" : "yellow") + '">' + escapeHtml(recipient.claimed ? copy.done : copy.open) + "</td>" +
              "</tr>"
            );
          }).join("") + "</tbody></table>"
        : '<div class="a-empty">' + escapeHtml(copy.emptyRecipients) + "</div>");
  }

  function renderLedger(status) {
    var ledger = status.ledger || [];
    ledgerEl.innerHTML =
      "<h2>" + escapeHtml(copy.ledgerTitle(ledger.length)) + "</h2>" +
      (ledger.length
        ? '<table class="a-table"><thead><tr><th class="a-th">' + escapeHtml(copy.aliasCol) + '</th><th class="a-th">' + escapeHtml(copy.amount) + '</th><th class="a-th">' + escapeHtml(copy.tx) + '</th><th class="a-th">' + escapeHtml(copy.createdAt) + "</th></tr></thead><tbody>" +
          ledger.slice(0, 12).map(function (entry) {
            return (
              '<tr class="a-tr">' +
              '<td class="a-td">' + escapeHtml(entry.alias) + "</td>" +
              '<td class="a-td yellow">' + escapeHtml(fmtNumber(entry.amountToken) + " " + entry.assetSymbol) + "<br />" + escapeHtml(fmtUsd(entry.amountUsd)) + "</td>" +
              '<td class="a-td mono">' + escapeHtml(entry.txHash) + "</td>" +
              '<td class="a-td">' + escapeHtml(fmtDate(entry.createdAt)) + "</td>" +
              "</tr>"
            );
          }).join("") + "</tbody></table>"
        : '<div class="a-empty">' + escapeHtml(copy.emptyLedger) + "</div>");
  }

  function renderStatus(status) {
    state = status;
    renderStats(status.summary);
    renderKitchen(status);
    renderRecipients(status);
    renderLedger(status);
    noteEl.textContent = copy.note;
    badgeEl.className = "a-badge " + ((status.summary.sentCount > 0 || status.kitchen.executionEnabled) ? "a-badge--live" : "a-badge--standby");
    badgeEl.textContent = (status.summary.sentCount > 0 || status.kitchen.executionEnabled) ? copy.statusClaiming : copy.statusReady;
    timeEl.textContent = copy.recentScan + fmtDate(status.summary.snapshotAt);
    if (inputEl) {
      inputEl.placeholder = copy.checkPlaceholder;
    }
  }

  function showResult(kind, html) {
    if (!resultEl) return;
    resultEl.className = "a-result " + kind;
    resultEl.innerHTML = html;
    resultEl.style.display = "block";
  }

  window.checkWallet = function () {
    var wallet = (inputEl && inputEl.value || "").trim();
    if (!wallet) {
      if (resultEl) resultEl.style.display = "none";
      return Promise.resolve();
    }
    showResult("a-result--nodata", escapeHtml(copy.checking));
    return requestJson("/api/airdrop/check?wallet=" + encodeURIComponent(wallet))
      .then(function (data) {
        if (!data.found || !data.recipient) {
          showResult("a-result--not", "✗ " + escapeHtml(copy.notFound));
          return;
        }
        if (data.claimed) {
          showResult("a-result--eligible", "✓ " + escapeHtml(copy.found) + "<br />" + escapeHtml(copy.claimed));
          return;
        }
        showResult(
          "a-result--eligible",
          "✓ " + escapeHtml(copy.found) +
            "<br />" +
            escapeHtml(data.recipient.alias + " · " + fmtNumber(data.recipient.amountToken) + " " + (state ? state.kitchen.assetSymbol : "FARM")) +
            '<div style="margin-top:10px;"><button class="a-btn" data-airdrop-claim="' + escapeHtml(data.recipient.wallet) + '">' + escapeHtml(copy.claimButton) + "</button></div>"
        );
      })
      .catch(function (error) {
        showResult("a-result--not", escapeHtml(error.message || copy.notFound));
      });
  };

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-airdrop-claim]");
    if (!button) return;
    button.disabled = true;
    requestJson("/api/airdrop/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wallet: button.getAttribute("data-airdrop-claim") })
    })
      .then(function () {
        showResult("a-result--eligible", "✓ " + escapeHtml(copy.claimSuccess));
        return loadStatus();
      })
      .catch(function (error) {
        showResult("a-result--not", escapeHtml(error.message || copy.notFound));
      })
      .finally(function () {
        button.disabled = false;
      });
  });

  function loadStatus() {
    return requestJson("/api/airdrop/status").then(renderStatus).catch(function (error) {
      noteEl.textContent = error.message || "Failed to load festival status.";
    });
  }

  loadStatus();
})();
