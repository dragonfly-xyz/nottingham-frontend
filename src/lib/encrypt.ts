import { toBytes, toHex, type Hex } from "viem";

export interface EncryptedCodeSubmission {
    encryptedAesKey: Hex;
    encryptedCode: Hex;
    iv: Hex;
}

export async function encryptPlayerCode(
    seasonPublicKey: Hex,
    playerAddress: Hex,
    plainCode: Hex,
): Promise<EncryptedCodeSubmission> {
    // Code must be prefixed with the player address.
    const prefixedCode = Buffer.concat([toBytes(playerAddress), toBytes(plainCode)]);
    // 1. Create a random symmetric encryption key.
    // 2. Encrypt code with the symmetric key.
    // 3. Encrypt the symmetric key with the season's public key.
    const aesKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 128 },
        true,
        ['encrypt', 'decrypt'],
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedCode = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        prefixedCode,
    );
    const encryptedAesKey = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        await crypto.subtle.importKey(
            'jwk',
            decodeJwk(seasonPublicKey),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['encrypt'],
        ),
        await crypto.subtle.exportKey('raw', aesKey),
    );
    return {
        encryptedAesKey: toHex(new Uint8Array(encryptedAesKey)),
        encryptedCode: toHex(new Uint8Array(encryptedCode).slice(0, -16)),
        iv: toHex(iv),
    };
}

function decodeJwk(jwk: Hex): JsonWebKey {
    return JSON.parse(Buffer.from(toBytes(jwk)).toString());
}
