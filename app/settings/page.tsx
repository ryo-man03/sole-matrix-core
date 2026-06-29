import { AppShell } from "../_components/AppShell";
import { MainContainer } from "../_components/MainContainer";
import { SettingsPanel } from "../_components/SettingsPanel";

export default function SettingsPage() {
  return (
    <AppShell>
      <MainContainer labelledBy="settings-title">
        <SettingsPanel />
      </MainContainer>
    </AppShell>
  );
}
