import { ShellLayout } from "@/components/layouts/shell";

export default function ShellGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ShellLayout>{children}</ShellLayout>;
}
