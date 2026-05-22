export const DEFAULT_POST_LOGIN_REDIRECT = '/omni-studio';

export function getPostLoginRedirect(callbackUrl?: string | null) {
  return callbackUrl || DEFAULT_POST_LOGIN_REDIRECT;
}
