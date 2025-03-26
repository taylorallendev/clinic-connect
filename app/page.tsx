import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-3xl w-full text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            ClinicConnect
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground">
            Streamline your veterinary practice with our comprehensive clinic
            management solution.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              asChild
              size="lg"
              className="px-8 bg-[#2a9d8f] hover:bg-[#2a9d8f]/90"
            >
              <Link href={"/app/dashboard/current-case"}>Get Started</Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          {/* Feature highlights */}
          <div className="border rounded-lg p-6 text-center">
            <h3 className="text-xl font-medium mb-2">Appointment Management</h3>
            <p className="text-muted-foreground">
              Efficiently schedule and manage patient appointments with our
              intuitive calendar system.
            </p>
          </div>
          <div className="border rounded-lg p-6 text-center">
            <h3 className="text-xl font-medium mb-2">Patient Records</h3>
            <p className="text-muted-foreground">
              Maintain comprehensive digital records for all your animal
              patients in one secure location.
            </p>
          </div>
          <div className="border rounded-lg p-6 text-center">
            <h3 className="text-xl font-medium mb-2">Team Collaboration</h3>
            <p className="text-muted-foreground">
              Improve clinic workflow with tools designed for seamless
              communication between staff members.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ClinicConnect. All rights reserved.
      </footer>
    </div>
  );
}
