const STORAGE_KEY = "mindmood-studio-pro-entries";

function getEntries() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateLabels() {
  document.getElementById("scoreLabel").textContent = document.getElementById("score").value;
  document.getElementById("energyLabel").textContent = document.getElementById("energy").value;
  document.getElementById("stressLabel").textContent = document.getElementById("stress").value;
}

function scrollToJournal() {
  document.getElementById("journalForm").scrollIntoView({
    behavior: "smooth"
  });
}

function getSelectedActivities() {
  return Array.from(document.querySelectorAll(".check-grid input:checked"))
    .map(input => input.value);
}

function clearActivities() {
  document.querySelectorAll(".check-grid input:checked")
    .forEach(input => {
      input.checked = false;
    });
}

function parseTriggers(text) {
  return text
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function addEntry() {
  const mood = document.getElementById("mood").value;
  const score = Number(document.getElementById("score").value);
  const energy = Number(document.getElementById("energy").value);
  const stress = Number(document.getElementById("stress").value);
  const sleep = Number(document.getElementById("sleep").value) || 0;
  const water = Number(document.getElementById("water").value) || 0;
  const note = document.getElementById("note").value.trim();
  const gratitude = document.getElementById("gratitude").value.trim();
  const triggers = parseTriggers(document.getElementById("triggers").value);
  const activities = getSelectedActivities();

  if (!note) {
    alert("Please write a short reflection note.");
    return;
  }

  const entries = getEntries();

  entries.unshift({
    id: Date.now(),
    mood,
    score,
    energy,
    stress,
    sleep,
    water,
    note,
    gratitude,
    triggers,
    activities,
    createdAt: new Date().toISOString()
  });

  saveEntries(entries);

  document.getElementById("note").value = "";
  document.getElementById("gratitude").value = "";
  document.getElementById("triggers").value = "";
  document.getElementById("score").value = 5;
  document.getElementById("energy").value = 5;
  document.getElementById("stress").value = 5;
  document.getElementById("sleep").value = 7;
  document.getElementById("water").value = 5;
  updateLabels();
  clearActivities();

  renderApp();
}

function deleteEntry(id) {
  const confirmed = confirm("Delete this mood entry?");
  if (!confirmed) return;

  const entries = getEntries().filter(entry => entry.id !== id);
  saveEntries(entries);
  renderApp();
}

function resetData() {
  const confirmed = confirm("Reset all mood journal data?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  renderApp();
}

function getAverage(entries, key) {
  if (entries.length === 0) return 0;

  const total = entries.reduce((sum, entry) => sum + Number(entry[key] || 0), 0);
  return total / entries.length;
}

function getWeeklyEntries(entries) {
  const now = new Date();

  return entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    const diff = now - entryDate;
    return diff <= 7 * 24 * 60 * 60 * 1000;
  });
}

function getBestMood(entries) {
  if (entries.length === 0) return 0;
  return Math.max(...entries.map(entry => Number(entry.score)));
}

function getSelfCareCount(entries) {
  return entries.reduce((sum, entry) => sum + entry.activities.length, 0);
}

function getCurrentStreak(entries) {
  if (entries.length === 0) return 0;

  const uniqueDates = new Set(
    entries.map(entry => new Date(entry.createdAt).toDateString())
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    if (uniqueDates.has(date.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateWellnessScore(entries) {
  if (entries.length === 0) return 0;

  const avgMood = getAverage(entries, "score");
  const avgEnergy = getAverage(entries, "energy");
  const avgStress = getAverage(entries, "stress");
  const avgSleep = getAverage(entries, "sleep");
  const selfCareRatio = getSelfCareCount(entries) / entries.length;

  let score = 0;

  score += Math.min(35, avgMood * 3.5);
  score += Math.min(20, avgEnergy * 2);
  score += Math.min(20, (10 - avgStress) * 2);
  score += avgSleep >= 6 && avgSleep <= 9 ? 15 : Math.max(0, 15 - Math.abs(7 - avgSleep) * 3);
  score += Math.min(10, selfCareRatio * 2);

  return Math.round(Math.max(0, Math.min(100, score)));
}

function getMoodStats(entries) {
  const stats = {};

  entries.forEach(entry => {
    stats[entry.mood] = (stats[entry.mood] || 0) + 1;
  });

  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}

function getTriggerStats(entries) {
  const stats = {};

  entries.forEach(entry => {
    entry.triggers.forEach(trigger => {
      const key = trigger.toLowerCase();
      stats[key] = (stats[key] || 0) + 1;
    });
  });

  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}

function getActivityStats(entries) {
  const stats = {};

  entries.forEach(entry => {
    entry.activities.forEach(activity => {
      stats[activity] = (stats[activity] || 0) + 1;
    });
  });

  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}

function getInsight(entries) {
  if (entries.length === 0) {
    return {
      title: "No insight yet",
      text: "Add your first mood entry to receive a personalized wellness suggestion."
    };
  }

  const averageMood = getAverage(entries, "score");
  const averageStress = getAverage(entries, "stress");
  const averageEnergy = getAverage(entries, "energy");
  const averageSleep = getAverage(entries, "sleep");
  const latest = entries[0];
  const selfCareCount = getSelfCareCount(entries);
  const triggerStats = getTriggerStats(entries);
  const strongestTrigger = triggerStats[0]?.[0];

  if (latest.score <= 4) {
    return {
      title: "Low mood pattern detected",
      text: "Your latest mood score is low. Try one small action first: rest, drink water, take a short walk, or talk to someone you trust."
    };
  }

  if (averageStress >= 7) {
    return {
      title: "Stress level needs attention",
      text: "Your average stress level is high. Consider reducing task load, taking mindful breaks, and identifying repeated triggers."
    };
  }

  if (averageSleep < 6) {
    return {
      title: "Sleep may be affecting your mood",
      text: "Your average sleep is below 6 hours. A more consistent sleep routine may help improve mood and energy."
    };
  }

  if (averageEnergy <= 4) {
    return {
      title: "Low energy pattern detected",
      text: "Your energy score is low. Try checking your rest, meals, hydration, and workload balance."
    };
  }

  if (selfCareCount < entries.length) {
    return {
      title: "Self-care consistency can improve",
      text: "You have fewer self-care actions than journal entries. Try pairing each reflection with one simple self-care action."
    };
  }

  if (strongestTrigger) {
    return {
      title: "Repeated trigger detected",
      text: `Your most repeated trigger is "${strongestTrigger}". Consider planning a coping strategy before this trigger appears again.`
    };
  }

  if (averageMood >= 8) {
    return {
      title: "Positive mood pattern detected",
      text: "Your mood average is strong. Keep protecting the habits and environment that help you feel balanced."
    };
  }

  return {
    title: "Stable but can improve",
    text: "Your mood pattern is moderate. Continue journaling and observe what improves your mood, energy, and stress level."
  };
}

function updateFilterOptions(entries) {
  const filter = document.getElementById("filterMood");
  const currentValue = filter.value;
  const moods = ["All", ...new Set(entries.map(entry => entry.mood))];

  filter.innerHTML = moods.map(mood => `<option>${mood}</option>`).join("");

  if (moods.includes(currentValue)) {
    filter.value = currentValue;
  }
}

function renderDashboard(entries) {
  const latest = entries[0];
  const averageMood = getAverage(entries, "score");
  const weeklyEntries = getWeeklyEntries(entries);
  const weeklyAverage = getAverage(weeklyEntries, "score");
  const averageSleep = getAverage(entries, "sleep");
  const bestMood = getBestMood(entries);
  const selfCareCount = getSelfCareCount(entries);
  const streak = getCurrentStreak(entries);
  const wellnessScore = calculateWellnessScore(entries);

  document.getElementById("totalEntries").textContent = entries.length;
  document.getElementById("averageMood").textContent = `${averageMood.toFixed(1)}/10`;
  document.getElementById("weeklyAverage").textContent = `${weeklyAverage.toFixed(1)}/10`;
  document.getElementById("bestMood").textContent = `${bestMood}/10`;
  document.getElementById("selfCareCount").textContent = selfCareCount;
  document.getElementById("currentStreak").textContent = `${streak} days`;
  document.getElementById("averageSleep").textContent = `${averageSleep.toFixed(1)}h`;
  document.getElementById("wellnessScore").textContent = `${wellnessScore}%`;

  document.getElementById("latestMood").textContent = latest ? latest.mood : "Not logged";
  document.getElementById("latestMoodScore").textContent = latest ? `Score: ${latest.score}/10` : "Score: 0/10";
  document.getElementById("latestMoodBar").style.width = latest ? `${latest.score * 10}%` : "0%";

  const insight = getInsight(entries);

  document.getElementById("insightTitle").textContent = insight.title;
  document.getElementById("insightText").textContent = insight.text;
}

function renderMoodBreakdown(entries) {
  const box = document.getElementById("moodBreakdown");
  const moodStats = getMoodStats(entries);

  if (moodStats.length === 0) {
    box.innerHTML = `<p class="muted">No mood data yet.</p>`;
    return;
  }

  const maxCount = Math.max(...moodStats.map(item => item[1]));

  box.innerHTML = moodStats.map(([mood, count]) => {
    const percentage = Math.round((count / maxCount) * 100);

    return `
      <div class="breakdown-item">
        <div class="breakdown-top">
          <span>${escapeHTML(mood)}</span>
          <span>${count} entries</span>
        </div>
        <div class="breakdown-bg">
          <div class="breakdown-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderTrend(entries) {
  const box = document.getElementById("trendChart");
  const recent = [...entries].slice(0, 7).reverse();

  if (recent.length === 0) {
    box.innerHTML = `<p class="muted">No trend data yet.</p>`;
    return;
  }

  box.innerHTML = recent.map(entry => {
    const height = Math.max(12, entry.score * 12);
    const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });

    return `
      <div class="trend-bar" title="${escapeHTML(entry.mood)} - ${entry.score}/10" style="height: ${height}px">
        <span>${date}</span>
      </div>
    `;
  }).join("");
}

function renderTagCloud(containerId, stats, emptyText) {
  const box = document.getElementById(containerId);

  if (stats.length === 0) {
    box.innerHTML = `<p class="muted">${emptyText}</p>`;
    return;
  }

  box.innerHTML = `
    <div class="tag-cloud">
      ${stats.map(([label, count]) => `
        <span class="tag-pill">${escapeHTML(label)} · ${count}</span>
      `).join("")}
    </div>
  `;
}

function renderHistory(entries) {
  const list = document.getElementById("historyList");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filterMood = document.getElementById("filterMood").value;
  const filterScore = document.getElementById("filterScore").value;

  let filtered = entries;

  if (filterMood !== "All") {
    filtered = filtered.filter(entry => entry.mood === filterMood);
  }

  if (filterScore === "High 8-10") {
    filtered = filtered.filter(entry => entry.score >= 8);
  }

  if (filterScore === "Medium 5-7") {
    filtered = filtered.filter(entry => entry.score >= 5 && entry.score <= 7);
  }

  if (filterScore === "Low 1-4") {
    filtered = filtered.filter(entry => entry.score <= 4);
  }

  if (search) {
    filtered = filtered.filter(entry => {
      const combined = `${entry.mood} ${entry.note} ${entry.gratitude} ${entry.triggers.join(" ")} ${entry.activities.join(" ")}`.toLowerCase();
      return combined.includes(search);
    });
  }

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-box wide">
        <h3>No entries found</h3>
        <p>Add a mood entry or adjust your search/filter.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(entry => `
    <article class="entry-card">
      <div class="entry-top">
        <span class="pill">${escapeHTML(entry.mood)}</span>
        <span class="pill score">${entry.score}/10</span>
      </div>

      <p>${escapeHTML(entry.note)}</p>

      ${
        entry.gratitude
          ? `<p><strong>Gratitude:</strong> ${escapeHTML(entry.gratitude)}</p>`
          : ""
      }

      <div>
        <span class="pill green">Energy ${entry.energy}/10</span>
        <span class="pill orange">Stress ${entry.stress}/10</span>
        <span class="pill">Sleep ${entry.sleep}h</span>
        <span class="pill">Water ${entry.water} cups</span>
      </div>

      ${
        entry.triggers.length
          ? `<p><strong>Triggers:</strong> ${entry.triggers.map(escapeHTML).join(", ")}</p>`
          : `<p><strong>Triggers:</strong> None logged</p>`
      }

      <div class="activity-list">
        ${
          entry.activities.length
            ? entry.activities.map(activity => `<span>${escapeHTML(activity)}</span>`).join("")
            : "<span>No activity logged</span>"
        }
      </div>

      <small>${new Date(entry.createdAt).toLocaleString()}</small>

      <button class="danger" onclick="deleteEntry(${entry.id})">Delete</button>
    </article>
  `).join("");
}

function exportCSV() {
  const entries = getEntries();

  if (entries.length === 0) {
    alert("No journal data to export.");
    return;
  }

  const headers = [
    "Mood",
    "Mood Score",
    "Energy",
    "Stress",
    "Sleep Hours",
    "Water Cups",
    "Note",
    "Gratitude",
    "Triggers",
    "Activities",
    "Created At"
  ];

  const rows = entries.map(entry => [
    entry.mood,
    entry.score,
    entry.energy,
    entry.stress,
    entry.sleep,
    entry.water,
    entry.note,
    entry.gratitude,
    entry.triggers.join("; "),
    entry.activities.join("; "),
    new Date(entry.createdAt).toLocaleString()
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  downloadFile(csv, "mindmood-journal.csv", "text/csv");
}

function exportJSON() {
  const entries = getEntries();

  if (entries.length === 0) {
    alert("No journal data to export.");
    return;
  }

  downloadFile(
    JSON.stringify(entries, null, 2),
    "mindmood-journal.json",
    "application/json"
  );
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function printJournal() {
  window.print();
}

function loadDemoData() {
  const now = Date.now();

  const demoEntries = [
    {
      id: now + 1,
      mood: "Motivated",
      score: 8,
      energy: 8,
      stress: 4,
      sleep: 7,
      water: 6,
      note: "Completed a meaningful task and felt productive today.",
      gratitude: "Grateful for finishing important work.",
      triggers: ["work", "achievement"],
      activities: ["Drank enough water", "Practiced gratitude", "Completed priority task"],
      createdAt: new Date(now).toISOString()
    },
    {
      id: now + 2,
      mood: "Tired",
      score: 5,
      energy: 4,
      stress: 6,
      sleep: 5,
      water: 4,
      note: "Felt tired after long work hours but managed to rest in the evening.",
      gratitude: "Grateful that I had time to rest.",
      triggers: ["work", "sleep"],
      activities: ["Had enough rest"],
      createdAt: new Date(now - 86400000).toISOString()
    },
    {
      id: now + 3,
      mood: "Calm",
      score: 7,
      energy: 6,
      stress: 3,
      sleep: 7.5,
      water: 5,
      note: "Had a calm day and spent some time away from screens.",
      gratitude: "Grateful for a peaceful evening.",
      triggers: ["rest", "family"],
      activities: ["Reduced screen time", "Talked to someone"],
      createdAt: new Date(now - 172800000).toISOString()
    },
    {
      id: now + 4,
      mood: "Stressed",
      score: 4,
      energy: 5,
      stress: 8,
      sleep: 6,
      water: 3,
      note: "Felt stressed because of multiple pending tasks.",
      gratitude: "Grateful for support from a colleague.",
      triggers: ["deadline", "workload"],
      activities: ["Took a mindful break"],
      createdAt: new Date(now - 259200000).toISOString()
    }
  ];

  saveEntries(demoEntries);
  renderApp();
}

function renderApp() {
  const entries = getEntries();

  updateFilterOptions(entries);
  renderDashboard(entries);
  renderMoodBreakdown(entries);
  renderTrend(entries);
  renderTagCloud("triggerBreakdown", getTriggerStats(entries), "No trigger data yet.");
  renderTagCloud("activityBreakdown", getActivityStats(entries), "No self-care data yet.");
  renderHistory(entries);
}

updateLabels();
renderApp();
