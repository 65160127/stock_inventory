var selectedBoxId = "";
var currentStockValue = 0;
var currentMinStock = 0;
var currentStatusFilter = 'all';

function switchView(view) {
    const grid = document.getElementById('gridView');
    const table = document.getElementById('tableView');
    const btnGrid = document.getElementById('btnGrid');
    const btnTable = document.getElementById('btnTable');
    if (view === 'grid') {
        grid.classList.remove('hidden');
        table.classList.add('hidden');
        btnGrid.className = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md transition";
        btnTable.className = "px-4 py-2 bg-white text-slate-500 border rounded-lg text-sm font-bold hover:bg-slate-50 transition";
    } else {
        grid.classList.add('hidden');
        table.classList.remove('hidden');
        btnTable.className = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md transition";
        btnGrid.className = "px-4 py-2 bg-white text-slate-500 border rounded-lg text-sm font-bold hover:bg-slate-50 transition";
    }
    applyAllFilters();
}

function setStatusAndFilter(status) {
    currentStatusFilter = status;
    document.querySelectorAll('.filter-status-btn').forEach(btn => {
        btn.className = "filter-status-btn px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-white transition-all";
    });
    const activeBtnId = 'status' + status.charAt(0).toUpperCase() + status.slice(1);
    document.getElementById(activeBtnId).className = "filter-status-btn px-4 py-1.5 rounded-lg text-sm font-bold bg-blue-600 text-white shadow-sm transition-all";
    applyAllFilters();
}

function applyAllFilters() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const suppValue = document.getElementById('suppFilter').value;
    const items = document.querySelectorAll('.product-item, .table-row-item');

    items.forEach(item => {
        const name = item.getAttribute('data-name') || "";
        const supp = item.getAttribute('data-supp') || "";
        const stock = parseInt(item.getAttribute('data-stock')) || 0;
        const min = parseInt(item.getAttribute('data-min')) || 0;
        const max = parseInt(item.getAttribute('data-max')) || 999999;

        const matchSearch = name.includes(searchText);
        const matchSupp = (suppValue === "" || supp === suppValue);
        
        let matchStatus = true;
        if (currentStatusFilter === 'normal') matchStatus = (stock > min && stock <= max);
        else if (currentStatusFilter === 'low') matchStatus = (stock <= min);
        else if (currentStatusFilter === 'over') matchStatus = (stock > max);

        if (matchSearch && matchSupp && matchStatus) {
            const displayType = item.classList.contains('table-row-item') ? 'table-row' : 'block';
            item.style.setProperty('display', displayType, 'important');
        } else {
            item.style.setProperty('display', 'none', 'important');
        }
    });
}

function openModal(boxId, stock, min) {
    selectedBoxId = boxId;
    currentStockValue = parseInt(stock);
    currentMinStock = parseInt(min);
    document.getElementById('modalTitle').innerText = boxId;
    document.getElementById('stockModal').classList.remove('hidden');
    document.getElementById('stockAmount').value = 0;
    document.getElementById('stockAmount').focus();
}

function closeModal() { document.getElementById('stockModal').classList.add('hidden'); }

async function handleStock(type) {
    const amount = parseInt(document.getElementById('stockAmount').value);
    if (!amount || amount <= 0) {
        return Swal.fire('ผิดพลาด', 'กรุณาระบุจำนวนที่ถูกต้อง', 'error');
    }

    let newStock = (type === 'update') ? currentStockValue + amount : currentStockValue - amount;
    if (newStock < 0) {
        return Swal.fire('สต็อกไม่เพียงพอ', 'ยอดคงเหลือไม่สามารถติดลบได้', 'warning');
    }

    try {
        const response = await fetch('/api/products/update-stock', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                updates: [{ 
                    box_list: selectedBoxId, 
                    new_stock: newStock, 
                    new_min: currentMinStock,
                    amount: amount,
                    change_type: type === 'update' ? 'in' : 'use'
                }] 
            })
        });

        if (response.ok) {

            closeModal();
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                text: `อัปเดตสต็อก ${selectedBoxId} เรียบร้อยแล้ว`,
                timer: 1500,
                showConfirmButton: false
            });


            updateDOMStock(selectedBoxId, newStock);
        }
    } catch (err) { 
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
}

function updateDOMStock(boxId, newStockValue) {
    const items = document.querySelectorAll(`[data-name="${boxId.toLowerCase()}"]`);
    items.forEach(item => {
        // อัปเดต attribute data-stock เพื่อให้ Filter ทำงานถูกต้อง
        item.setAttribute('data-stock', newStockValue);
        
        // ค้นหา element ที่แสดงตัวเลขสต็อกและเปลี่ยนค่า
        const stockDisplay = item.querySelector('.text-5xl, .text-lg.font-black');
        if (stockDisplay) {
            stockDisplay.innerText = newStockValue;
            
            // ปรับสีตัวเลขตาม Logic (Low/Normal/Overflow)
            const min = parseInt(item.getAttribute('data-min'));
            const max = parseInt(item.getAttribute('data-max')) || 0;
            
            stockDisplay.classList.remove('text-red-500', 'text-orange-500', 'text-blue-600');
            if (newStockValue <= min) stockDisplay.classList.add('text-red-500');
            else if (max > 0 && newStockValue > max) stockDisplay.classList.add('text-orange-500');
            else stockDisplay.classList.add('text-blue-600');
        }
    });
}

function getExportData() {
    const data = [];
    document.querySelectorAll(".table-row-item").forEach(row => {
        if (row.style.display !== "none") {
            const cols = row.querySelectorAll("td");
            data.push({
                "Box List": cols[0].innerText.trim(),
                "Supp Code": cols[1].innerText.trim(),
                "Stock": cols[2].innerText.trim(),
                "Min/Max": cols[3].innerText.trim()
            });
        }
    });
    return data;
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = getExportData();
    if (data.length === 0) return alert("ไม่มีข้อมูลสำหรับการ Export");
    const body = data.map(i => [i["Box List"], i["Supp Code"], i["Stock"], i["Min/Max"]]);
    doc.text("Stock Report", 14, 15);
    doc.autoTable({ head: [['Box List', 'Supp Code', 'Stock', 'Min/Max']], body: body, startY: 20 });
    doc.save(`Stock_Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportToExcel() {
    const data = getExportData();
    if (data.length === 0) return alert("ไม่มีข้อมูลสำหรับการ Export");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}