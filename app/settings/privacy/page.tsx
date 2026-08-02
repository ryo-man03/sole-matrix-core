import { AppShell } from "../../_components/AppShell";
import { MainContainer } from "../../_components/MainContainer";
import { PrivacyForm } from "../../_components/AccountForms";
export default function PrivacyPage() { return <AppShell><MainContainer labelledBy="privacy-title"><h1 id="privacy-title">プライバシー</h1><PrivacyForm /></MainContainer></AppShell>; }
