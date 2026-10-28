import { SignUpClient } from "./SignUpClient";

export const metadata = {
  title: "Sign Up — CV Builder",
  description: "Create an account to start building and customizing your ATS-compliant CV.",
};

export function generateStaticParams() {
  return [{ "sign-up": [] }];
}

export default function SignUpPage() {
  return <SignUpClient />;
}
