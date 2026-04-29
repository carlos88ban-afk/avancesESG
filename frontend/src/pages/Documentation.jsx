// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  FileText,
  GitBranch,
  Globe,
  Info,
  Layers3,
  Lightbulb,
  Search,
  ShieldCheck,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  technicalDocs,
  userGuide,
  workflowDocs,
  maintenanceChecklist,
  generatedDocumentationDate,
} from '@/content/docsData';

// ── Data ──────────────────────────────────────────────────────────────────────

const docSets = { technical: technicalDocs, user: userGuide };

const SECTION_ICONS = {
  'vision-general': Layers3,
  arquitectura: GitBranch,
  infraestructura: ShieldCheck,
  'modelo-datos': Database,
  'flujo-datos': Workflow,
  'inicio-sesion': Globe,
  navegacion: FileText,
  dashboard: Info,
  proveedores: Users,
  carga: Target,
  avances: CheckCircle2,
  excel: Download,
  correos: BookOpen,
  evaluaciones: ShieldCheck,
  documentacion: BookOpen,
};

function getSectionIcon(id) {
  return SECTION_ICONS[id] ?? FileText;
}

function normalize(v) {
  return String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function includesSearch(section, search) {
  return !search || normalize(JSON.stringify(section)).includes(normalize(search));
}

// ── PDF (lógica sin cambios) ──────────────────────────────────────────────────

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
  const split = doc.splitTextToSize(String(text ?? ''), maxWidth);
  split.forEach((line) => {
    if (y > 274) { doc.addPage(); y = 24; }
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
    type === 'complete' ? 'Documentacion Tecnica y Guia de Usuario' : docs[0].title;
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
    18, y + 3, 174, 5.2,
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
      if (y > 275) { doc.addPage(); y = 24; }
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
      if (y > 252) { doc.addPage(); y = 24; }
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(section.title, 18, y);
      y += 7;
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      section.lines.forEach((line) => { y = addWrappedText(doc, line, 22, y, 168, 4.8) + 2; });
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
  maintenanceChecklist.forEach((item) => { y = addWrappedText(doc, `- ${item}`, 22, y, 168, 5) + 1; });
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

// ── Vista Ejecutiva — componentes ─────────────────────────────────────────────

function TechInfoCard({ title, body }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-blue-600" />
      <p className="pl-3 text-sm font-semibold text-slate-900 mb-1.5">{title}</p>
      <p className="pl-3 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function TechTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-white">
              {columns.map((col) => (
                <th key={col} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-5 py-3 align-top text-sm ${
                      ci === 0 ? 'font-semibold text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TechFlow({ steps }) {
  return (
    <ol className="flex flex-col gap-2 md:flex-row md:gap-1">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <li className="flex-1 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <p className="text-xs leading-5 text-slate-700">{step}</p>
          </li>
          {index < steps.length - 1 && (
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 rotate-90 text-blue-300 md:rotate-0" />
            </div>
          )}
        </React.Fragment>
      ))}
    </ol>
  );
}

function TechCodeBlock({ value }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-100">
      <code>{value}</code>
    </pre>
  );
}

function TechCallout({ items, icon: Icon = Info, variant = 'info' }) {
  const cls =
    variant === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-blue-100 bg-blue-50 text-blue-900';
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item} className="flex gap-2.5 text-sm leading-6">
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechDataModel({ section }) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-slate-500">{section.description}</p>
      <TechTable columns={['Entidad', 'Rol en el negocio']} rows={section.entities} />
      <TechCallout items={section.relations} icon={Database} />
      <TechCodeBlock value={section.mermaid} />
    </div>
  );
}

function TechSectionBody({ section }) {
  if (section.type === 'cards') {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {section.items.map((item) => (
            <TechInfoCard key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
        {section.notes && <TechCallout items={section.notes} />}
      </div>
    );
  }
  if (section.type === 'table') {
    return <TechTable columns={section.columns} rows={section.rows} />;
  }
  if (section.type === 'flow') {
    return (
      <div className="space-y-5">
        {section.description && (
          <p className="text-sm leading-6 text-slate-500">{section.description}</p>
        )}
        <TechFlow steps={section.steps} />
        {section.mermaid && <TechCodeBlock value={section.mermaid} />}
      </div>
    );
  }
  if (section.type === 'dataModel') {
    return <TechDataModel section={section} />;
  }
  return (
    <TechCallout
      items={section.items}
      icon={section.id === 'limitantes' ? AlertTriangle : Info}
      variant={section.id === 'limitantes' ? 'warning' : 'info'}
    />
  );
}

// ── Guía de Usuario — componentes ─────────────────────────────────────────────

function UGCallout({ variant, label, children }) {
  const config = {
    objective: {
      border: 'border-blue-200', bg: 'bg-blue-50',
      Icon: Target, ic: 'text-blue-600', lc: 'text-blue-700',
    },
    success: {
      border: 'border-emerald-200', bg: 'bg-emerald-50',
      Icon: CheckCircle2, ic: 'text-emerald-600', lc: 'text-emerald-700',
    },
    tip: {
      border: 'border-cyan-200', bg: 'bg-cyan-50',
      Icon: Lightbulb, ic: 'text-cyan-600', lc: 'text-cyan-700',
    },
    warning: {
      border: 'border-amber-200', bg: 'bg-amber-50',
      Icon: AlertTriangle, ic: 'text-amber-600', lc: 'text-amber-700',
    },
  };
  const { border, bg, Icon, ic, lc } = config[variant];
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4`}>
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ic}`} />
        <div className="flex-1">
          {label && (
            <p className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${lc}`}>{label}</p>
          )}
          <div className="text-sm leading-6 text-slate-700">{children}</div>
        </div>
      </div>
    </div>
  );
}

function UGSteps({ steps }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step} className="flex items-start gap-3">
          <div className="flex shrink-0 flex-col items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
              {index + 1}
            </span>
            {index < steps.length - 1 && (
              <div className="mt-1 h-4 w-px bg-blue-100" />
            )}
          </div>
          <div className="mt-0.5 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
            {step}
          </div>
        </div>
      ))}
    </div>
  );
}

function UGSectionBody({ section }) {
  return (
    <div className="space-y-5">
      <UGCallout variant="objective" label="Objetivo">
        {section.objective}
      </UGCallout>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Pasos
        </p>
        <UGSteps steps={section.steps} />
      </div>

      <UGCallout variant="success" label="Resultado esperado">
        {section.expected}
      </UGCallout>

      {section.recommendations?.length > 0 && (
        <UGCallout variant="tip" label="Recomendaciones">
          <ul className="space-y-1.5">
            {section.recommendations.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </UGCallout>
      )}

      {section.validations?.length > 0 && (
        <UGCallout variant="warning" label="Validaciones y errores comunes">
          <ul className="space-y-1.5">
            {section.validations.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </UGCallout>
      )}
    </div>
  );
}

// ── Banners de documento ──────────────────────────────────────────────────────

function TechDocBanner({ doc }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-slate-900 px-8 py-7 text-white">
        <Badge className="mb-3 border-white/20 bg-white/10 text-[10px] uppercase tracking-wider text-white hover:bg-white/10">
          Documento vivo · {generatedDocumentationDate}
        </Badge>
        <h1 className="text-xl font-bold tracking-tight">{doc.title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-300">{doc.subtitle}</p>
      </div>
      <div className="bg-slate-800/90 px-8 py-4">
        <p className="text-xs leading-6 text-slate-400">{doc.summary}</p>
      </div>
    </div>
  );
}

function UserDocBanner({ doc }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 shadow-sm">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-7 text-white">
        <Badge className="mb-3 border-white/30 bg-white/20 text-[10px] uppercase tracking-wider text-white hover:bg-white/20">
          Guía de usuario · ESG Monitor
        </Badge>
        <h1 className="text-xl font-bold tracking-tight">{doc.title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-blue-100">{doc.subtitle}</p>
      </div>
      <div className="border-t border-blue-100 bg-blue-50 px-8 py-4">
        <p className="text-xs leading-6 text-blue-700">{doc.summary}</p>
      </div>
    </div>
  );
}

// ── Bloque de sección ─────────────────────────────────────────────────────────

function SectionBlock({ section, index, mode }) {
  const Icon = getSectionIcon(section.id);
  const isTech = mode === 'technical';
  return (
    <section id={section.id} className="scroll-mt-24">
      <div className="mb-5 flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${
            isTech ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isTech ? `Sección ${String(index + 1).padStart(2, '0')}` : `Módulo ${index + 1}`}
          </p>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{section.title}</h2>
        </div>
      </div>
      {isTech ? <TechSectionBody section={section} /> : <UGSectionBody section={section} />}
    </section>
  );
}

// ── Vista de documento con sidebar ────────────────────────────────────────────

function DocumentView({ doc, mode, search }) {
  const sections = doc.sections.filter((s) => includesSearch(s, search));
  const isTech = mode === 'technical';

  return (
    <div className="grid gap-6 lg:grid-cols-[272px_1fr]">
      {/* Sidebar de navegación */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div
          className={`overflow-hidden rounded-xl border shadow-sm ${
            isTech ? 'border-slate-200' : 'border-blue-100'
          }`}
        >
          <div className={`px-4 py-3 ${isTech ? 'bg-slate-900' : 'bg-blue-600'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white">
              {isTech ? 'Índice de secciones' : 'Módulos de la guía'}
            </p>
          </div>
          <nav className="divide-y divide-slate-100 bg-white">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-center gap-3 px-4 py-2.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold transition-colors ${
                    isTech
                      ? 'bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-white'
                      : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="truncate">{s.title}</span>
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="min-w-0 space-y-10">
        {isTech ? <TechDocBanner doc={doc} /> : <UserDocBanner doc={doc} />}

        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
            <Search className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">Sin resultados para esta búsqueda.</p>
          </div>
        ) : (
          sections.map((s, i) => (
            <SectionBlock key={s.id} section={s} index={i} mode={mode} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Flujos de trabajo ─────────────────────────────────────────────────────────

function WorkflowCard({ flow }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-900 px-5 py-3">
        <p className="text-sm font-semibold text-white">{flow.title}</p>
      </div>
      <div className="flex flex-wrap items-start gap-1 p-5">
        {flow.steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex min-w-[80px] max-w-[110px] flex-col items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {index + 1}
              </span>
              <p className="text-center text-[11px] leading-4 text-slate-600">{step}</p>
            </div>
            {index < flow.steps.length - 1 && (
              <div className="mt-4 flex items-center">
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── Checklist de mantenimiento ────────────────────────────────────────────────

function MaintenanceList({ items }) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 shadow-sm">
      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-500 px-5 py-3">
        <ShieldCheck className="h-4 w-4 text-white" />
        <p className="text-sm font-semibold text-white">Checklist de mantenimiento</p>
      </div>
      <div className="divide-y divide-amber-50 bg-white">
        {items.map((item, i) => (
          <div
            key={item}
            className="flex gap-3 px-5 py-3 transition-colors hover:bg-amber-50/50"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-amber-300 text-[9px] font-bold text-amber-600">
              {i + 1}
            </span>
            <p className="text-sm leading-6 text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Documentation() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('technical');

  const stats = useMemo(
    () => [
      { label: 'Módulos documentados', value: '6', Icon: Layers3, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Endpoints backend', value: '11', Icon: GitBranch, color: 'text-violet-600', bg: 'bg-violet-50' },
      { label: 'Tablas principales', value: '5', Icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Infraestructura', value: 'Vercel + Render + Supabase', Icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Encabezado de página */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Documentación</h1>
            <p className="text-sm text-slate-500">
              Vista ejecutiva, guía de usuario, flujos y exportaciones PDF.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="gap-2 border-slate-200"
            onClick={() => buildPdfDocument('technical')}
          >
            <Download className="h-4 w-4" />
            PDF Técnico
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-slate-200"
            onClick={() => buildPdfDocument('user')}
          >
            <Download className="h-4 w-4" />
            PDF Guía
          </Button>
          <Button
            className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => buildPdfDocument('complete')}
          >
            <Download className="h-4 w-4" />
            PDF Completo
          </Button>
        </div>
      </div>

      {/* Métricas del sistema */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div
              className={`mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Barra de búsqueda e indicadores */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en la documentación..."
            className="border-slate-200 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
          >
            Render Free — cold start posible
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-[10px] text-slate-500"
          >
            Vercel Free
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
          >
            Supabase Free
          </Badge>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-0 rounded-xl bg-slate-100 p-1 lg:w-[480px]">
          <TabsTrigger
            value="technical"
            className="rounded-lg py-2.5 text-sm font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Vista Ejecutiva
          </TabsTrigger>
          <TabsTrigger
            value="user"
            className="rounded-lg py-2.5 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Guía de Usuario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="technical">
          <DocumentView doc={docSets.technical} mode="technical" search={search} />
        </TabsContent>
        <TabsContent value="user">
          <DocumentView doc={docSets.user} mode="user" search={search} />
        </TabsContent>
      </Tabs>

      {/* Flujos de trabajo */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Flujos de trabajo</h2>
            <p className="text-sm text-slate-500">
              Procesos operativos principales documentados como pasos visuales.
            </p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {workflowDocs.map((flow) => (
            <WorkflowCard key={flow.title} flow={flow} />
          ))}
        </div>
      </section>

      {/* Mantenimiento */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Guía de mantenimiento
            </h2>
            <p className="text-sm text-slate-500">
              Checklist para mantener sincronizados código, datos, infraestructura y documentación.
            </p>
          </div>
        </div>
        <MaintenanceList items={maintenanceChecklist} />
      </section>
    </div>
  );
}
