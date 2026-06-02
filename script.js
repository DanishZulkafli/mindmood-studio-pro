const STORAGE_KEY = "mindmood-studio-entries";

function getEntries() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function updateScoreLabel() {
  document.getElementById("scoreLabel").textContent = document.getElementById("score").value;
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

function addEntry() {
  const mood = document.getElementById("mood").value;
  const score = Number(document.getElementById("score").value);
  const note = document.getElementById("note").value.trim();
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
    note,
    activities,
    createdAt: new Date().toISOString()
  });

  saveEntries(entries);

  document.getElementById("note").value = "";
  document.getElementById("score").value = 5;
  updateScoreLabel();
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

function getMoodStats(entries) {
  const stats = {};

  entries.forEach(entry => {
    stats[entry.mood] = (stats[entry.mood] || 0) + 1;
  });

  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}

function getAverageMood(entries) {
  if (entries.length === 0) return 0;

  const total = entries.reduce((sum, entry) => sum + entry.score, 0);
  return (total / entries.length).toFixed(1);
}

function getBestMood(entries) {
  if (entries.length === 0) return 0;

  return Math.max(...entries.map(entry => entry.score));
}

function getSelfCareCount(entries) {
  return entries.reduce((sum, entry) => sum + entry.activities.length, 0);
}

function getInsight(entries) {
  if (entries.length === 0) {
    return {
      title: "No insight yet",
      text: "Add your first mood entry to receive a personalized wellness suggestion."
    };
  }

  const average = Number(getAverageMood(entries));
  const latest = entries[0];
  const selfCareCount = getSelfCareCount(entries);

  if (average >= 8) {
    return {
      title: "Positive mood pattern detected",
      text: "Your mood average is strong. Keep protecting the habits and environment that help you feel balanced."
    };
  }

  if (average >= 6) {
    return {
      title: "Stable but can improve",
      text: "Your mood pattern is moderate. Try adding one consistent self-care action such as rest, hydration, or short exercise."
    };
  }

  if (latest.score <= 4) {
    return {
      title: "Low mood support suggestion",
      text: "Your recent mood score is low. Consider taking a short break, talking to someone you trust, or doing one simple grounding activity."
    };
  }

  if (selfCareCount < entries.length) {
    return {
      title: "Self-care consistency needed",
      text: "You have fewer self-care activities compared with your mood entries. Try linking each reflection with one small action."
    };
  }

  return {
    title: "Keep observing your pattern",
    text: "Continue writing short reflections. Over time, your journal can help you understand what affects your mood most."
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
  const averageMood = getAverageMood(entries);
  const bestMood = getBestMood(entries);
  const selfCareCount = getSelfCareCount(entries);

  document.getElementById("totalEntries").textContent = entries.length;
  document.getElementById("averageMood").textContent = `${averageMood}/10`;
  document.getElementById("bestMood").textContent = `${bestMood}/10`;
  document.getElementById("selfCareCount").textContent = selfCareCount;

  document.getElementById("latestMood").textContent = latest ? latest.mood : "Not logged";
  document.getElementById("latestMoodScore").textContent = latest ? `Score: ${latest.score}/10` : "Score: 0/10";

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
          <span>${mood}</span>
          <span>${count} entries</span>
        </div>
        <div class="breakdown-bg">
          <div class="breakdown-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderHistory(entries) {
  const list = document.getElementById("historyList");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filter = document.getElementById("filterMood").value;

  let filtered = entries;

  if (filter !== "All") {
    filtered = filtered.filter(entry => entry.mood === filter);
  }

  if (search) {
    filtered = filtered.filter(entry => {
      const combined = `${entry.mood} ${entry.note} ${entry.activities.join(" ")}`.toLowerCase();
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
        <span class="pill">${entry.mood}</span>
        <span class="pill score">${entry.score}/10</span>
      </div>

      <p>${entry.note}</p>

      <div class="activity-list">
        ${
          entry.activities.length
            ? entry.activities.map(activity => `<span>${activity}</span>`).join("")
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

  const headers = ["Mood", "Score", "Note", "Activities", "Created At"];

  const rows = entries.map(entry => [
    entry.mood,
    entry.score,
    entry.note,
    entry.activities.join("; "),
    new Date(entry.createdAt).toLocaleString()
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "mindmood-journal.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function loadDemoData() {
  const demoEntries = [
    {
      id: Date.now() + 1,
      mood: "Motivated",
      score: 8,
      note: "Completed a meaningful task and felt productive today.",
      activities: ["Drank enough water", "Practiced gratitude"],
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 2,
      mood: "Tired",
      score: 5,
      note: "Felt tired after long work hours but managed to rest in the evening.",
      activities: ["Had enough rest"],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: Date.now() + 3,
      mood: "Calm",
      score: 7,
      note: "Had a calm day and spent some time away from screens.",
      activities: ["Reduced screen time", "Talked to someone"],
      createdAt: new Date(Date.now() - 172800000).toISOString()
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
  renderHistory(entries);
}

updateScoreLabel();
renderApp();
