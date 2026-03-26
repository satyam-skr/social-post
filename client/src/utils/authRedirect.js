export const buildRedirectParam = (targetPath) => {
  const redirect = typeof targetPath === 'string' && targetPath.trim() ? targetPath.trim() : '/';
  return encodeURIComponent(redirect);
};

export const loginUrlWithRedirect = (targetPath) => `/login?redirect=${buildRedirectParam(targetPath)}`;
export const signupUrlWithRedirect = (targetPath) => `/signup?redirect=${buildRedirectParam(targetPath)}`;

