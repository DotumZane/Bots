import Link from "next/link"; import { BotForm } from "@/components/BotForm";
export const metadata = { title: "Add Bot" };
export default function NewBot() { return <><div className="crumb"><Link href="/">Dashboard</Link><span>/</span><span>Add Bot</span></div><section className="pageHead compact"><div><p className="eyebrow">New monitor</p><h1>Add a product</h1><p>Paste a public product page. You can fine-tune detection if needed.</p></div></section><BotForm /></>; }
