import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center w-full">
      <div className="w-full max-w-md px-4 py-8 sm:px-0">
        <form className="flex flex-col w-full p-8 rounded-lg border bg-white shadow-sm">
          <h1 className="text-2xl font-medium text-center">Reset Password</h1>
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
            <SubmitButton
              formAction={forgotPasswordAction}
              className="h-11 mt-2 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-medium"
            >
              Reset Password
            </SubmitButton>
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
