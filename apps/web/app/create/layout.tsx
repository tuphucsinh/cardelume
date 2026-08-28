import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your card",
  robots: { index: false, follow: false },
  alternates: { canonical: "/create" }
};

export default function CreateLayout({ children }: {children: React.ReactNode}) {
  return children;
}
