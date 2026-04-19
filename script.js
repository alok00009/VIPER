import { db } from './database.js';
import { ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

let lastInjectedPeriod = null;
let currentAPIPeriod = null;
let currentAPINum = null;
const userKey = localStorage.getItem('active_key');

// --- PREMIUM COPY FORMAT ---
window.copyHack = (period, pred, nums) => {
    const text = `🚀 NOBITA HACK V15 💀\n━━━━━━━━━━━━━━━\nPERIOD: ${period}\nPREDICTION: ${pred}\nOPPOSITE: ${nums}\n━━━━━━━━━━━━━━━`;
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('copyToast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    });
};

async function getRealResults() {
    try {
        const res = await fetch("https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json");
        const json = await res.json();
        return json.data.list;
    } catch (e) { return []; }
}

// --- AUTO INJECT LOGIC ---
async function autoInject(num, period) {
    const nextIssue = (BigInt(period) + 1n).toString();
    if (lastInjectedPeriod === nextIssue) return;
    
    document.getElementById('aiLoader').classList.remove('hidden');
    
    setTimeout(async () => {
        const n = parseInt(num);
        let size, opNums;

        // --- MATH LOGIC: Even -> BIG, Odd -> SMALL ---
        if (n % 2 === 0) {
            size = "BIG";
            opNums = "1, 3"; 
        } else {
            size = "SMALL";
            opNums = "7, 9";
        }

        const historyRef = push(ref(db, `user_history/${userKey}`));
        await set(historyRef, {
            period: nextIssue,
            prediction: size,
            opNums: opNums,
            time: new Date().toLocaleTimeString()
        });

        document.getElementById('wRes').innerText = size;
        document.getElementById('wRes').className = `hacker-font text-8xl ${size === 'BIG' ? 'text-red-500' : 'text-emerald-500'}`;
        document.getElementById('opNums').innerText = opNums;
        document.getElementById('aiLoader').classList.add('hidden');
        
        lastInjectedPeriod = nextIssue;
    }, 1500);
}

function loadHistory() {
    const listDiv = document.getElementById('historyList');
    onValue(ref(db, `user_history/${userKey}`), async (snapshot) => {
        const realData = await getRealResults();
        if (!snapshot.exists()) {
            listDiv.innerHTML = "<p class='text-center py-10 text-gray-800 text-[10px]'>SEARCHING...</p>";
            return;
        }

        listDiv.innerHTML = "";
        Object.values(snapshot.val()).reverse().forEach(item => {
            const match = realData.find(r => String(r.issueNumber).slice(-8) === String(item.period).slice(-8));
            let status = "JK (PENDING)", sCol = "text-gray-600", border = "border-white/5", resInfo = "---";

            if (match) {
                const rNum = parseInt(match.number);
                const rSize = rNum >= 5 ? "BIG" : "SMALL";
                resInfo = `${rSize} ${rNum}`;
                if (item.prediction === rSize) {
                    status = `WIN (${rSize})`; sCol = "text-emerald-500"; border = "border-emerald-500/20";
                } else {
                    status = `LOSS (${rSize} ${rNum})`; sCol = "text-red-500"; border = "border-red-500/20";
                }
            }

            listDiv.innerHTML += `
                <div class="history-card p-4 border ${border} mb-3 relative">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[7px] text-gray-500 font-bold uppercase">PRD: ...${item.period.toString().slice(-4)}</p>
                            <p class="text-[9px] font-bold text-white uppercase mt-1">PRED: ${item.prediction} | REAL: ${resInfo}</p>
                        </div>
                        <button onclick="copyHack('${item.period}', '${item.prediction}', '${item.opNums}')" class="bg-white/5 p-2 rounded-lg border border-white/10">
                            <svg class="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                        </button>
                    </div>
                    <div class="mt-2 flex justify-between items-end">
                        <p class="hacker-font text-[9px] ${sCol} italic">${status}</p>
                        <p class="text-[6px] text-white/10 font-bold">${item.time}</p>
                    </div>
                </div>
            `;
        });
    });
}

async function syncAPI() {
    const data = await getRealResults();
    if(data.length > 0) {
        currentAPINum = data[0].number;
        currentAPIPeriod = data[0].issueNumber;
        const nextLive = (BigInt(currentAPIPeriod) + 1n).toString();
        document.getElementById("nextPeriod").innerText = "LIVE PERIOD: " + nextLive.slice(-4);
        autoInject(currentAPINum, currentAPIPeriod);
    }
}

setInterval(syncAPI, 3000);
syncAPI();
loadHistory();
