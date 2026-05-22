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

const PDF_PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 42,
};

const PDF_COLORS = {
  ink: [17, 24, 39],
  muted: [75, 85, 99],
  border: [209, 213, 219],
  panel: [249, 250, 251],
  blue: [37, 99, 235],
  blueDark: [30, 64, 175],
  green: [16, 185, 129],
  yellow: [245, 158, 11],
  red: [239, 68, 68],
  white: [255, 255, 255],
};

function cleanPdfText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function escapePdfText(value) {
  return cleanPdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfNumber(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function pdfColor(color, operator) {
  return `${color.map((value) => pdfNumber(value / 255)).join(" ")} ${operator}`;
}

function estimateTextWidth(text, fontSize) {
  return cleanPdfText(text).length * fontSize * 0.48;
}

function wrapPdfText(text, maxWidth, fontSize) {
  const words = cleanPdfText(text).split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
      line = candidate;
      return;
    }

    if (line) {
      lines.push(line);
    }

    if (estimateTextWidth(word, fontSize) <= maxWidth) {
      line = word;
      return;
    }

    const maxChars = Math.max(8, Math.floor(maxWidth / (fontSize * 0.5)));
    for (let idx = 0; idx < word.length; idx += maxChars) {
      const chunk = word.slice(idx, idx + maxChars);
      if (idx + maxChars >= word.length) {
        line = chunk;
      } else {
        lines.push(chunk);
      }
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : [""];
}

function getRiskColor(risk) {
  const normalized = String(risk || "low").toLowerCase();
  if (normalized === "high") return PDF_COLORS.red;
  if (normalized === "medium") return PDF_COLORS.yellow;
  return PDF_COLORS.green;
}

function getRiskAdvice(analysis) {
  const risk = String(analysis.overallRisk || "low").toLowerCase();
  if (risk === "high") {
    return "High risk means the selected policy text contains strong indicators such as third-party sharing, selling, transfer language, or harmful handling patterns. Review these clauses carefully before accepting the policy.";
  }
  if (risk === "medium") {
    return "Medium risk means some privacy-relevant signals were found, but the strongest sharing or harmful handling patterns were limited. Review the flagged clauses and check whether the data use is acceptable to you.";
  }
  return "Low risk means the selected text did not show strong third-party sharing or harmful handling signals. Still review any data collection details before accepting the policy.";
}

function buildPdfDocument(pageStreams) {
  const objects = [
    null,
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  const pageIds = [];

  pageStreams.forEach((stream) => {
    const contentId = objects.length;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);

    const pageId = objects.length;
    pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
  });

  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let idx = 1; idx < objects.length; idx += 1) {
    offsets[idx] = pdf.length;
    pdf += `${idx} 0 obj\n${objects[idx]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let idx = 1; idx < objects.length; idx += 1) {
    pdf += `${String(offsets[idx]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}

function createPdfReport(analysis) {
  const pages = [];
  let commands = [];
  let cursorY = PDF_PAGE.margin;

  const contentWidth = PDF_PAGE.width - PDF_PAGE.margin * 2;
  const bottomLimit = PDF_PAGE.height - PDF_PAGE.margin - 26;

  function topToPdfY(top, height = 0) {
    return PDF_PAGE.height - top - height;
  }

  function addCommand(command) {
    commands.push(command);
  }

  function addPage() {
    if (commands.length) {
      pages.push(commands.join("\n"));
    }
    commands = [];
    cursorY = PDF_PAGE.margin;
  }

  function ensureSpace(heightNeeded) {
    if (cursorY + heightNeeded > bottomLimit) {
      addPage();
    }
  }

  function rect(x, y, width, height, fillColor, strokeColor = null) {
    if (fillColor) {
      addCommand(pdfColor(fillColor, "rg"));
      addCommand(`${pdfNumber(x)} ${pdfNumber(topToPdfY(y, height))} ${pdfNumber(width)} ${pdfNumber(height)} re f`);
    }
    if (strokeColor) {
      addCommand(pdfColor(strokeColor, "RG"));
      addCommand(`${pdfNumber(x)} ${pdfNumber(topToPdfY(y, height))} ${pdfNumber(width)} ${pdfNumber(height)} re S`);
    }
  }

  function line(x1, y1, x2, y2, color = PDF_COLORS.border) {
    addCommand(pdfColor(color, "RG"));
    addCommand(`${pdfNumber(x1)} ${pdfNumber(topToPdfY(y1))} m ${pdfNumber(x2)} ${pdfNumber(topToPdfY(y2))} l S`);
  }

  function text(value, x, y, options = {}) {
    const fontSize = options.size || 10;
    const font = options.bold ? "F2" : "F1";
    const color = options.color || PDF_COLORS.ink;
    addCommand("BT");
    addCommand(`/${font} ${pdfNumber(fontSize)} Tf`);
    addCommand(pdfColor(color, "rg"));
    addCommand(`${pdfNumber(x)} ${pdfNumber(topToPdfY(y, fontSize))} Td`);
    addCommand(`(${escapePdfText(value)}) Tj`);
    addCommand("ET");
  }

  function paragraph(value, x, y, width, options = {}) {
    const fontSize = options.size || 10;
    const lineHeight = options.lineHeight || fontSize + 4;
    const lines = wrapPdfText(value, width, fontSize);
    lines.forEach((lineText, idx) => {
      text(lineText, x, y + idx * lineHeight, options);
    });
    return lines.length * lineHeight;
  }

  function sectionTitle(title) {
    ensureSpace(38);
    text(title, PDF_PAGE.margin, cursorY, { size: 15, bold: true, color: PDF_COLORS.ink });
    cursorY += 22;
    line(PDF_PAGE.margin, cursorY, PDF_PAGE.width - PDF_PAGE.margin, cursorY, PDF_COLORS.border);
    cursorY += 18;
  }

  function keyValueCard(label, value, x, y, width, color) {
    rect(x, y, width, 66, PDF_COLORS.panel, PDF_COLORS.border);
    text(label.toUpperCase(), x + 12, y + 13, { size: 8, bold: true, color: PDF_COLORS.muted });
    text(value, x + 12, y + 34, { size: 18, bold: true, color });
  }

  const savedAt = analysis.savedAt || new Date().toISOString();
  const generatedAt = new Date(savedAt).toLocaleString();
  const analyzedAt = analysis.timestamp ? new Date(analysis.timestamp).toLocaleString() : "Not available";
  const clauses = Array.isArray(analysis.clauses) ? analysis.clauses : [];
  const risk = String(analysis.overallRisk || "low").toUpperCase();
  const riskColor = getRiskColor(analysis.overallRisk);

  rect(0, 0, PDF_PAGE.width, 118, PDF_COLORS.blueDark);
  text("Privacy Policy Analysis Report", PDF_PAGE.margin, 34, { size: 24, bold: true, color: PDF_COLORS.white });
  text("A simple summary of privacy risks found in the selected policy text.", PDF_PAGE.margin, 68, { size: 11, color: PDF_COLORS.white });
  text(`Generated: ${generatedAt}`, PDF_PAGE.margin, 92, { size: 9, color: PDF_COLORS.white });
  cursorY = 144;

  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  keyValueCard("Overall Risk", risk, PDF_PAGE.margin, cursorY, cardWidth, riskColor);
  keyValueCard("Risk Score", `${analysis.avgScore ?? 0}/100`, PDF_PAGE.margin + (cardWidth + cardGap), cursorY, cardWidth, PDF_COLORS.blue);
  keyValueCard("Clauses", String(analysis.totalClauses ?? clauses.length), PDF_PAGE.margin + (cardWidth + cardGap) * 2, cursorY, cardWidth, PDF_COLORS.ink);
  keyValueCard("Risky", String(analysis.riskyCount ?? 0), PDF_PAGE.margin + (cardWidth + cardGap) * 3, cursorY, cardWidth, riskColor);
  cursorY += 92;

  rect(PDF_PAGE.margin, cursorY, contentWidth, 86, [239, 246, 255], [191, 219, 254]);
  text("How to read this report", PDF_PAGE.margin + 14, cursorY + 14, { size: 12, bold: true, color: PDF_COLORS.blueDark });
  const intro = "This report explains what the analyzer found in the selected text. The score focuses on privacy risk signals such as sensitive data collection, third-party sharing, selling, transfer language, and harmful handling patterns. It is an automated review aid, not legal advice.";
  paragraph(intro, PDF_PAGE.margin + 14, cursorY + 34, contentWidth - 28, { size: 9.5, color: PDF_COLORS.ink, lineHeight: 13 });
  cursorY += 110;

  sectionTitle("Summary");
  const summaryLines = [
    `Analyzed at: ${analyzedAt}`,
    `Source page: ${analysis.sourceUrl || "Not captured"}`,
    `Selected text length: ${analysis.selectedTextLength ? `${analysis.selectedTextLength} characters` : "Not captured"}`,
    `Model: ${analysis.model || "Not available"}`,
    `Engine: ${analysis.engine || "Not available"}`,
  ];
  summaryLines.forEach((item) => {
    ensureSpace(18);
    text(item, PDF_PAGE.margin, cursorY, { size: 10, color: PDF_COLORS.ink });
    cursorY += 17;
  });
  cursorY += 8;

  rect(PDF_PAGE.margin, cursorY, contentWidth, 76, [255, 251, 235], [253, 230, 138]);
  text("Plain-language guidance", PDF_PAGE.margin + 14, cursorY + 14, { size: 12, bold: true, color: [146, 64, 14] });
  paragraph(getRiskAdvice(analysis), PDF_PAGE.margin + 14, cursorY + 34, contentWidth - 28, { size: 9.5, color: PDF_COLORS.ink, lineHeight: 13 });
  cursorY += 100;

  sectionTitle("Clause Findings");

  if (!clauses.length) {
    text("No clause details were returned by the analyzer.", PDF_PAGE.margin, cursorY, { size: 10, color: PDF_COLORS.muted });
  }

  clauses.forEach((clause, index) => {
    const intent = clause.intent || {};
    const reasons = Array.isArray(clause.reasons) ? clause.reasons.slice(0, 5) : [];
    const sensitiveData = Array.isArray(intent.sensitiveData) ? intent.sensitiveData : [];
    const actions = Array.isArray(intent.actions) ? intent.actions : [];
    const clauseText = clause.fullText || clause.text || "No clause text provided.";
    const textLines = wrapPdfText(clauseText, contentWidth - 28, 9.5).slice(0, 10);
    const detailLines = [];

    if (sensitiveData.length) detailLines.push(`Sensitive data: ${sensitiveData.join(", ")}`);
    if (actions.length) detailLines.push(`Detected actions: ${actions.join(", ")}`);
    if (typeof intent.thirdParty === "boolean") detailLines.push(`Third-party context: ${intent.thirdParty ? "Yes" : "No"}`);
    if (typeof intent.shares === "boolean") detailLines.push(`Sharing signal: ${intent.shares ? "Yes" : "No"}`);

    const reasonLines = reasons.flatMap((reason) => wrapPdfText(`- ${reason}`, contentWidth - 42, 8.5)).slice(0, 8);
    const detailWrappedLines = detailLines.flatMap((item) => wrapPdfText(item, contentWidth - 28, 8.5)).slice(0, 5);
    const cardHeight = 58 + textLines.length * 13 + reasonLines.length * 11 + detailWrappedLines.length * 11;

    ensureSpace(Math.max(cardHeight, 112));
    const cardTop = cursorY;
    rect(PDF_PAGE.margin, cardTop, contentWidth, Math.max(cardHeight, 112), PDF_COLORS.white, PDF_COLORS.border);
    rect(PDF_PAGE.margin, cardTop, 5, Math.max(cardHeight, 112), getRiskColor(clause.riskLevel));
    text(`Clause ${index + 1}`, PDF_PAGE.margin + 14, cardTop + 14, { size: 12, bold: true, color: PDF_COLORS.ink });
    text(String(clause.riskLevel || "low").toUpperCase(), PDF_PAGE.width - PDF_PAGE.margin - 86, cardTop + 14, { size: 10, bold: true, color: getRiskColor(clause.riskLevel) });

    let localY = cardTop + 36;
    textLines.forEach((lineText) => {
      text(lineText, PDF_PAGE.margin + 14, localY, { size: 9.5, color: PDF_COLORS.ink });
      localY += 13;
    });

    if (reasonLines.length) {
      localY += 4;
      text("Why it was classified this way:", PDF_PAGE.margin + 14, localY, { size: 9, bold: true, color: PDF_COLORS.muted });
      localY += 12;
      reasonLines.forEach((lineText) => {
        text(lineText, PDF_PAGE.margin + 22, localY, { size: 8.5, color: PDF_COLORS.muted });
        localY += 11;
      });
    }

    if (detailWrappedLines.length) {
      localY += 4;
      detailWrappedLines.forEach((lineText) => {
        text(lineText, PDF_PAGE.margin + 14, localY, { size: 8.5, color: PDF_COLORS.muted });
        localY += 11;
      });
    }

    cursorY = cardTop + Math.max(cardHeight, 112) + 16;
  });

  addPage();

  pages.forEach((_, index) => {
    const footer = [
      pdfColor(PDF_COLORS.muted, "rg"),
      "BT",
      "/F1 8 Tf",
      `${pdfNumber(PDF_PAGE.margin)} ${pdfNumber(24)} Td`,
      `(Privacy Policy Analyzer - Page ${index + 1} of ${pages.length}) Tj`,
      "ET",
    ].join("\n");
    pages[index] = `${pages[index]}\n${footer}`;
  });

  return buildPdfDocument(pages);
}

function downloadAnalysisPdf(analysis) {
  const savedAt = analysis.savedAt || new Date().toISOString();
  const fileSafeTimestamp = savedAt.replace(/[:.]/g, "-");
  const pdf = createPdfReport(analysis);
  const blob = new Blob([pdf], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `privacy-analysis-report-${fileSafeTimestamp}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveAnalysis() {
  if (!currentAnalysis) return;

  const analysisToSave = {
    ...currentAnalysis,
    textPreview: currentAnalysis?.clauses?.[0]?.text || "",
    savedAt: new Date().toISOString(),
  };

  try {
    downloadAnalysisPdf(analysisToSave);
  } catch (err) {
    console.error("PDF report generation failed:", err);
    showError("Could not create the PDF report.");
    return;
  }

  saveBtn.textContent = "PDF Saved";
  setTimeout(() => {
    saveBtn.textContent = "Save PDF Report";
  }, 2000);
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
          renderResults({
            ...result,
            sourceUrl: response.sourceUrl || "",
            selectedTextLength: selectedText.length,
          });
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
