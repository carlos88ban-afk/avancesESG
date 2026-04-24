import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload as UploadIcon, FileSpreadsheet, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { uploadService } from '@/api/services';

export default function Upload() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [statusData, setStatusData] = useState(null);
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

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
      setFile(dropped);
      setResults(null);
    } else {
      toast.error('Solo se aceptan archivos .xlsx');
    }
  }, []);

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
        newCompletions: data.newCompletions || 0,
        matchedSuppliers: data.matchedSuppliers || 0,
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
    if (statusData.status === 'processing') return 'Realizando matching con proveedores críticos...';
    if (statusData.status === 'processed') return 'Finalizando...';
    return 'Procesando...';
  };

  return (
    <div className="space-y-6">
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

      {results && (
        <Card className="border-0 shadow-sm border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Resumen del Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.totalSheets}</p>
                <p className="text-xs text-muted-foreground mt-1">Hojas procesadas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.totalRecords}</p>
                <p className="text-xs text-muted-foreground mt-1">Registros extraídos</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.matchedSuppliers}</p>
                <p className="text-xs text-muted-foreground mt-1">Proveedores matched</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <p className="text-2xl font-bold text-accent">{results.newCompletions}</p>
                <p className="text-xs text-muted-foreground mt-1">Nuevos completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {processing && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
            <div>
              <p className="font-medium">Procesando archivo...</p>
              <p className="text-sm text-muted-foreground mt-1">{processingMessage()}</p>
            </div>
            {statusData?.total_records > 0 && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-bold text-base">{statusData.total_records}</p>
                  <p className="text-xs text-muted-foreground">Registros extraídos</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-bold text-base">{statusData.matched_suppliers ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Proveedores matched</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
