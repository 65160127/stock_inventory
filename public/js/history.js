let currentData = [];

async function loadHistory(filter = 'all') {
    // ปรับแต่งปุ่ม UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = "filter-btn px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-white transition-all";
    });
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.className = "filter-btn px-4 py-1.5 rounded-lg text-sm font-bold bg-blue-600 text-white shadow-sm transition-all";
    }

    try {
        const res = await fetch(`/api/products/history-data?filter=${filter}`);
        currentData = await res.json();
        renderTable(currentData);
    } catch (err) {
        console.error('Error:', err);
    }
}

function renderTable(data) {
    const body = document.getElementById('historyBody');
    if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-slate-400">ไม่พบข้อมูล</td></tr>';
        return;
    }
    body.innerHTML = data.map(log => `
        <tr class="border-b hover:bg-slate-50 transition">
            <td class="p-4 text-slate-500">${new Date(log.created_at).toLocaleString('th-TH')}</td>
            <td class="p-4 font-bold text-slate-800">${log.box_list}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full font-bold text-xs uppercase ${log.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">
                    ${log.type === 'in' ? 'นำเข้า' : 'เบิกจ่าย'}
                </span>
            </td>
            <td class="p-4 text-right font-black ${log.type === 'in' ? 'text-emerald-600' : 'text-blue-600'}">
                ${log.type === 'in' ? '+' : '-'} ${log.amount.toLocaleString()}
            </td>
        </tr>
    `).join('');
}

function exportToExcel() {
    if (currentData.length === 0) return Swal.fire('คำเตือน', 'ไม่มีข้อมูลสำหรับส่งออก', 'warning');
    const ws = XLSX.utils.json_to_sheet(currentData.map(log => ({
        "วัน-เวลา": new Date(log.created_at).toLocaleString('th-TH'),
        "รหัสสินค้า": log.box_list,
        "ประเภท": log.type === 'in' ? 'นำเข้า' : 'เบิกจ่าย',
        "จำนวน": log.amount
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, `Stock_History.xlsx`);
}

function exportToPDF() {
    if (currentData.length === 0) return Swal.fire('คำเตือน', 'ไม่มีข้อมูลสำหรับส่งออก', 'warning');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const body = currentData.map(log => [
        new Date(log.created_at).toLocaleString('th-TH'),
        log.box_list,
        log.type === 'in' ? 'นำเข้า' : 'เบิกจ่าย',
        log.amount
    ]);
    doc.text("Stock History Report", 14, 15);
    doc.autoTable({ head: [['Date/Time', 'Box List', 'Type', 'Amount']], body: body, startY: 20 });
    doc.save(`Stock_History.pdf`);
}

window.onload = () => loadHistory('all');