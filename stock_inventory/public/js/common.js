const pathName = window.location.pathname;
const activeClass = ["bg-blue-600", "text-white", "shadow-lg", "shadow-blue-200"];

if (pathName === '/') document.getElementById('nav-main')?.classList.add(...activeClass);
else if (pathName === '/dashboard') document.getElementById('nav-dashboard')?.classList.add(...activeClass);
else if (pathName === '/report') document.getElementById('nav-report')?.classList.add(...activeClass);
else if (pathName === '/data') document.getElementById('nav-data')?.classList.add(...activeClass);

function triggerExport(type) {
    if (type === 'PDF') {
        if (typeof exportToPDF === 'function') exportToPDF();
        else alert('หน้าจอนี้ยังไม่รองรับ PDF');
    } else {
        if (typeof exportToExcel === 'function') exportToExcel();
        else alert('หน้าจอนี้ยังไม่รองรับ Excel');
    }
}