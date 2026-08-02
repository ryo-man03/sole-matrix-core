import { AppShell } from "../../_components/AppShell";
import { MainContainer } from "../../_components/MainContainer";
import { ProfileForm } from "../../_components/AccountForms";
export default function ProfilePage() { return <AppShell><MainContainer labelledBy="profile-title"><h1 id="profile-title">プロフィール</h1><ProfileForm /></MainContainer></AppShell>; }
