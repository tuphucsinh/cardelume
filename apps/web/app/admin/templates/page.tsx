import type { Metadata } from "next";
import { TemplateAdmin } from "./template-admin";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Template Library · CardeLume Admin",robots:{index:false,follow:false}};
export default function Page(){return <TemplateAdmin/>;}
