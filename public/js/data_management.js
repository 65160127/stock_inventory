function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const supp = document.getElementById('suppFilter').value;
    document.querySelectorAll('.data-row').forEach(row => {
        const nameMatch = row.dataset.name.includes(search);
        const suppMatch = supp === "" || row.dataset.supp === supp;
        row.style.display = (nameMatch && suppMatch) ? "" : "none";
    });
}

async function deleteItem(boxList) {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `คุณต้องการลบสินค้า "${boxList}" ใช่หรือไม่? ข้อมูลนี้จะไม่สามารถกู้คืนได้`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`/api/products/${boxList}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire('ลบสำเร็จ!', 'ข้อมูลสินค้าถูกลบออกจากระบบแล้ว', 'success');
                document.querySelector(`tr[data-name="${boxList.toLowerCase()}"]`).remove();
            }
        } catch (err) {
            Swal.fire('ผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
        }
    }
}

function openEditModal(productData) {
    const product = JSON.parse(productData);
    document.getElementById('editBoxList').value = product.box_list;
    document.getElementById('editSuppCode').value = product.supp_code;
    document.getElementById('editProcess').value = product.process || '';
    document.getElementById('editMin').value = product.min_stock;
    document.getElementById('editMax').value = product.max_stock || 0;
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() { document.getElementById('editModal').classList.add('hidden'); }

async function saveEdit() {
    const data = {
        box_list: document.getElementById('editBoxList').value,
        supp_code: document.getElementById('editSuppCode').value,
        process: document.getElementById('editProcess').value,
        min_stock: document.getElementById('editMin').value,
        max_stock: document.getElementById('editMax').value
    };
    try {
        const res = await fetch('/api/products/edit', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) { alert('บันทึกการเปลี่ยนแปลงสำเร็จ'); location.reload(); }
        else { const error = await res.json(); alert('Error: ' + error.error); }
    } catch (err) { alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'); }
}

function getManagementData() {
    const rows = document.querySelectorAll(".data-row");
    const data = [];
    rows.forEach(row => {
        if (row.style.display !== "none") {
            const cols = row.querySelectorAll("td");
            data.push({
                "Box List": cols[0].innerText.trim(),
                "Supplier": cols[1].innerText.trim(),
                "Process": cols[2].innerText.trim(),
                "Min Stock": cols[3].innerText.trim(),
                "Max Stock": cols[4].innerText.trim()
            });
        }
    });
    return data;
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = getManagementData();
    const body = data.map(item => [item["Box List"], item["Supplier"], item["Process"], item["Min Stock"], item["Max Stock"]]);
    doc.text("Master Data Report", 14, 15);
    doc.autoTable({ head: [['Box List', 'Supplier', 'Process', 'Min', 'Max']], body: body, startY: 20 });
    doc.save("Master_Data.pdf");
}

function exportToExcel() {
    const data = getManagementData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MasterData");
    XLSX.writeFile(wb, "Master_Data.xlsx");
}