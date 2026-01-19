let myChart = null;
let myPieChart = null;

async function initReport() {
    const month = document.getElementById('reportMonth').value;
    try {
        const response = await fetch(`/api/products/usage-report?month=${month}`);
        const data = await response.json();
        if (!data || data.length === 0) { resetDisplay(); return; }
        const processedData = data.map(item => ({ id: item.box_list, usage: parseInt(item.total_usage) }));
        renderTable(processedData);
        renderCharts(processedData);
        document.getElementById('top-box-name').innerText = processedData[0].id;
        document.getElementById('active-items-count').innerText = processedData.length;
        const total = processedData.reduce((sum, item) => sum + item.usage, 0);
        document.getElementById('total-usage').innerText = total.toLocaleString();
    } catch (err) { alert('ไม่สามารถเชื่อมต่อข้อมูลรายงานได้'); }
}

function resetDisplay() {
    document.getElementById('reportTableBody').innerHTML = '<tr><td colspan="3" class="p-10 text-center text-slate-400 font-bold">ไม่มีข้อมูลการเบิกใช้งานในเดือนนี้</td></tr>';
    document.getElementById('top-box-name').innerText = "-";
    document.getElementById('total-usage').innerText = "0";
    document.getElementById('active-items-count').innerText = "0";
    if (myChart) myChart.destroy();
    if (myPieChart) myPieChart.destroy();
}

function renderTable(data) {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = data.map((item, index) => `
        <tr class="border-b last:border-none hover:bg-slate-50 transition">
            <td class="py-4 font-bold text-slate-400">#${index + 1}</td>
            <td class="py-4 font-black text-slate-700">${item.id}</td>
            <td class="py-4 text-right font-bold text-blue-600">${item.usage.toLocaleString()} ใบ</td>
        </tr>
    `).join('');
}

function renderCharts(data) {
    const top5 = data.slice(0, 5);
    const ctxBar = document.getElementById('usageChart').getContext('2d');
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    if (myChart) myChart.destroy();
    if (myPieChart) myPieChart.destroy();
    myChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: top5.map(i => i.id),
            datasets: [{
                label: 'จำนวนการใช้งาน (ใบ)',
                data: top5.map(i => i.usage),
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    myPieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: top5.map(i => i.id),
            datasets: [{
                data: top5.map(i => i.usage),
                backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

async function exportToPDF() {
    const { value: mode } = await Swal.fire({
        title: 'เลือกรูปแบบการ Export PDF',
        text: "คุณต้องการรวมกราฟและยอดสรุปด้วยหรือไม่?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fas fa-chart-pie mr-2"></i> รวมกราฟและสรุปยอด',
        cancelButtonText: '<i class="fas fa-table mr-2"></i> เฉพาะตารางข้อมูล',
        reverseButtons: true
    });
    const isFullReport = mode === true;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const month = document.getElementById('reportMonth').options[document.getElementById('reportMonth').selectedIndex].text;
    doc.setFontSize(20);
    doc.text(`Usage Report: ${month}`, 14, 20);
    if (isFullReport) {
        doc.setFontSize(12);
        doc.text(`Total Usage: ${document.getElementById('total-usage').innerText} Units`, 14, 30);
        const imgData = document.getElementById('usageChart').toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 14, 45, 180, 60);
        doc.autoTable({ startY: 110, head: [['Rank', 'Box ID', 'Usage']], body: Array.from(document.querySelectorAll("#reportTableBody tr")).map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.innerText)) });
    } else {
        doc.autoTable({ startY: 30, head: [['Rank', 'Box ID', 'Usage']], body: Array.from(document.querySelectorAll("#reportTableBody tr")).map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.innerText)) });
    }
    doc.save(`Usage_Report_${month}.pdf`);
}

async function exportToExcel() {
    const { value: includeSummary } = await Swal.fire({
        title: 'ตั้งค่าไฟล์ Excel',
        text: "ต้องการเพิ่มแถวสรุปยอดรวมไว้ที่ท้ายตารางหรือไม่?",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'เพิ่มแถวสรุปยอด',
        cancelButtonText: 'ไม่ต้องเพิ่ม',
        reverseButtons: true
    });
    let data = [];
    document.querySelectorAll("#reportTableBody tr").forEach(row => {
        const cols = row.querySelectorAll("td");
        if(cols.length > 0) {
            data.push({ "Rank": cols[0].innerText.replace('#', '').trim(), "Box List": cols[1].innerText.trim(), "Usage": cols[2].innerText.replace(' ใบ', '').trim() });
        }
    });
    if (includeSummary) {
        data.push({});
        data.push({ "Rank": "SUMMARY", "Box List": "Total Usage", "Usage": document.getElementById('total-usage').innerText });
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Usage_Report_${document.getElementById('reportMonth').value}.xlsx`);
}
window.onload = initReport;