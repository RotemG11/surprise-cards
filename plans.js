// התוכנית של היום - כדי להוסיף/לערוך שורה, פשוט הוסיפו/שנו אובייקט ברשימה כאן
// theme אפשריים (הרקע של השורה): home, pool, spa, dinner
const PLAN_ITEMS = [
  { time: "7:30", text: "left the home", icon: "🏠", theme: "home" },
  { time: "9:00", text: "\"אגדודו בבריכה\"", icon: "🏊‍♀️", theme: "pool" },
  { time: "2:00", text: "מסאז", icon: "💆‍♀️", theme: "spa" },
  { time: "19:00", text: "ארוחת ערב מפנקת", icon: "🍽️", theme: "dinner" },
];

function renderPlan() {
  const container = document.getElementById("plan-list");
  if (!container) return;
  container.innerHTML = "";
  PLAN_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = `plan-row theme-${item.theme}`;
    row.innerHTML = `
      <span class="plan-icon">${item.icon}</span>
      <span class="plan-info">
        <span class="plan-text">${item.text}</span>
        <span class="plan-time">${item.time}</span>
      </span>
    `;
    container.appendChild(row);
  });
}

renderPlan();
