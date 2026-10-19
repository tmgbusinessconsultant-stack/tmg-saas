import type { Metadata } from "next";
import AuthForm from "../auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
