import Link from "next/link";
import { ValueForm } from "@/components/ValueForm";
export const metadata={title:"Add Value Monitor"};
export default function NewValueMonitor(){return <><div className="crumb"><Link href="/">Dashboard</Link><span>/</span><span>Add Value Monitor</span></div><section className="pageHead compact"><div><p className="eyebrow">New monitor</p><h1>Watch a webpage value</h1><p>Track an interest rate, percentage, temperature, exchange rate, or any other number.</p></div></section><ValueForm/></>}
