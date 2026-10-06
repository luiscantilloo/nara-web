"use client";

import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  /** Solo para que el padre cierre desde Cancelar / Guardar; el modal no cierra solo. */
  onClose?: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** sm | md | lg */
  size?: "sm" | "md" | "lg";
};

/** max-width solo desde sm: en móvil siempre a ancho completo. */
const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
};

const DURATION_MS = 220;

/**
 * Modal de formulario compartido.
 * Solo se cierra con el botón Cancelar (o guardar) del footer; sin X ni clic afuera.
 * En móvil: bottom sheet a ancho completo, footer en columna, botones a 100%.
 */
export function FormModal({
  open,
  title,
  description,
  children,
  footer,
  size = "md",
}: Props) {
  const titleId = useId();
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setShown(true));
      });
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.cancelAnimationFrame(id);
        document.body.style.overflow = prev;
      };
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), DURATION_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!portalReady || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <div
        className={`absolute inset-0 bg-[rgba(22,20,19,.42)] transition-opacity duration-200 ease-out ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-[1] flex w-full ${SIZE[size]} max-h-[min(94dvh,920px)] flex-col overflow-hidden rounded-t-[20px] border border-b-0 border-linea bg-nara-blanco shadow-[0_24px_60px_rgba(22,20,19,.22)] transition-[opacity,transform] duration-200 ease-out sm:max-h-[min(90vh,880px)] sm:rounded-[20px] sm:border-b ${
          shown
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-2 sm:scale-[0.98]"
        }`}
      >
        <header className="shrink-0 border-b border-linea px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-linea sm:hidden" aria-hidden />
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              id={titleId}
              className="font-titulos text-[20px] font-semibold leading-tight text-nara-tinta sm:text-[22px]"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-sm leading-snug text-texto-secundario">{description}</p>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 [&_input]:box-border [&_input]:w-full [&_select]:box-border [&_select]:w-full [&_textarea]:box-border [&_textarea]:w-full">
          {children}
        </div>

        {footer ? (
          <footer
            className={[
              "flex shrink-0 flex-col gap-2 border-t border-linea bg-nara-crema/60 px-4 pt-3",
              "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
              "sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-6 sm:py-3.5 sm:pb-3.5",
              /* Botones a ancho completo en móvil */
              "[&>button]:box-border [&>button]:w-full [&>button]:shrink-0 [&>button]:whitespace-normal [&>button]:text-center",
              "sm:[&>button]:w-auto sm:[&>button]:whitespace-nowrap",
              /* Mensajes de error arriba del bloque de acciones en móvil */
              "[&>span]:order-first [&>span]:w-full [&>span]:text-sm",
              "sm:[&>span]:order-none sm:[&>span]:w-auto",
            ].join(" ")}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
