import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @param {string} code - The error code to be added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export const encodedRedirect = (
  type: string,
  path: string,
  message: string,
  code?: string
) => {
  const params = new URLSearchParams();
  params.append("type", type);
  params.append("message", message);
  if (code) {
    params.append("code", code);
  }
  return redirect(`${path}?${params.toString()}`);
};
