import Link from "next/link";
import { UptimeForm } from "@/components/UptimeForm";

export const metadata = { title: "Add Uptime Monitor" };
export default function NewUptimeMonitor() {
  return <><div className="crumb"><Link href="/">Dashboard</Link><span>/</span><span>Add Uptime Monitor</span></div><section className="pageHead compact"><div><p className="eyebrow">New monitor</p><h1>Monitor uptime</h1><p>Track reachability and response time for a website or server.</p></div></section><UptimeForm /></>;
}
