import { crypto } from "k6/experimental/webcrypto";
import { b64encode } from "k6/encoding";

export default async function () {
  //Replace with text to encrypt, revert immediately after use
  const textToEncrypt = "<add text to encrypt>";
  const key = crypto.getRandomValues(new Uint8Array(32));
  let keyArray = [];

  try {
    const encryptedText = await encrypt(key, textToEncrypt);
    const encodedData = b64encode(encryptedText);
    // Output value to be used for decryption
    console.log("Encrypted & Encoded data: '" + encodedData + "'");
    key.forEach((value) => keyArray.push(value));
    // Output value to be used for keyArray
    console.log("Values to use in Key Array: " + keyArray);
  } catch (e) {
    console.log("Error: " + JSON.stringify(e));
  }
}

const encrypt = async (key, textToEncrypt) => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate a random Initialization Vector (IV)
  const importedKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );
  const plaintextArray = stringToUint8Array(textToEncrypt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    importedKey,
    plaintextArray
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);

  // Return combination of IV and encrypted data
  const combinedData = new Uint8Array(iv.length + encryptedArray.length);
  combinedData.set(iv);
  combinedData.set(encryptedArray, iv.length);
  return combinedData;
};

const stringToUint8Array = (str) => {
  const array = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    array[i] = str.charCodeAt(i);
  }
  return array;
};
