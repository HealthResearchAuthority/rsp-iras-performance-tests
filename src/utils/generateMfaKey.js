import * as OTPAuth from "https://cdn.jsdelivr.net/npm/otpauth@9.4.0/dist/otpauth.esm.js";

export function generateTOTP(secretKey) {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretKey),
  });
  return totp.generate();
}
