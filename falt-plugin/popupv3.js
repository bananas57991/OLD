document.getElementById("decode").addEventListener("click", async () => {
    const input = document.getElementById("input").value;

    try {
        const result = await decodeInput(input);
        document.getElementById("output").innerText = result;
    } catch (e) {
        console.error(e);
        document.getElementById("output").innerText = "Error: " + e.message;
    }
});

async function decodeInput(encodedString) {
    const index = encodedString.indexOf(".");
    if (index === -1) throw new Error("Invalid format: missing dot");

    const base64Part = encodedString.slice(0, index);
    const domainName = encodedString.slice(index + 1);

    const xorResult = base64ToBytes(base64Part);
    const domainBytes = await domainHash(domainName);
    const ipPortBytes = xorBytes(xorResult, domainBytes);

    return binToIpPort(ipPortBytes);
}

async function domainHash(domainName) {
    const encoder = new TextEncoder();
    const data = encoder.encode(domainName);

    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    return new Uint8Array(hashBuffer).slice(0, 18);
}

function base64ToBytes(base64) {
    let normalized = base64
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    normalized += "=".repeat((4 - normalized.length % 4) % 4);

    const binary = atob(normalized);

    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function xorBytes(a, b) {
    const length = Math.min(a.length, b.length);
    const result = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}

function binToIpPort(bytes) {
    if (bytes.length === 6) {
        const ip = `${bytes[0]}.${bytes[1]}.${bytes[2]}.${bytes[3]}`;
        const port = (bytes[4] << 8) | bytes[5];
        return `${ip}:${port}`;
    }

    if (bytes.length === 18) {
        const ipParts = [];
        for (let i = 0; i < 16; i += 2) {
            ipParts.push(((bytes[i] << 8) | bytes[i + 1]).toString(16));
        }

        const ip = ipParts.join(":");
        const port = (bytes[16] << 8) | bytes[17];

        return `[${ip}]:${port}`;
    }

    throw new Error("Invalid byte length: " + bytes.length);
} 

