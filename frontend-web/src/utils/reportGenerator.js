import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- GENERAR PDF (HU13) ---
export const generatePDF = (stats) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // 1. Encabezado / Logo
    doc.setFillColor(103, 58, 183); // Color Morado (Tu marca)
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Gaming Store SOA - Reporte Ejecutivo', 14, 13);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${date}`, 14, 30);

    // 2. Resumen General (KPIs)
    doc.setFontSize(14);
    doc.text('Resumen General', 14, 40);
    
    const summaryData = [
        ['Ingresos Totales', `$${stats.summary.totalRevenue.toLocaleString()}`],
        ['Ventas Totales', stats.summary.totalSales],
        ['Producto Estrella', stats.topProducts[0]?.productName || 'N/A']
    ];

    doc.autoTable({
        startY: 45,
        head: [['Métrica', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [103, 58, 183] }
    });

    // 3. Tabla de Productos Top
    doc.text('Top 5 Productos Más Vendidos', 14, doc.lastAutoTable.finalY + 15);
    
    const productsData = stats.topProducts.map(p => [
        p.productName,
        p.quantitySold,
        `$${p.revenue.toLocaleString()}`
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Producto', 'Unidades', 'Ingresos']],
        body: productsData,
        theme: 'striped',
        headStyles: { fillColor: [33, 150, 243] } // Azul
    });

    // 4. Tabla de Vendedores
    doc.text('Rendimiento de Vendedores', 14, doc.lastAutoTable.finalY + 15);

    const sellersData = stats.salesBySeller.map(s => [
        s.sellerName,
        s.totalSales,
        `$${s.totalRevenue.toLocaleString()}`
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Vendedor', 'Ventas', 'Total Generado']],
        body: sellersData,
        theme: 'striped',
        headStyles: { fillColor: [255, 152, 0] } // Naranja
    });

    // Pie de página
    doc.setFontSize(8);
    doc.text('Reporte generado automáticamente por el sistema SOA.', 14, 280);

    doc.save(`Reporte_Ventas_${date.replace(/\//g, '-')}.pdf`);
};

// --- GENERAR EXCEL (HU14) ---
export const generateExcel = (stats) => {
    const wb = XLSX.utils.book_new();
    const date = new Date().toLocaleDateString();

    // Hoja 1: Resumen
    const summaryData = [
        ['REPORTE DE VENTAS', ''],
        ['Fecha', date],
        ['', ''],
        ['METRICA', 'VALOR'],
        ['Ingresos Totales', stats.summary.totalRevenue],
        ['Ventas Realizadas', stats.summary.totalSales]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

    // Hoja 2: Productos
    const wsProducts = XLSX.utils.json_to_sheet(stats.topProducts.map(p => ({
        Producto: p.productName,
        Unidades_Vendidas: p.quantitySold,
        Ingresos_Generados: p.revenue
    })));
    XLSX.utils.book_append_sheet(wb, wsProducts, "Productos Top");

    // Hoja 3: Vendedores
    const wsSellers = XLSX.utils.json_to_sheet(stats.salesBySeller.map(s => ({
        Vendedor: s.sellerName,
        Total_Ventas: s.totalSales,
        Dinero_Generado: s.totalRevenue
    })));
    XLSX.utils.book_append_sheet(wb, wsSellers, "Vendedores");

    // Guardar archivo
    XLSX.writeFile(wb, `Reporte_GamingStore_${date.replace(/\//g, '-')}.xlsx`);
};