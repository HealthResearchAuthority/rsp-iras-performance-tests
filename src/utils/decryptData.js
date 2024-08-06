import { crypto } from "k6/experimental/webcrypto";
import { b64decode } from "k6/encoding";
import { SharedArray } from "k6/data";

const keyValues = new SharedArray("keyValues", function () {
  return JSON.parse(open("../resources/data/keyArray.json"));
});

export async function decryptData(textToDecrypt) {
  const decodedData = base64Decode(textToDecrypt);
  //Key must match the one used to encrypt
  const key = new Uint8Array(keyValues);

  try {
    return await decrypt(key, decodedData);
  } catch (e) {
    console.log("Error: " + JSON.stringify(e));
  }
}

const decrypt = async (key, decodedData) => {
  // Extract Initialization Vector
  const initializeVectorLength = 12;
  const iv = new Uint8Array(decodedData.subarray(0, initializeVectorLength));

  // Extract Encrypted Data
  const encryptedData = new Uint8Array(
    decodedData.subarray(initializeVectorLength)
  );

  // Import Key must match the one used to encrypt
  const importedKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM", length: "256" },
    true,
    ["decrypt"]
  );

  const plainText = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    importedKey,
    encryptedData
  );

  return arrayBufferToString(plainText);
};

const arrayBufferToString = (buffer) => {
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
};

const base64Decode = (base64String) => {
  return new Uint8Array(b64decode(base64String));
};
