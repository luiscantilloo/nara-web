import { resolveHerramientaCard } from "./tools/registry";
import type { HerramientaItem } from "./types";

type Props = {
  items: HerramientaItem[];
  patientId: string;
};

/** Sección Herramientas de la ficha clínica (2 por fila). */
export function HerramientasSection({ items, patientId }: Props) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco px-5 py-[18px]">
      <span className="font-texto text-base font-medium text-nara-tinta">
        Herramientas
      </span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Card = resolveHerramientaCard(item.id);
          return <Card key={item.id} item={item} patientId={patientId} />;
        })}
      </div>
      {!items.length ? (
        <span className="text-sm text-texto-secundario">
          Sin servicios en la ruta de este paciente.
        </span>
      ) : null}
    </div>
  );
}
