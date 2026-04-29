import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Database,
  Download,
  FileText,
  GitBranch,
  Info,
  Layers3,
  Search,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { technicalDocs, userGuide, workflowDocs, maintenanceChecklist } from '@/content/docsData';

const docSets = {
  technical: technicalDocs,
  user: userGuide,
};

const sectionIcons = {
  'vision-general': Layers3,
  arquitectura: GitBranch,
  infraestructura: ShieldCheck,
  'modelo-datos': Database,
  'flujo-datos': Workflow,
};

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function includesSearch(section, search) {
  if (!search) return true;
  return normalize(JSON.stringify(section)).includes(normalize(search));
}

function getSectionIcon(id) {
  return sectionIcons[id] || FileText;
}

function flattenPdfSections(doc) {
  return doc.sections.map((section) => {
    const lines = [];
    if (section.description) lines.push(section.description);
    if (section.objective) lines.push(`Objetivo: ${section.objective}`);
    if (section.expected) lines.push(`Resultado esperado: ${section.expected}`);
    if (section.items) {
      section.items.forEach((item) => {
        if (typeof item === 'string') lines.push(item);
        else lines.push(`${item.title}: ${item.body}`);
      });
    }
    if (section.steps) lines.push(`Pasos: ${section.steps.join(' -> ')}`);
    if (section.recommendations) lines.push(`Recomendaciones: ${section.recommendations.join('; ')}`);
    if (section.validations) lines.push(`Validaciones: ${section.validations.join('; ')}`);
    if (section.notes) lines.push(`Notas: ${section.notes.join('; ')}`);
    if (section.entities) section.entities.forEach(([name, body]) => lines.push(`${name}: ${body}`));
    if (section.relations) lines.push(`Relaciones: ${section.relations.join('; ')}`);
    if (section.rows) section.rows.forEach((row) => lines.push(row.join(' | ')));
    if (section.mermaid) lines.push(`Diagrama:\n${section.mermaid}`);
    return { title: section.title, lines };
  });
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 5) {
  const split = doc.splitTextToSize(String(text || ''), maxWidth);
  split.forEach((line) => {
    if (y > 274) {
      doc.addPage();
      y = 24;
    }
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function addPdfHeaderFooter(doc, title) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(16, 286, 194, 286);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ESG Monitor - Documentacion ejecutiva', 16, 292);
    doc.text(`${title} | Pagina ${i} de ${pageCount}`, 194, 292, { align: 'right' });
  }
}

function buildPdfDocument(type) {
  const docs =
    type === 'complete'
      ? [technicalDocs, userGuide]
      : [type === 'technical' ? technicalDocs : userGuide];
  const title =
    type === 'complete'
      ? 'Documentacion Tecnica y Guia de Usuario'
      : docs[0].title;
  const generatedAt = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('ESG Monitor', 18, 28);
  doc.setFontSize(15);
  doc.text(title, 18, 41);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Fecha de generacion: ${generatedAt}`, 18, 55);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Resumen ejecutivo', 18, 90);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = 100;
  docs.forEach((set) => {
    y = addWrappedText(doc, `${set.title}: ${set.summary}`, 18, y, 174, 5.2) + 3;
  });
  y = addWrappedText(
    doc,
    'Infraestructura real documentada: GitHub como repositorio, frontend en Vercel Free, backend en Render Free y base de datos Supabase Free, con limitantes propias de planes gratuitos.',
    18,
    y + 3,
    174,
    5.2
  );

  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Indice', 18, 24);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y = 36;
  docs.forEach((set) => {
    doc.setFont('helvetica', 'bold');
    doc.text(set.title, 18, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    set.sections.forEach((section, index) => {
      if (y > 275) {
        doc.addPage();
        y = 24;
      }
      doc.text(`${index + 1}. ${section.title}`, 24, y);
      y += 5.8;
    });
    y += 5;
  });

  docs.forEach((set) => {
    doc.addPage();
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text(set.title, 18, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = 34;
    y = addWrappedText(doc, set.summary, 18, y, 174, 5.2) + 5;

    flattenPdfSections(set).forEach((section) => {
      if (y > 252) {
        doc.addPage();
        y = 24;
      }
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(section.title, 18, y);
      y += 7;
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      section.lines.forEach((line) => {
        y = addWrappedText(doc, line, 22, y, 168, 4.8) + 2;
      });
      y += 4;
    });
  });

  doc.addPage();
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Anexos tecnicos y mantenimiento', 18, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  y = 36;
  maintenanceChecklist.forEach((item) => {
    y = addWrappedText(doc, `- ${item}`, 22, y, 168, 5) + 1;
  });
  y += 4;
  workflowDocs.forEach((flow) => {
    doc.setFont('helvetica', 'bold');
    doc.text(flow.title, 18, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(doc, flow.steps.join(' -> '), 22, y, 168, 5) + 4;
  });

  addPdfHeaderFooter(doc, title);
  doc.save(`esg_monitor_${type}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function InfoGrid({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title} className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {item.body}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CleanTable({ columns, rows }) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/70 text-left">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold text-foreground">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="border-t">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className="px-4 py-3 align-top text-muted-foreground first:font-medium first:text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ProcessFlow({ steps }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {steps.map((step, index) => (
        <div key={step} className="relative rounded-lg border bg-card p-4 shadow-sm">
          <Badge variant="secondary" className="mb-3">
            Paso {index + 1}
          </Badge>
          <p className="text-sm font-medium leading-5">{step}</p>
          {index < steps.length - 1 && (
            <ChevronRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-background text-muted-foreground xl:block" />
          )}
        </div>
      ))}
    </div>
  );
}

function CodeDiagram({ value }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-slate-950 p-4 text-xs leading-5 text-slate-100">
      <code>{value}</code>
    </pre>
  );
}

function HighlightList({ items, icon: Icon = Info, tone = 'info' }) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-blue-200 bg-blue-50 text-blue-950';
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-6">
            <Icon className="mt-1 h-4 w-4 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataModelSection({ section }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">{section.description}</p>
      <CleanTable columns={['Entidad', 'Rol en el negocio']} rows={section.entities} />
      <HighlightList items={section.relations} icon={Database} />
      <CodeDiagram value={section.mermaid} />
    </div>
  );
}

function TechnicalSection({ section }) {
  if (section.type === 'cards') {
    return (
      <div className="space-y-4">
        <InfoGrid items={section.items} />
        {section.notes && <HighlightList items={section.notes} />}
      </div>
    );
  }

  if (section.type === 'table') {
    return <CleanTable columns={section.columns} rows={section.rows} />;
  }

  if (section.type === 'flow') {
    return (
      <div className="space-y-4">
        {section.description && <p className="text-sm leading-6 text-muted-foreground">{section.description}</p>}
        <ProcessFlow steps={section.steps} />
        {section.mermaid && <CodeDiagram value={section.mermaid} />}
      </div>
    );
  }

  if (section.type === 'dataModel') {
    return <DataModelSection section={section} />;
  }

  return <HighlightList items={section.items} icon={section.id === 'limitantes' ? AlertTriangle : Info} tone={section.id === 'limitantes' ? 'warning' : 'info'} />;
}

function UserGuideSection({ section }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Paso a paso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Objetivo</p>
            <p className="mt-1 text-sm leading-6">{section.objective}</p>
          </div>
          <ProcessFlow steps={section.steps} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultado esperado</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.expected}</p>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recomendaciones de uso</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              {section.recommendations.map((item) => (
                <li key={item} className="flex gap-2">
                  <Info className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Errores comunes o validaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              {section.validations.map((item) => (
                <li key={item} className="flex gap-2">
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionRenderer({ section, mode }) {
  const Icon = getSectionIcon(section.id);
  return (
    <section id={section.id} className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
          {section.description && mode === 'user' && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
        </div>
      </div>
      {mode === 'technical' ? <TechnicalSection section={section} /> : <UserGuideSection section={section} />}
    </section>
  );
}

function DocumentView({ doc, mode, search }) {
  const sections = doc.sections.filter((section) => includesSearch(section, search));

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Indice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {section.title}
              </a>
            ))}
          </CardContent>
        </Card>
      </aside>
      <div className="space-y-8">
        <Card className="border-0 bg-slate-900 text-white shadow-sm">
          <CardContent className="p-6">
            <Badge className="mb-4 bg-white/10 text-white hover:bg-white/10">
              Documento vivo
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">{doc.summary}</p>
          </CardContent>
        </Card>

        {sections.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No se encontraron secciones para la busqueda indicada.
            </CardContent>
          </Card>
        ) : (
          sections.map((section) => <SectionRenderer key={section.id} section={section} mode={mode} />)
        )}
      </div>
    </div>
  );
}

export default function Documentation() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('technical');

  const stats = useMemo(
    () => [
      ['Modulos documentados', '6'],
      ['Endpoints backend', '11'],
      ['Tablas principales', '5'],
      ['Infraestructura', 'GitHub + Vercel + Render + Supabase'],
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Documentacion</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Documentacion tecnica, guia de usuario, flujos y PDFs ejecutivos de la plataforma.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="gap-2" onClick={() => buildPdfDocument('technical')}>
            <Download className="h-4 w-4" />
            PDF tecnico
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => buildPdfDocument('user')}>
            <Download className="h-4 w-4" />
            PDF guia
          </Button>
          <Button className="gap-2" onClick={() => buildPdfDocument('complete')}>
            <Download className="h-4 w-4" />
            PDF completo
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-2 text-lg font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar en la documentacion..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Render Free: cold start posible</Badge>
            <Badge variant="outline">Vercel Free</Badge>
            <Badge variant="outline">Supabase Free</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[420px]">
          <TabsTrigger value="technical">Documentacion Tecnica</TabsTrigger>
          <TabsTrigger value="user">Guia de Usuario</TabsTrigger>
        </TabsList>
        <TabsContent value="technical">
          <DocumentView doc={docSets.technical} mode="technical" search={search} />
        </TabsContent>
        <TabsContent value="user">
          <DocumentView doc={docSets.user} mode="user" search={search} />
        </TabsContent>
      </Tabs>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Flujos de trabajo</h2>
            <p className="text-sm text-muted-foreground">Procesos operativos principales documentados como pasos visuales.</p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {workflowDocs.map((flow) => (
            <Card key={flow.title} className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{flow.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProcessFlow steps={flow.steps} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Guia de mantenimiento</h2>
            <p className="text-sm text-muted-foreground">Checklist para mantener sincronizados codigo, datos, infraestructura y documentacion.</p>
          </div>
        </div>
        <HighlightList items={maintenanceChecklist} icon={ShieldCheck} />
      </section>
    </div>
  );
}
