// 配信音源の一時的な通信・デコード失敗を吸収する。
const MAX_ATTEMPTS = 3;
const IDLE_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 400;
const RETRYABLE_HTTP = new Set([408, 425, 429, 500, 502, 503, 504]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withIdleTimeout(promise, controller) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(retryError('audio request stalled'));
      }, IDLE_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

function retryError(message, cause = null, retryable = true) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.retryable = retryable;
  return error;
}

async function fetchAudio(url, attempt, onProgress) {
  const controller = new AbortController();

  try {
    const response = await withIdleTimeout(fetch(url, {
      signal: controller.signal,
      // 失敗後はHTTPキャッシュの不完全・古い応答を避けて取り直す。
      cache: attempt === 0 ? 'default' : 'reload',
    }), controller);
    if (!response.ok) {
      throw retryError(`audio ${response.status}`, null, RETRYABLE_HTTP.has(response.status));
    }

    const total = Number(response.headers.get('content-length')) || 0;
    let data;
    if (total > 0 && response.body?.getReader) {
      const reader = response.body.getReader();
      const parts = [];
      let received = 0;
      try {
        for (;;) {
          const { done, value } = await withIdleTimeout(reader.read(), controller);
          if (done) break;
          parts.push(value);
          received += value.byteLength;
          onProgress?.(0.85 * (received / total));
        }
      } finally {
        reader.releaseLock();
      }
      const bytes = new Uint8Array(received);
      let offset = 0;
      for (const part of parts) {
        bytes.set(part, offset);
        offset += part.byteLength;
      }
      data = bytes.buffer;
    } else {
      data = await withIdleTimeout(response.arrayBuffer(), controller);
    }
    if (!data.byteLength) throw retryError('audio response was empty');
    return data;
  } catch (error) {
    if (!controller.signal.aborted) controller.abort();
    if (error?.retryable === false) throw error;
    if (error?.retryable === true) throw error;
    throw retryError('audio request failed', error);
  }
}

function unscramble(buffer, key) {
  const bytes = new Uint8Array(buffer);
  const keyBytes = new TextEncoder().encode(key);
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= keyBytes[i % keyBytes.length] ^ ((i >> 8) & 255);
  return bytes.buffer;
}

// 'aes:<base64>' の鍵: tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin([iv 12バイト][暗号文])を復号する
async function decryptAes(buffer, keyB64) {
  const u8 = new Uint8Array(buffer);
  const raw = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const k = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8.subarray(0, 12) }, k, u8.subarray(12));
}

export async function loadExternalAudio(url, key = null, onProgress = null) {
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) onProgress?.(0);
      let bytes = await fetchAudio(url, attempt, onProgress);
      if (key?.startsWith('aes:')) bytes = await decryptAes(bytes, key.slice(4));
      else if (key) bytes = unscramble(bytes, key);
      // decodeAudioDataが入力をdetachする実装があるため、試行ごとに複製を渡す。
      return await new OfflineAudioContext(2, 1, 44100).decodeAudioData(bytes.slice(0));
    } catch (error) {
      lastError = error;
      if (error?.retryable === false || attempt === MAX_ATTEMPTS - 1) throw error;
      await wait(RETRY_DELAY_MS * (2 ** attempt));
    }
  }
  throw lastError || new Error('audio load failed');
}
