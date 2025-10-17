// export let GetBaseApiUrl = (prop) => {
//   return `https://calibrecue.com/api/${prop}`;
// };

export let GetBaseApiUrl = (prop) => {
  return `https://ams.calibrecue.com/api/${prop}`;
};

export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return false;

    const currentTime = Date.now() / 1000; // in seconds
    return decoded.exp > currentTime; // true if valid, false if expired
  } catch (error) {
    return false;
  }
};

