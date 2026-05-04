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
        totalRecordsOriginal: data.totalRecordsOriginal || 0,
        uniqueRecords: data.uniqueRecords || 0,
        insertedProviders: data.insertedProviders || 0,
        skippedDuplicates: data.skippedDuplicates || 0,
        alreadyExisting: data.alreadyExisting || 0,
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

      {results && (
        <Card className="border-0 shadow-sm border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Resumen del Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.totalSheets}</p>
                <p className="text-xs text-muted-foreground mt-1">Hojas procesadas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.totalRecordsOriginal}</p>
                <p className="text-xs text-muted-foreground mt-1">Registros leídos</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.uniqueRecords}</p>
                <p className="text-xs text-muted-foreground mt-1">Registros únicos</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-accent">{results.insertedProviders}</p>
                <p className="text-xs text-muted-foreground mt-1">Proveedores nuevos registrados</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.skippedDuplicates}</p>
                <p className="text-xs text-muted-foreground mt-1">Registros omitidos por duplicado</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{results.alreadyExisting}</p>
                <p className="text-xs text-muted-foreground mt-1">Proveedores que ya existían</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Nota: los registros omitidos corresponden a duplicados dentro del archivo o proveedores que ya existían previamente en la base de datos.
            </p>
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
