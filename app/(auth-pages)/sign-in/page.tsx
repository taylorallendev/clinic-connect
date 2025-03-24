import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { GoogleLoginButton } from "@/components/social-login-buttons";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex min-h-[80vh] items-center justify-center w-full">
      <form className="flex flex-col w-full max-w-md p-8 rounded-lg border bg-white shadow-sm">
        <h1 className="text-2xl font-medium text-center">Sign in</h1>
        <p className="text-sm text-foreground text-center mt-2 mb-6">
          Don't have an account?{" "}
          <Link className="text-primary font-medium underline" href="/sign-up">
            Sign up
          </Link>
        </p>

        {searchParams?.type === "error" && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            <p className="font-medium">Authentication Error</p>
            <p>{searchParams.message}</p>
            {searchParams.code && (
              <p className="text-xs mt-1 text-red-500/80">
                {searchParams.code === "invalid_credentials" &&
                  "Please check your email and password."}
                {searchParams.code === "too_many_attempts" &&
                  "Too many login attempts. Please try again later."}
                {searchParams.code === "user_not_found" &&
                  "No account found with this email address."}
              </p>
            )}
          </div>
        )}

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

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                className="text-xs text-primary hover:text-primary/80"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="Your password"
              required
              className="h-11 bg-slate-100/50 border-slate-200 rounded-md px-3"
            />
          </div>

          <SubmitButton
            pendingText="Signing In..."
            formAction={signInAction}
            className="h-11 mt-2 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-medium"
          >
            Sign in
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
        </div>
      </form>
    </div>
  );
}
