import SessionProvider from "@/components/SessionProvider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
