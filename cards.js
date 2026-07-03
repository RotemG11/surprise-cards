// === הגדרות Firebase ===
// מלאו כאן את הפרטים שקיבלתם משלב 3 בהוראות ההקמה של Firebase
// (Project settings -> General -> Your apps -> SDK setup and configuration)
const firebaseConfig = {
  apiKey: "AIzaSyDPNwR6bELKZnKncYVl__psFkQNKY2NDl0",
  authDomain: "romi-birthday-cards.firebaseapp.com",
  projectId: "romi-birthday-cards",
  storageBucket: "romi-birthday-cards.firebasestorage.app",
  messagingSenderId: "1082725422298",
  appId: "1:1082725422298:web:5dfe7be02df7a26a5e01e3"
};

// קוד סודי משותף שצריך להכניס כדי לממש הטבה - אפשר לשנות בחופשיות
const SHARED_PASSCODE = "0407";

const NAME_STORAGE_KEY = "cardsUserName";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, onSnapshot, setDoc, serverTimestamp,
  collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getStoredName() {
  return localStorage.getItem(NAME_STORAGE_KEY) || "";
}

function setStoredName(name) {
  localStorage.setItem(NAME_STORAGE_KEY, name);
}

function clearStoredName() {
  localStorage.removeItem(NAME_STORAGE_KEY);
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function injectSharedStyles() {
  if (document.getElementById("cards-shared-style")) return;
  const style = document.createElement("style");
  style.id = "cards-shared-style";
  style.textContent = `
    .redeem-box{margin:22px 0 6px 0;text-align:center;}
    .redeem-btn{
      font-family:'Rubik', sans-serif;
      font-size:15px;
      font-weight:500;
      color:#fff;
      background:var(--blush, #E8918A);
      border:none;
      padding:12px 26px;
      border-radius:100px;
      cursor:pointer;
      box-shadow:0 8px 18px -8px rgba(74,59,52,.4);
    }
    .redeem-btn:hover{opacity:.92;}
    .redeem-loading{font-size:13px;color:var(--ink-soft,#8A7A6E);}
    .redeemed-badge{
      display:inline-block;
      font-size:13px;
      color:var(--sage,#8FA588);
      background:#EEF3EC;
      padding:10px 18px;
      border-radius:12px;
      line-height:1.6;
    }
    .redeem-user{
      margin-top:8px;
      font-size:11px;
      color:var(--ink-soft,#8A7A6E);
    }
    .redeem-user a{display:inline;margin:0;padding:0;background:none;color:var(--blush,#E8918A);text-decoration:underline;}
    .cards-modal-backdrop{
      position:fixed;inset:0;background:rgba(74,59,52,.45);
      display:flex;align-items:center;justify-content:center;
      z-index:1000;padding:20px;
    }
    .cards-modal{
      background:var(--card,#FFFDF9);
      border-radius:16px;
      padding:28px 24px;
      max-width:320px;
      width:100%;
      text-align:center;
      box-shadow:0 20px 45px -18px rgba(74,59,52,.5);
      font-family:'Rubik', sans-serif;
    }
    .cards-modal h3{
      font-family:'Varela Round', sans-serif;
      font-weight:400;
      margin:0 0 14px 0;
      color:var(--ink,#4A3B34);
    }
    .cards-modal input{
      width:100%;
      box-sizing:border-box;
      padding:10px 14px;
      margin-bottom:10px;
      border-radius:100px;
      border:1px solid #E5D9CE;
      font-family:'Rubik', sans-serif;
      font-size:14px;
      text-align:center;
    }
    .cards-modal .cards-modal-error{
      color:#C0524A;
      font-size:12px;
      margin-bottom:10px;
      min-height:14px;
    }
    .cards-modal-actions{display:flex;gap:8px;justify-content:center;}
    .cards-modal-actions button{
      font-family:'Rubik', sans-serif;
      font-size:14px;
      border:none;
      padding:10px 20px;
      border-radius:100px;
      cursor:pointer;
    }
    .cards-modal-submit{background:var(--blush,#E8918A);color:#fff;}
    .cards-modal-cancel{background:#F0E7D8;color:var(--ink,#4A3B34);}
    .cards-index-status{font-size:12px;margin-inline-start:6px;}
    .cards-index-status.done{color:var(--sage,#8FA588);}
    .cards-index-status.pending{color:var(--ink-soft,#8A7A6E);}
  `;
  document.head.appendChild(style);
}

function openLoginModal(onSuccess) {
  injectSharedStyles();
  const backdrop = document.createElement("div");
  backdrop.className = "cards-modal-backdrop";
  backdrop.innerHTML = `
    <div class="cards-modal">
      <h3>כניסה למימוש הטבה</h3>
      <input type="text" class="cards-modal-name" placeholder="השם שלך" autocomplete="off">
      <input type="password" class="cards-modal-pass" placeholder="קוד סודי" autocomplete="off">
      <div class="cards-modal-error"></div>
      <div class="cards-modal-actions">
        <button class="cards-modal-submit">כניסה</button>
        <button class="cards-modal-cancel">ביטול</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const nameInput = backdrop.querySelector(".cards-modal-name");
  const passInput = backdrop.querySelector(".cards-modal-pass");
  const errorBox = backdrop.querySelector(".cards-modal-error");

  function close() {
    backdrop.remove();
  }

  function submit() {
    const name = nameInput.value.trim();
    const pass = passInput.value;
    if (!name) {
      errorBox.textContent = "נא להזין שם";
      return;
    }
    if (pass !== SHARED_PASSCODE) {
      errorBox.textContent = "קוד סודי שגוי";
      return;
    }
    setStoredName(name);
    close();
    onSuccess(name);
  }

  backdrop.querySelector(".cards-modal-submit").addEventListener("click", submit);
  backdrop.querySelector(".cards-modal-cancel").addEventListener("click", close);
  passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
}

function getCardId() {
  const m = location.pathname.match(/(\d{2})\.html$/);
  return m ? m[1] : null;
}

function initCardPage(cardId) {
  injectSharedStyles();
  const wrap = document.querySelector(".wrap");
  if (!wrap) return;

  const box = document.createElement("div");
  box.className = "redeem-box";
  box.innerHTML = '<div class="redeem-loading">בודק סטטוס...</div>';
  wrap.appendChild(box);

  const ref = doc(db, "cards", cardId);

  async function doRedeem(name) {
    box.innerHTML = '<div class="redeem-loading">שומר...</div>';
    await setDoc(ref, {
      redeemed: true,
      redeemedBy: name,
      redeemedAt: serverTimestamp()
    }, { merge: true });
  }

  function render(data) {
    if (data && data.redeemed) {
      box.innerHTML = `<div class="redeemed-badge">✓ ההטבה מומשה ע"י ${escapeHtml(data.redeemedBy || "")}${data.redeemedAt ? " בתאריך " + formatDate(data.redeemedAt) : ""}</div>`;
      return;
    }

    box.innerHTML = "";
    const btn = document.createElement("button");
    btn.className = "redeem-btn";
    btn.textContent = "🎁 מימוש ההטבה";
    btn.addEventListener("click", () => {
      const existingName = getStoredName();
      if (existingName) {
        doRedeem(existingName);
      } else {
        openLoginModal((name) => doRedeem(name));
      }
    });
    box.appendChild(btn);

    const existingName = getStoredName();
    if (existingName) {
      const userLine = document.createElement("div");
      userLine.className = "redeem-user";
      userLine.innerHTML = `מחוברת/ים בתור ${escapeHtml(existingName)} · <a href="#" class="cards-switch-user">להתחלף</a>`;
      userLine.querySelector(".cards-switch-user").addEventListener("click", (e) => {
        e.preventDefault();
        clearStoredName();
        render(data);
      });
      box.appendChild(userLine);
    }
  }

  onSnapshot(ref, (snap) => render(snap.data()), () => {
    box.innerHTML = '<div class="redeem-loading">שגיאה בטעינת הסטטוס</div>';
  });
}

async function initIndexPage() {
  injectSharedStyles();
  const links = document.querySelectorAll("a[data-card]");
  if (!links.length) return;

  links.forEach((a) => {
    const status = document.createElement("span");
    status.className = "cards-index-status pending";
    status.textContent = "";
    a.appendChild(status);
  });

  try {
    const snap = await getDocs(collection(db, "cards"));
    const redeemed = {};
    snap.forEach((d) => { redeemed[d.id] = d.data(); });
    links.forEach((a) => {
      const id = a.dataset.card;
      const status = a.querySelector(".cards-index-status");
      if (redeemed[id] && redeemed[id].redeemed) {
        status.textContent = "✓ נוצל";
        status.className = "cards-index-status done";
      } else {
        status.textContent = "○ זמין";
        status.className = "cards-index-status pending";
      }
    });
  } catch (e) {
    // אם אין חיבור ל-Firestore, פשוט מציגים את הרשימה בלי סטטוס
  }
}

const cardId = getCardId();
if (cardId) {
  initCardPage(cardId);
} else if (document.body.id === "index-page") {
  initIndexPage();
}
