import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload as UploadIcon, FileSpreadsheet, Loader2, CheckCircle2, ArrowRight, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { uploadService } from '@/api/services';
import * as XLSX from 'xlsx';

export default function Upload() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [duplicatesPreview, setDuplicatesPreview] = useState([]);
  const pollingRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((fileId) => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await uploadService.getStatus(fileId);
        setStatusData(status);
        if (status.status === 'processed' || status.status === 'error') {
          stopPolling();
        }
      } catch {
        // ignore polling errors — the mutation handles the final outcome
      }
    }, 2500);
  }, [stopPolling]);

  // clean up interval on unmount
  useEffect(() => stopPolling, [stopPolling]);

  const detectDuplicates = useCallback((fileObj) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const allRows = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          rows.forEach((row) => allRows.push({ ...row, _sheet: sheetName }));
        });

        const groups = {};
        allRows.forEach((row) => {
          const ruc = String(row.ruc || row.RUC || '').trim();
          const providerName = String(row.provider_name || row['Provider Name'] || row['Nombre Proveedor'] || '').trim();
          const unit = String(row.unit || row.Unit || row.Unidad || '').trim();
          const updateDate = String(row.update_date || row['Update Date'] || row.Fecha || '').trim();
          const key = `${ruc}||${providerName.toLowerCase()}||${unit}||${updateDate}`;

          if (!groups[key]) {
            groups[key] = { ruc, providerName, unit, updateDate, count: 0 };
          }
          groups[key].count += 1;
        });

        const dups = Object.values(groups).filter((g) => g.count > 1);
        setDuplicatesPreview(dups);
      } catch {
        // silently ignore parse errors in debug mode
      }
    };
    reader.readAsArrayBuffer(fileObj);
  }, []);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
      setFile(dropped);
      setResults(null);
      setDuplicatesPreview([]);
      detectDuplicates(dropped);
    } else {
      toast.error('Solo se aceptan archivos .xlsx');
    }
  }, [detectDuplicates]);

  const uploadMutation = useMutation({
    mutationFn: async (fileObj) => {
      setProcessing(true);
      setStatusData(null);
      const uploadResponse = await uploadService.uploadFile(fileObj);
      startPolling(uploadResponse.id);
      const processResponse = await uploadService.processFile(uploadResponse.id);
      return processResponse;
    },
    onSuccess: (data) => {
      stopPolling();
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['critical-suppliers'] });

      setResults({
        totalSheets: data.totalSheets || 0,
        totalRecords: data.totalRecords || 0,
      });

      setProcessing(false);
      toast.success('Archivo procesado exitosamente');
    },
    onError: (error) => {
      stopPolling();
      setProcessing(false);
      toast.error(error.message || 'Error al procesar el archivo');
    },
  });

  const handleProcess = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const processingMessage = () => {
    if (!statusData) return 'Subiendo y preparando archivo...';
    if (statusData.status === 'processing') return 'Registrando proveedores en la base de datos...';
    if (statusData.status === 'processed') return 'Finalizando...';
    return 'Procesando proveedores...';
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes progress-slide {
          0%   { left: -45%; }
          100% { left: 100%; }
        }
      `}</style>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cargar Archivo</h1>
        <p className="text-sm text-muted-foreground mt-1">Sube el archivo .xlsx exportado de la plataforma ESG</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileDrop}
              className="hidden"
            />
            {file ? (
              <div className="space-y-3">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-accent" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-3">
                <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground">Solo archivos .xlsx con las 8 hojas de unidades</p>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleProcess}
                disabled={processing}
                size="lg"
                className="min-w-48"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Procesar Archivo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {duplicatesPreview.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-yellow-400">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-yellow-700">
              <Bug className="w-5 h-5" />
              Debug — Posibles duplicados
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Se detectaron <span className="font-bold text-yellow-700">{duplicatesPreview.length}</span> posibles duplicados según la lógica del sistema
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">RUC</th>
                    <th className="text-left py-2 pr-4 font-medium">Provider Name</th>
                    <th className="text-left py-2 pr-4 font-medium">Unit</th>
                    <th className="text-left py-2 pr-4 font-medium">Fecha</th>
                    <th className="text-right py-2 font-medium">Repeticiones</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicatesPreview.map((dup, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-mono">{dup.ruc || '—'}</td>
                      <td className="py-2 pr-4 max-w-48 truncate">{dup.providerName || '—'}</td>
                      <td className="py-2 pr-4">{dup.unit || '—'}</td>
                      <td className="py-2 pr-4">{dup.updateDate || '—'}</td>
                      <td className="py-2 text-right font-bold text-yellow-700">{dup.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="border-0 shadow-sm border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Resumen del Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.totalSheets}</p>
                <p className="text-xs text-muted-foreground mt-1">Hojas procesadas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.totalRecords}</p>
                <p className="text-xs text-muted-foreground mt-1">Proveedores registrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {processing && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">Procesando proveedores...</p>
                {statusData?.total_records > 0 && (
                  <p className="text-sm font-bold tabular-nums">
                    {statusData.total_records} registros
                  </p>
                )}
              </div>

              {/* Indeterminate progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-primary rounded-full absolute"
                  style={{
                    width: '45%',
                    animation: 'progress-slide 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-2">{processingMessage()}</p>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Esto puede tardar unos segundos dependiendo del tamaño del archivo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
