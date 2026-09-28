import type { Caso, Prioridade, Origem } from "@/lib/supabase/types";

const PRIORITY_STYLES: Record<Prioridade, string> = {
  URGENTE: "bg-amber text-graphite",
  ALTA: "bg-amber text-graphite",
  NORMAL: "bg-grayLight text-graphite",
  BAIXA: "bg-grayLight text-graySecondary",
};

const TIPO_LABEL: Record<string, string> = { ALUNO: "Aluno", PROFESSOR: "Professor", OUTRO: "Outro" };

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function OrigemTag({ origem }: { origem: Origem }) {
  const isIA = origem === "IA";
  return (
    <Pill className={isIA ? "bg-mint text-petrol" : "bg-grayLight text-graySecondary"}>
      {isIA ? "Escalado pela IA" : "Criado manualmente"}
    </Pill>
  );
}

export function BigStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl p-5 bg-ice border border-grayLight min-w-[132px]">
      <span className="text-graySecondary text-sm">{label}</span>
      <span className="font-display font-bold text-4xl text-petrol leading-none">{value}</span>
    </div>
  );
}

export function SectionHeader({ title, count }: { title: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="font-medium text-graphite text-sm">{title}</h3>
      <span className="rounded-full px-2 py-0.5 text-xs bg-grayLight text-graySecondary">{count}</span>
    </div>
  );
}

export function CaseCard({ caso, right }: { caso: Caso; right?: React.ReactNode }) {
  return (
    <div className="w-full text-left rounded-2xl p-4 bg-white border border-grayLight">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-graphite text-[15px]">{caso.titulo}</p>
          <p className="mt-1 truncate text-graySecondary text-sm">
            {caso.solicitante_nome} · {caso.solicitante_tipo ? TIPO_LABEL[caso.solicitante_tipo] : "não informado"}
          </p>
        </div>
        {right}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill className={PRIORITY_STYLES[caso.prioridade]}>{caso.prioridade}</Pill>
        <OrigemTag origem={caso.origem} />
        {caso.modo_atribuicao === "DIRETA" && <Pill className="bg-mint text-petrol">Atribuído diretamente</Pill>}
      </div>
    </div>
  );
}
