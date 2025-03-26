import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Login() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-md p-8 rounded-lg border bg-white shadow-sm">
        <h1 className="text-2xl font-medium text-center">Sign in</h1>
        <p className="text-sm text-foreground text-center mt-2 mb-6">
          Don't have an account?{" "}
          <Link className="text-primary font-medium underline" href="/sign-up">
            Sign up
          </Link>
        </p>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none p-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "h-11 font-medium",
              formButtonPrimary: "h-11 mt-2 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-medium",
              formFieldInput: "h-11 bg-slate-100/50 border-slate-200 rounded-md px-3",
              footerAction: "hidden"
            }
          }}
          routing="path"
          path="/sign-in"
        />
      </div>
    </div>
  );
}
