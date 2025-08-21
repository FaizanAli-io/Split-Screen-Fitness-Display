import PasswordGate from "@/components/PasswordGate";

export default function ProtectedLayout({ children }) {
  return <PasswordGate>{children}</PasswordGate>;
}
