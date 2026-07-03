// התוכנית של היום - כדי להוסיף/לערוך שורה, פשוט הוסיפו/שנו אובייקט ברשימה כאן
const PLAN_ITEMS = [
  { time: "7:30", text: "left the home" },
  { time: "9:00", text: "\"אגדודו בבריכה\"" },
  { time: "2:00", text: "מסאז" },
];

function renderPlan() {
  const container = document.getElementById("plan-list");
  if (!container) return;
  container.innerHTML = "";
  PLAN_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "plan-row";
    row.innerHTML = `<span class="plan-time">${item.time}</span><span class="plan-text">${item.text}</span>`;
    container.appendChild(row);
  });
}

renderPlan();
