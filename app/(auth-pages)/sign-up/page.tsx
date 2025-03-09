import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { GoogleLoginButton } from "@/components/social-login-buttons";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center w-full">
      <div className="w-full max-w-md px-4 py-8 sm:px-0">
        <form className="flex flex-col w-full p-8 rounded-lg border bg-white shadow-sm">
          <h1 className="text-2xl font-medium text-center">Sign up</h1>
          <p className="text-sm text-foreground text-center mt-2 mb-6">
            Already have an account?{" "}
            <Link
              className="text-primary font-medium underline"
              href="/sign-in"
            >
              Sign in
            </Link>
          </p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  name="firstName"
                  id="firstName"
                  placeholder="John"
                  required
                  className="h-11 bg-slate-100/50 border-slate-200 rounded-md px-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  name="lastName"
                  id="lastName"
                  placeholder="Doe"
                  required
                  className="h-11 bg-slate-100/50 border-slate-200 rounded-md px-3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                name="email"
                id="email"
                placeholder="you@example.com"
                required
                className="h-11 bg-slate-100/50 border-slate-200 rounded-md px-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                type="password"
                name="password"
                id="password"
                placeholder="Your password"
                minLength={6}
                required
                className="h-11 bg-slate-100/50 border-slate-200 rounded-md px-3"
              />
            </div>

            <SubmitButton
              formAction={signUpAction}
              pendingText="Signing up..."
              className="h-11 mt-2 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-medium"
            >
              Sign up
            </SubmitButton>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleLoginButton />
            <FormMessage message={searchParams} />
          </div>
        </form>
        <div className="mt-4">
          <SmtpMessage />
        </div>
      </div>
    </div>
  );
}
