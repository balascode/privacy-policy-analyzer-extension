// Popup Script
// Handles UI logic and result display

const CONFIG = window.API_CONFIG || {};
const ENDPOINTS = [CONFIG.hostedApiUrl, CONFIG.localApiUrl].filter(Boolean);

const loading = document.getElementById("loading");
const error = document.getElementById("error");
const results = document.getElementById("results");
const noSelection = document.getElementById("no-selection");
const statusBanner = document.getElementById("status-banner");
const errorMessage = document.getElementById("error-message");
const clausesContainer = document.getElementById("clauses-container");

const totalClausesEl = document.getElementById("total-clauses");
const riskyCountEl = document.getElementById("risky-count");
const riskLevelEl = document.getElementById("risk-level");
const riskScoreEl = document.getElementById("risk-score");
const riskBadge = document.getElementById("risk-badge");
const riskBar = document.getElementById("risk-bar");

const copyBtn = document.getElementById("copy-btn");
const saveBtn = document.getElementById("save-btn");
const newAnalysisBtn = document.getElementById("new-analysis-btn");
const closeErrorBtn = document.getElementById("close-btn-error");

let currentAnalysis = null;

function showState(state) {
  loading.classList.add("hidden");
  error.classList.add("hidden");
  results.classList.add("hidden");
  noSelection.classList.add("hidden");

  if (state === "loading") {
    loading.classList.remove("hidden");
  } else if (state === "error") {
    error.classList.remove("hidden");
  } else if (state === "results") {
    results.classList.remove("hidden");
  } else if (state === "no-selection") {
    noSelection.classList.remove("hidden");
  }
}

function setStatus(message) {
  if (statusBanner) {
    statusBanner.textContent = message;
  }
}

function renderResults(analysis) {
  currentAnalysis = analysis;

  totalClausesEl.textContent = analysis.totalClauses ?? 0;
  riskyCountEl.textContent = analysis.riskyCount ?? 0;
  riskScoreEl.textContent = analysis.avgScore ?? 0;

  const riskText = String(analysis.overallRisk || "low").toUpperCase();
  riskLevelEl.textContent = riskText;
  riskBadge.textContent = riskText;
  riskBadge.className = `risk-badge ${(analysis.overallRisk || "low")}`;

  const riskBarFill = document.querySelector(".risk-bar-fill") || createRiskBar();
  riskBarFill.style.width = `${analysis.avgScore ?? 0}%`;

  try {
    clausesContainer.innerHTML = "";
    const clauses = Array.isArray(analysis.clauses) ? analysis.clauses : [];
    clauses.forEach((clause, idx) => {
      const card = createClauseCard(clause, idx + 1);
      clausesContainer.appendChild(card);
    });
    showState("results");
    setStatus("Analysis complete.");
  } catch (err) {
    showError("Result rendering failed due to unexpected response shape.");
  }
}

function createRiskBar() {
  const fill = document.createElement("div");
  fill.className = "risk-bar-fill";
  riskBar.appendChild(fill);
  return fill;
}

function createClauseCard(clause, index) {
  const safeClause = clause || {};
  const intent = safeClause.intent || {};
  const sensitiveData = Array.isArray(intent.sensitiveData) ? intent.sensitiveData : [];

  const card = document.createElement("div");
  card.className = "clause-card";

  const header = document.createElement("div");
  header.className = "clause-header";

  const indexEl = document.createElement("span");
  indexEl.className = "clause-index";
  indexEl.textContent = `Clause ${index}`;

  const riskEl = document.createElement("span");
  riskEl.className = `clause-risk ${safeClause.riskLevel || "low"}`;
  riskEl.textContent = safeClause.riskLevel === "high" ? "High Risk" : safeClause.riskLevel === "medium" ? "Medium" : "Low Risk";

  header.appendChild(indexEl);
  header.appendChild(riskEl);

  const textEl = document.createElement("div");
  textEl.className = "clause-text";
  const clauseText = safeClause.text || "No clause text provided.";
  const fullText = safeClause.fullText || clauseText;
  textEl.textContent = clauseText + (clauseText.length < fullText.length ? "..." : "");

  let reasonsHTML = "";
  if (Array.isArray(safeClause.reasons) && safeClause.reasons.length > 0) {
    reasonsHTML = `<div class="clause-reasons">${safeClause.reasons.map((r) => `<span class="reason-tag">${escapeHtml(String(r))}</span>`).join("")}</div>`;
  }

  let intentHTML = "";
  if (intent && (intent.collects || intent.shares || sensitiveData.length > 0)) {
    const parts = [];
    if (typeof intent.summary === "string" && intent.summary.length > 0) {
      parts.push(`<strong>Intent:</strong> ${escapeHtml(intent.summary)}`);
    }
    if (sensitiveData.length > 0) {
      parts.push(`<strong>Sensitive Data:</strong> ${sensitiveData.join(", ")}`);
    }
    if (parts.length > 0) {
      intentHTML = `<div class="clause-intent">${parts.join("<br>")}</div>`;
    }
  }

  card.innerHTML = `
    ${header.outerHTML}
    ${textEl.outerHTML}
    ${reasonsHTML}
    ${intentHTML}
  `;

  return card;
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return String(text).replace(/[&<>\"']/g, (m) => map[m]);
}

function showError(message) {
  errorMessage.textContent = message;
  setStatus(message);
  showState("error");
}

function copyResults() {
  if (!currentAnalysis) return;

  const text = `Privacy Policy Analysis Results
========================
Overall Risk: ${String(currentAnalysis.overallRisk || "low").toUpperCase()}
Risk Score: ${currentAnalysis.avgScore ?? 0}/100
Total Clauses: ${currentAnalysis.totalClauses ?? 0}
Risky Clauses: ${currentAnalysis.riskyCount ?? 0}

Analyzed at: ${currentAnalysis.timestamp ? new Date(currentAnalysis.timestamp).toLocaleString() : "N/A"}

Clauses:
${(Array.isArray(currentAnalysis.clauses) ? currentAnalysis.clauses : []).map((c, i) => `
Clause ${i + 1}: ${String(c.riskLevel || "low").toUpperCase()}
"${String(c.text || "")}..."
Reasons: ${(Array.isArray(c.reasons) ? c.reasons.join(", ") : "None") || "None"}
`).join("\n---\n")}`;

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy Results";
    }, 2000);
  }).catch((err) => console.error("Copy failed:", err));
}

function saveAnalysis() {
  if (!currentAnalysis) return;

  chrome.runtime.sendMessage({
    action: "saveAnalysis",
    analysis: {
      ...currentAnalysis,
      textPreview: currentAnalysis?.clauses?.[0]?.text || "",
    }
  }, (response) => {
    if (response && response.status === "saved") {
      saveBtn.textContent = "Saved";
      setTimeout(() => {
        saveBtn.textContent = "Save Analysis";
      }, 2000);
    }
  });
}

function startNewAnalysis() {
  chrome.storage.local.remove(["selectedText", "sourceUrl"]);
  currentAnalysis = null;
  showState("no-selection");
  setStatus("Waiting for selected text...");
}

function getAndAnalyze() {
  setStatus("Checking for selected text...");
  showState("loading");

  let finished = false;
  const timeoutId = setTimeout(() => {
    if (!finished) {
      finished = true;
      showError("Analysis timed out. Please select text again and retry.");
    }
  }, 8000);

  chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeoutId);

    if (chrome.runtime.lastError) {
      showError("Could not fetch selected text from extension background service.");
      return;
    }

    if (!response || !response.selectedText) {
      setStatus("No selected text found. Select text and right-click again.");
      showState("no-selection");
      return;
    }

    const selectedText = response.selectedText;
    setStatus("Sending text to ML analyzer...");

    setTimeout(async () => {
      try {
        const result = await analyzeWithMLApi(selectedText);
        if (result.success) {
          renderResults(result);
        } else {
          showError(result.error || "Analysis failed.");
        }
      } catch (err) {
        showError(err.message || "ML API is not reachable.");
      }
    }, 100);
  });
}

async function analyzeWithMLApi(text) {
  if (ENDPOINTS.length === 0) {
    throw new Error("No ML API endpoint configured.");
  }

  const errors = [];

  for (const endpoint of ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setStatus(`Trying ML endpoint: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setStatus("Model finished analysis.");
      return response.json();
    } catch (err) {
      errors.push(`${endpoint} -> ${err.name === "AbortError" ? "timeout" : err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(`ML API is not reachable. Tried: ${errors.join(" | ")}`);
}

copyBtn.addEventListener("click", copyResults);
saveBtn.addEventListener("click", saveAnalysis);
newAnalysisBtn.addEventListener("click", startNewAnalysis);
closeErrorBtn.addEventListener("click", startNewAnalysis);

window.addEventListener("load", () => {
  getAndAnalyze();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    startNewAnalysis();
  }
});