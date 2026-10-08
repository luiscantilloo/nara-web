import Link from "next/link";
import { landingAssets } from "./assets";

export function LandingHeader({
  logoSrc = landingAssets.logo,
  sticky = false,
}: {
  logoSrc?: string;
  sticky?: boolean;
}) {
  return (
    <header
      className={`${sticky ? "sticky" : "fixed"} inset-x-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-linea bg-nara-crema/95 px-[clamp(16px,4vw,48px)] py-2.5 backdrop-blur-md`}
    >
      <Link href="/landing" aria-label="NARA, ir al inicio" className="flex py-1">
        <img src={logoSrc} alt="NARA" className="h-[34px] w-auto min-w-[120px]" />
      </Link>
      <Link
        href="/ingreso"
        className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-nara-amarillo px-6 font-texto text-lg font-semibold text-nara-tinta hover:bg-[#F2C010]"
      >
        Ingresar
      </Link>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-linea bg-nara-crema px-[clamp(16px,6vw,96px)] py-7 snap-end">
      <p className="font-texto text-base leading-snug text-texto-secundario">
        Programa de acompañamiento post-sismo del Eje Cafetero
      </p>
      <nav aria-label="Enlaces legales" className="flex flex-wrap gap-x-6 gap-y-2">
        <Link
          href="/landing/privacidad"
          className="inline-flex min-h-11 items-center font-texto text-base font-medium text-nara-tinta"
        >
          Política de privacidad
        </Link>
        <Link
          href="/landing/tratamiento-de-datos"
          className="inline-flex min-h-11 items-center font-texto text-base font-medium text-nara-tinta"
        >
          Tratamiento de datos
        </Link>
      </nav>
    </footer>
  );
}

export function IngresarCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/ingreso"
      className={`inline-flex min-h-[52px] items-center justify-center rounded-[14px] bg-nara-amarillo px-[30px] font-texto text-[19px] font-semibold text-nara-tinta hover:bg-[#F2C010] ${className}`}
    >
      Ingresar
    </Link>
  );
}
