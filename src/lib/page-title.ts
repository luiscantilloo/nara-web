import type { Metadata } from "next";

export function pageTitle(title: string): Metadata {
  return { title };
}
