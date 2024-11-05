export async function requestSymbols(path) {
	try {
		const url = new URL(`https://gamma-api.polymarket.com/${path}`);
		// url.searchParams.append('api_key',apiKey)
		const response = await fetch(url.toString());
		return response.json();
	} catch (error) {
		throw new Error(`API request error: ${error.status}`);
	}
}

export async function requestBars(path) {
	try {
		const url = new URL(`https://clob.polymarket.com/${path}`);
		// url.searchParams.append('api_key',apiKey)
		const response = await fetch(url.toString());
		return response.json();
	} catch (error) {
		throw new Error(`API request error: ${error.status}`);
	}
}

// Generates a symbol ID from a pair of the coins
export function generateSymbol(exchange, fromSymbol, toSymbol) {
	const short = `${fromSymbol}/${toSymbol}`;
	return {
		short,
		full: `${exchange}:${short}`,
	};
}

// Returns all parts of the symbol
export function parseFullSymbol(fullSymbol) {
	const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
	if (!match) {
		return null;
	}

	return {
		exchange: match[1],
		fromSymbol: match[2],
		toSymbol: match[3],
	};
}

export function signPssText(privateKey, text) {
    // Before signing, we need to hash our message.
    // The hash is what we actually sign.
    // Convert the text to bytes
    const message = Buffer.from(text, 'utf-8');

    try {
        const signature = crypto.sign(
            'sha256',
            message,
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
            }
        );
        return signature.toString('base64');
    } catch (error) {
        throw new Error("RSA sign PSS failed: " + error.message);
    }
}

export function loadPrivateKey(key) {
    const privateKey = crypto.createPrivateKey({
        key: key,
        format: 'pem',
        // If your key is encrypted, you'd need to provide a passphrase here
        // passphrase: 'your-passphrase'
    });
    return privateKey;
}