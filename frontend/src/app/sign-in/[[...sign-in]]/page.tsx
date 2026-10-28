import { SignInClient } from "./SignInClient";

export const metadata = {
  title: "Sign In — CV Builder",
  description: "Sign in to your CV Builder account to manage and generate professional CVs.",
};

export function generateStaticParams() {
  return [{ "sign-in": [] }];
}

export default function SignInPage() {
  return <SignInClient />;
}
