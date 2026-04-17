/**
 * Exporta datos a Excel sin dependencias externas.
 * Usa SpreadsheetML (XML) que Excel, LibreOffice y Google Sheets abren nativamente.
 */

export function todayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSpreadsheetML(rows) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  const headerRow = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join("");

  const dataRows = rows
    .map((row) => {
      const cells = headers
        .map((h) => {
          const val = row[h];
          const isNumber = typeof val === "number" && isFinite(val);
          const type = isNumber ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${escapeXml(val)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Datos">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToExcel(rows, _sheetName, fileName) {
  if (!rows.length) return;

  const xml = buildSpreadsheetML(rows);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });

  // Cambiar extensión a .xls para que el navegador lo abra con Excel
  const xlsFileName = fileName.replace(/\.xlsx?$/i, ".xls");
  downloadBlob(blob, xlsFileName);
}
