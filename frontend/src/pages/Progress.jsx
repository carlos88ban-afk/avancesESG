import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { progressService } from '@/api/services';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Code2, Copy, Download, Filter, Info, Mail, RefreshCw, Search, XCircle } from 'lucide-react';

const MONTHS = [
  { value: '01', label: 'Ene' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Abr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Ago' },
  { value: '09', label: 'Set' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dic' },
];

const REPORT_COLUMNS = [
  { header: 'Proveedor', key: 'proveedor', width: 34 },
  { header: 'RUC', key: 'ruc', width: 16 },
  { header: 'Critico para', key: 'critico_para', width: 22 },
  { header: 'Tipo', key: 'tipo', width: 14 },
  { header: 'Fecha respuesta', key: 'fecha_respuesta', width: 18 },
  { header: 'Estado', key: 'estado', width: 16 },
  { header: 'Metodo Match', key: 'tipo_de_cruce', width: 22 },
  { header: 'Respondio en', key: 'respondio_en', width: 26 },
];

const CORPORATE = {
  navy: '1F2937',
  blue: '2563EB',
  green: 'DCFCE7',
  greenText: '166534',
  red: 'FEE2E2',
  redText: '991B1B',
  amber: 'FEF3C7',
  amberText: '92400E',
  gray: 'F3F4F6',
  border: 'D1D5DB',
  white: 'FFFFFF',
};

/** @param {string | null | undefined} dateStr */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * @param {string[]} arr
 * @param {string} val
 * @returns {string[]}
 */
function toggle(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

function normalizeStatus(status) {
  if (status === 'completado') return 'Completado';
  if (status === 'pendiente') return 'Pendiente';
  if (status === 'vencido') return 'Vencido';
  return status || '-';
}

function getStatusStyle(status) {
  if (status === 'completado') {
    return 'StatusComplete';
  }
  if (status === 'vencido') {
    return 'StatusOverdue';
  }
  return 'StatusPending';
}

function buildFilterDescription({
  unitFilter,
  tipoFilter,
  statusFilter,
  search,
  selectedYears,
  selectedMonths,
}) {
  const filters = [];
  if (unitFilter !== 'all') filters.push(`Unidad: ${unitFilter}`);
  if (tipoFilter !== 'all') filters.push(`Tipo: ${tipoFilter}`);
  if (statusFilter !== 'all') filters.push(`Estado: ${normalizeStatus(statusFilter)}`);
  if (search) filters.push(`Busqueda: ${search}`);
  if (selectedYears.length) filters.push(`Anios: ${selectedYears.join(', ')}`);
  if (selectedMonths.length) {
    const monthLabels = MONTHS.filter(m => selectedMonths.includes(m.value)).map(m => m.label);
    filters.push(`Meses: ${monthLabels.join(', ')}`);
  }
  return filters.length ? filters.join(' | ') : 'Sin filtros aplicados: se incluyen todos los datos disponibles';
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || 'Sin dato';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlCell(value, styleId = 'Text', type = 'String', mergeAcross = 0) {
  const mergeAttr = mergeAcross ? ` ss:MergeAcross="${mergeAcross}"` : '';
  const safeValue = type === 'Number' ? Number(value || 0) : xmlEscape(value || '-');
  return `<Cell ss:StyleID="${styleId}"${mergeAttr}><Data ss:Type="${type}">${safeValue}</Data></Cell>`;
}

function xmlRow(cells, height = 22) {
  return `<Row ss:Height="${height}">${cells.join('')}</Row>`;
}

function buildExcelXml(rows, filterDescription) {
  const generatedAt = formatDateTime();
  const completed = rows.filter(r => r.estado === 'completado').length;
  const pending = rows.filter(r => r.estado === 'pendiente').length;
  const total = rows.length;
  const completionRate = total ? `${Math.round((completed / total) * 100)}%` : '0%';
  const byUnit = Object.entries(countBy(rows, 'critico_para')).sort((a, b) => b[1] - a[1]);

  const summaryRows = [
    xmlRow([xmlCell('Reporte de avance de encuestas ESG', 'Title', 'String', 3)], 30),
    xmlRow([xmlCell('Fecha de generacion', 'MetaLabel'), xmlCell(generatedAt, 'MetaValue')]),
    xmlRow([xmlCell('Filtros aplicados', 'MetaLabel'), xmlCell(filterDescription, 'MetaValue', 'String', 2)]),
    xmlRow([xmlCell('', 'Blank')], 10),
    xmlRow([xmlCell('Resumen ejecutivo', 'Section', 'String', 1)], 24),
    xmlRow([xmlCell('Total proveedores', 'TextBold'), xmlCell(total, 'Number', 'Number')]),
    xmlRow([xmlCell('Completados', 'TextBold'), xmlCell(completed, 'StatusComplete', 'Number')]),
    xmlRow([xmlCell('Pendientes', 'TextBold'), xmlCell(pending, 'StatusPending', 'Number')]),
    xmlRow([xmlCell('Avance total', 'TextBold'), xmlCell(completionRate, 'MetaValue')]),
    xmlRow([xmlCell('', 'Blank')], 10),
    xmlRow([xmlCell('Resumen por unidad', 'Section', 'String', 1)], 24),
    xmlRow([xmlCell('Unidad de negocio', 'Header'), xmlCell('Total proveedores', 'Header')]),
    ...byUnit.map(([unit, count]) => xmlRow([xmlCell(unit, 'Text'), xmlCell(count, 'Number', 'Number')])),
  ].join('');

  const detailRows = [
    xmlRow([xmlCell('Reporte de avance de encuestas ESG', 'Title', 'String', REPORT_COLUMNS.length - 1)], 30),
    xmlRow([xmlCell('Fecha de generacion', 'MetaLabel'), xmlCell(generatedAt, 'MetaValue', 'String', 2)]),
    xmlRow([xmlCell('Filtros aplicados', 'MetaLabel'), xmlCell(filterDescription, 'MetaValue', 'String', 6)]),
    xmlRow([
      xmlCell('Total proveedores', 'MetaLabel'),
      xmlCell(total, 'Number', 'Number'),
      xmlCell('Completados', 'MetaLabel'),
      xmlCell(completed, 'StatusComplete', 'Number'),
      xmlCell('Pendientes', 'MetaLabel'),
      xmlCell(pending, 'StatusPending', 'Number'),
    ]),
    xmlRow([xmlCell('', 'Blank')], 10),
    xmlRow(REPORT_COLUMNS.map(col => xmlCell(col.header, 'Header')), 24),
    ...rows.map(row => xmlRow(REPORT_COLUMNS.map(col => {
      if (col.key === 'fecha_respuesta') return xmlCell(formatDate(row.fecha_respuesta), 'Center');
      if (col.key === 'estado') return xmlCell(normalizeStatus(row.estado), getStatusStyle(row.estado));
      return xmlCell(row[col.key] || '-', col.key === 'ruc' ? 'Center' : 'Text');
    }))),
  ].join('');

  const detailColumns = REPORT_COLUMNS.map(col => `<Column ss:Width="${col.width * 6}"/>`).join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
  <Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#${CORPORATE.white}"/><Interior ss:Color="#${CORPORATE.navy}" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Section"><Font ss:Bold="1" ss:Color="#${CORPORATE.white}"/><Interior ss:Color="#${CORPORATE.blue}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Color="#${CORPORATE.white}"/><Interior ss:Color="#${CORPORATE.blue}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="MetaLabel"><Font ss:Bold="1"/><Interior ss:Color="#${CORPORATE.gray}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="MetaValue"><Alignment ss:WrapText="1"/><Interior ss:Color="#${CORPORATE.gray}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="Text"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="TextBold"><Font ss:Bold="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="Center"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="Number"><Alignment ss:Horizontal="Center"/><NumberFormat ss:Format="0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="StatusComplete"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1" ss:Color="#${CORPORATE.greenText}"/><Interior ss:Color="#${CORPORATE.green}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="StatusPending"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1" ss:Color="#${CORPORATE.redText}"/><Interior ss:Color="#${CORPORATE.red}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="StatusOverdue"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1" ss:Color="#${CORPORATE.amberText}"/><Interior ss:Color="#${CORPORATE.amber}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#${CORPORATE.border}"/></Borders></Style>
  <Style ss:ID="Blank"/>
 </Styles>
 <Worksheet ss:Name="Resumen ejecutivo">
  <Table><Column ss:Width="210"/><Column ss:Width="150"/><Column ss:Width="150"/><Column ss:Width="150"/>${summaryRows}</Table>
 </Worksheet>
 <Worksheet ss:Name="Detalle">
  <Table>${detailColumns}${detailRows}</Table>
  <AutoFilter x:Range="R6C1:R${Math.max(6, rows.length + 6)}C${REPORT_COLUMNS.length}" xmlns="urn:schemas-microsoft-com:office:excel"/>
 </Worksheet>
</Workbook>`;
}

function downloadExcelReport(rows, filterDescription) {
  const xml = buildExcelXml(rows, filterDescription);
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const datePart = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `reporte_avances_esg_${datePart}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildEmailSubject(unit) {
  return `Seguimiento de proveedores pendientes - ${unit}`;
}

function buildEmailHtml(unit, pendingRows) {
  const safeUnit = xmlEscape(unit);
  const rowsHtml = pendingRows.map((row, index) => `
    <tr style="background-color:${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="border:1px solid #e5e7eb;padding:10px 12px;color:#111827;font-size:14px;line-height:1.35;">${xmlEscape(row.proveedor || '-')}</td>
      <td style="border:1px solid #e5e7eb;padding:10px 12px;color:#374151;font-size:14px;line-height:1.35;font-family:Consolas,Arial,sans-serif;">${xmlEscape(row.ruc || '-')}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:14px;line-height:1.55;max-width:760px;">
      <p style="margin:0 0 14px 0;"><strong>Asunto:</strong> ${xmlEscape(buildEmailSubject(unit))}</p>
      <p style="margin:0 0 14px 0;">Estimado equipo de ${safeUnit},</p>
      <p style="margin:0 0 14px 0;">
        Se ha identificado que existen proveedores pendientes de completar la encuesta ESG.
        Su seguimiento es importante para asegurar el avance oportuno del proceso y mantener la informacion de cumplimiento actualizada.
      </p>
      <p style="margin:0 0 12px 0;font-weight:600;color:#1f2937;">
        A continuacion, se detallan los proveedores que requieren accion:
      </p>
      <table style="border-collapse:collapse;width:100%;margin:0 0 16px 0;border:1px solid #d1d5db;">
        <thead>
          <tr style="background-color:#f3f4f6;">
            <th style="border:1px solid #d1d5db;padding:10px 12px;text-align:left;color:#1f2937;font-size:13px;font-weight:700;">Nombre del proveedor</th>
            <th style="border:1px solid #d1d5db;padding:10px 12px;text-align:left;color:#1f2937;font-size:13px;font-weight:700;width:160px;">RUC</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <p style="margin:0 0 14px 0;">
        Agradeceremos su apoyo para gestionar estos pendientes a la brevedad.
      </p>
      <p style="margin:0;">Saludos cordiales,</p>
    </div>
  `.trim();
}

function buildEmailPlainText(unit, pendingRows) {
  const tableRows = pendingRows
    .map(row => `${row.proveedor || '-'}\t${row.ruc || '-'}`)
    .join('\n');

  return [
    `Asunto: ${buildEmailSubject(unit)}`,
    '',
    `Estimado equipo de ${unit},`,
    '',
    'Se ha identificado que existen proveedores pendientes de completar la encuesta ESG. Su seguimiento es importante para asegurar el avance oportuno del proceso y mantener la informacion de cumplimiento actualizada.',
    '',
    'A continuacion, se detallan los proveedores que requieren accion:',
    '',
    'Nombre del proveedor\tRUC',
    tableRows,
    '',
    'Agradeceremos su apoyo para gestionar estos pendientes a la brevedad.',
    '',
    'Saludos cordiales,',
  ].join('\n');
}

export default function Progress() {
  const queryClient = useQueryClient();
  const [unitFilter, setUnitFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressService.getAll(),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });
  /** @type {any[]} */
  const rows = data ?? [];

  const uniqueUnits = [...new Set(rows.map((/** @type {any} */ r) => r.critico_para).filter(Boolean))].sort();
  const uniqueYears = [...new Set(rows.filter(r => r.fecha_respuesta).map(r => r.fecha_respuesta.slice(0, 4)))].sort();
  const activeMonths = new Set(rows.filter(r => r.fecha_respuesta).map(r => r.fecha_respuesta.slice(5, 7)));

  const hasAnyFilter =
    unitFilter !== 'all' || tipoFilter !== 'all' || statusFilter !== 'all' ||
    search || selectedYears.length > 0 || selectedMonths.length > 0;

  const filteredRows = useMemo(() => {
    const hasDateFilter = selectedYears.length > 0 || selectedMonths.length > 0;
    return rows.filter(r => {
      if (unitFilter !== 'all' && r.critico_para !== unitFilter) return false;
      if (tipoFilter !== 'all' && r.tipo !== tipoFilter) return false;
      if (statusFilter !== 'all' && r.estado !== statusFilter) return false;
      if (hasDateFilter) {
        if (!r.fecha_respuesta) return false;
        const yr = r.fecha_respuesta.slice(0, 4);
        const mo = r.fecha_respuesta.slice(5, 7);
        if (selectedYears.length > 0 && !selectedYears.includes(yr)) return false;
        if (selectedMonths.length > 0 && !selectedMonths.includes(mo)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (r.proveedor || '').toLowerCase().includes(q) || (r.ruc || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, unitFilter, tipoFilter, statusFilter, selectedYears, selectedMonths, search]);

  const filteredPendingRowsForUnit = useMemo(() => {
    if (unitFilter === 'all') return [];
    return rows.filter(r => r.critico_para === unitFilter && r.estado === 'pendiente');
  }, [rows, unitFilter]);

  const shouldShowMailButton =
    unitFilter !== 'all' &&
    statusFilter === 'pendiente' &&
    filteredRows.some(r => r.estado === 'pendiente' && r.critico_para === unitFilter);

  const completedCount = filteredRows.filter(r => r.estado === 'completado').length;
  const pendingCount = filteredRows.filter(r => r.estado === 'pendiente').length;
  const total = filteredRows.length;
  const filterDescription = buildFilterDescription({
    unitFilter,
    tipoFilter,
    statusFilter,
    search,
    selectedYears,
    selectedMonths,
  });
  const emailHtml = useMemo(
    () => buildEmailHtml(unitFilter, filteredPendingRowsForUnit),
    [unitFilter, filteredPendingRowsForUnit],
  );
  const emailPlainText = useMemo(
    () => buildEmailPlainText(unitFilter, filteredPendingRowsForUnit),
    [unitFilter, filteredPendingRowsForUnit],
  );
  const Provider = /** @type {any} */ (TooltipProvider);

  const handleExportExcel = () => {
    if (!rows.length) {
      toast.error('No hay datos disponibles para exportar');
      return;
    }

    const exportRows = hasAnyFilter ? filteredRows : rows;
    if (!exportRows.length) {
      toast.error('No hay datos para exportar con los filtros seleccionados');
      return;
    }

    downloadExcelReport(exportRows, filterDescription);
    toast.success('Reporte Excel generado');
  };

  const handleCopyEmail = async () => {
    try {
      if (window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([emailHtml], { type: 'text/html' }),
            'text/plain': new Blob([emailPlainText], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(emailPlainText);
      }
      toast.success('Correo copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el correo');
    }
  };

  const handleCopyEmailHtml = async () => {
    try {
      await navigator.clipboard.writeText(emailHtml);
      toast.success('HTML del correo copiado');
    } catch {
      toast.error('No se pudo copiar el HTML');
    }
  };

  return (
    <Provider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Avances</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Estado de completacion de encuestas ESG por proveedor y unidad
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={handleExportExcel}
              disabled={isLoading}
            >
              <Download className="w-4 h-4" />
              Descargar Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['progress'] })}
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proveedor o RUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-56"
            />
          </div>
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Critico para" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las unidades</SelectItem>
              {uniqueUnits.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="no retail">No retail</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
          {shouldShowMailButton && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setIsMailModalOpen(true)}
            >
              <Mail className="w-4 h-4" />
              Generar correo para la unidad
            </Button>
          )}
        </div>

        {uniqueYears.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground min-w-[2.5rem]">Anio:</span>
              {uniqueYears.map(yr => (
                <button
                  key={yr}
                  onClick={() => setSelectedYears(prev => toggle(prev, yr))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedYears.includes(yr)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {yr}
                </button>
              ))}
              {selectedYears.length > 0 && (
                <button
                  onClick={() => setSelectedYears([])}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground min-w-[2.5rem]">Mes:</span>
              {MONTHS.filter(m => activeMonths.has(m.value)).map(m => (
                <button
                  key={m.value}
                  onClick={() => setSelectedMonths(prev => toggle(prev, m.value))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedMonths.includes(m.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              {selectedMonths.length > 0 && (
                <button
                  onClick={() => setSelectedMonths([])}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-accent" />
              {completedCount} completados ({total ? Math.round((completedCount / total) * 100) : 0}%)
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <XCircle className="w-3.5 h-3.5 mr-1.5 text-destructive" />
              {pendingCount} pendientes ({total ? Math.round((pendingCount / total) * 100) : 0}%)
            </Badge>
          </div>
          {unitFilter !== 'all' && statusFilter === 'pendiente' && !shouldShowMailButton && !isLoading && (
            <span className="text-xs text-muted-foreground">
              No hay proveedores pendientes para generar correo en la unidad seleccionada.
            </span>
          )}
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Proveedor</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead>Critico para</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha respuesta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Metodo Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(7).fill(0).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {hasAnyFilter
                        ? 'No se encontraron registros con los filtros seleccionados'
                        : 'No hay datos disponibles'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((r, i) => (
                    <TableRow
                      key={`${r.proveedor}-${r.critico_para}-${i}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium">{r.proveedor}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{r.ruc || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.critico_para || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-[10px]">{r.tipo || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(r.fecha_respuesta)}
                      </TableCell>
                      <TableCell>
                        {r.estado === 'completado' ? (
                          <Badge className="bg-accent text-accent-foreground">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completado
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
                            <XCircle className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.tipo_de_cruce ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">{r.tipo_de_cruce}</span>
                            {r.respondio_en && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="font-medium mb-0.5">Respondio en</p>
                                  <p>{r.respondio_en}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={isMailModalOpen} onOpenChange={setIsMailModalOpen}>
          <DialogContent className="max-h-[80vh] w-[calc(100vw-1.5rem)] max-w-4xl grid-rows-[auto,minmax(0,1fr),auto] gap-0 overflow-hidden p-0 sm:w-full">
            <DialogHeader className="border-b px-5 py-4 pr-11 sm:px-6">
              <DialogTitle>Correo para {unitFilter}</DialogTitle>
              <DialogDescription>
                Vista previa lista para copiar en Outlook o Gmail.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 overflow-y-auto bg-muted/30 px-4 py-4 sm:px-6">
              <div className="mb-3 flex flex-col gap-1 rounded-md border bg-background px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-foreground">Asunto</span>
                <span className="text-muted-foreground sm:text-right">{buildEmailSubject(unitFilter)}</span>
              </div>

              <div className="overflow-x-auto rounded-md border bg-white p-4 shadow-sm sm:p-6">
                <div
                  className="min-w-[560px]"
                  dangerouslySetInnerHTML={{ __html: emailHtml }}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 border-t bg-background px-5 py-4 sm:px-6">
              <Button variant="outline" onClick={() => setIsMailModalOpen(false)}>
                Cerrar
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleCopyEmailHtml}>
                <Code2 className="w-4 h-4" />
                Copiar como HTML
              </Button>
              <Button className="gap-2" onClick={handleCopyEmail}>
                <Copy className="w-4 h-4" />
                Copiar correo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Provider>
  );
}
