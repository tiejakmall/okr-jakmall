import SessionProvider from "@/components/SessionProvider";

export default function PendingApprovalLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
