"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2 } from "lucide-react";
import { FormValues } from "../hooks/use-case-form";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailTo: string;
  emailFrom: string;
  setEmailTo: (value: string) => void;
  setEmailFrom: (value: string) => void;
  isSending: boolean;
  savedCaseData: FormValues | null;
  onSend: () => void;
}

export function EmailDialog({
  open,
  onOpenChange,
  emailTo,
  emailFrom,
  setEmailTo,
  setEmailFrom,
  isSending,
  savedCaseData,
  onSend,
}: EmailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className="text-[#1A202C]">Send Email</DialogTitle>
          <DialogDescription className="text-[#718096]">
            Send the selected case action by email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="from"
              className="text-sm font-medium text-[#1A202C]"
            >
              From Email
            </label>
            <Input
              id="from"
              type="email"
              value={emailFrom}
              onChange={(e) => setEmailFrom(e.target.value)}
              placeholder="clinic@example.com"
              className="bg-white border-[#E2E8F0] text-[#1A202C] placeholder:text-[#718096]/50"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="to" className="text-sm font-medium text-[#1A202C]">
              To Email
            </label>
            <Input
              id="to"
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="owner@example.com"
              className="bg-white border-[#E2E8F0] text-[#1A202C] placeholder:text-[#718096]/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
            }}
            className="text-[#718096] hover:text-[#1A202C] hover:bg-[#F8F9FA]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={onSend}
            disabled={isSending || !emailTo || !emailFrom}
            className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
