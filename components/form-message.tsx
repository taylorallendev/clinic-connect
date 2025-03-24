export interface Message {
  type: string;
  message: string;
  code?: string;
}

export function FormMessage({ message }: { message: Message }) {
  if (!message?.type) return null;

  return (
    <div
      className={`p-3 rounded-md text-sm ${
        message.type === "error"
          ? "bg-red-50 border border-red-200 text-red-600"
          : "bg-green-50 border border-green-200 text-green-600"
      }`}
    >
      <p className="font-medium">
        {message.type === "error" ? "Error" : "Success"}
      </p>
      <p>{message.message}</p>
      {message.code && message.type === "error" && (
        <p className="text-xs mt-1 text-red-500/80">
          {message.code === "invalid_credentials" &&
            "Please check your email and password."}
          {message.code === "too_many_attempts" &&
            "Too many login attempts. Please try again later."}
          {message.code === "user_not_found" &&
            "No account found with this email address."}
        </p>
      )}
    </div>
  );
}
