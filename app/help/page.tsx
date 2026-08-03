import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Help" };

const monitorGuides = [
  { icon: "↘", title: "Product monitor", text: "Watch a product page for price and stock changes.", steps: ["Choose Add product on the Dashboard.", "Paste the public product URL and select Analyze page.", "Review the detected item, choose alert rules, and save."] },
  { icon: "●", title: "Website or server", text: "Track reachability, uptime, and response time.", steps: ["Choose Add website/server on the Dashboard.", "Enter a domain, URL, or IP address and select HTTP or TCP.", "Set the check interval and slow-response threshold, then save."] },
  { icon: "#", title: "Webpage value", text: "Watch an interest rate, percentage, temperature, or other number.", steps: ["Choose Add webpage value on the Dashboard.", "Paste the page URL and select Find values.", "Pick the correct detected value, configure limits, and save."] },
];

export default function HelpPage() {
  return <>
    <section className="pageHead compact"><div><p className="eyebrow">Documentation</p><h1>Help</h1><p>Quick instructions for setting up and maintaining your Bots monitors.</p></div></section>

    <section className="helpGrid" aria-label="Monitor setup guides">
      {monitorGuides.map((guide) => <article className="helpCard" key={guide.title}><span className="helpIcon">{guide.icon}</span><div><h2>{guide.title}</h2><p>{guide.text}</p></div><ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol></article>)}
    </section>

    <section className="helpColumns">
      <article className="formCard helpSection"><h2>Notifications</h2><p className="help">Connect email, Discord, Slack, or another supported channel before enabling alerts.</p><ol><li>Open <Link href="/settings/notifications">Notifications</Link> and add a channel.</li><li>Save it, then use <b>Test</b> to confirm delivery.</li><li>Edit a monitor to choose which channels receive its alerts.</li></ol><p className="helpNote">For Gmail, use <b>smtp.gmail.com</b>, port <b>465</b>, your full Gmail address, and a Google App Password.</p></article>
      <article className="formCard helpSection"><h2>Managing monitors</h2><ul><li><b>↻ Check now</b> runs a check immediately.</li><li><b>Ⅱ Pause</b> stops scheduled checks without deleting history.</li><li><b>✎ Edit</b> opens settings, history, charts, and recent events.</li><li><b>× Delete</b> permanently removes the monitor.</li></ul><p><Link className="button tiny" href="/">Open Dashboard</Link> <Link className="button tiny" href="/status">View Status</Link></p></article>
    </section>

    <section className="formCard helpSection troubleshooting"><h2>Common problems</h2><details><summary>A page returns HTTP 403</summary><p>Some websites block automated requests. Bots will retry supported pages using its built-in browser, but sites with CAPTCHA or login requirements may still be unavailable.</p></details><details><summary>Find values does not show the number I need</summary><p>Confirm the value is visible without signing in. Try the page containing the actual value rather than a search or landing page.</p></details><details><summary>A notification test does not arrive</summary><p>Check the recipient address and spam folder. For Gmail, use an App Password rather than your normal account password.</p></details><details><summary>A monitor shows an error after an update</summary><p>In Unraid, choose <b>Docker → Bots → Force Update</b>, then review the container log. Your database remains in the mapped <b>/data</b> folder.</p></details></section>
  </>;
}
