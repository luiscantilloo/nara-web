import type { Metadata } from "next";

/** App paciente: privada, no indexar. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function PacienteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
