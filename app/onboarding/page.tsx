import { AppShell } from "../_components/AppShell";
import { MainContainer } from "../_components/MainContainer";
import { OnboardingFlow } from "../_components/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <AppShell>
      <MainContainer labelledBy="onboarding-title">
        <OnboardingFlow />
      </MainContainer>
    </AppShell>
  );
}
