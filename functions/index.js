// Server-side proxy for the SCAN / SCAN BILL features.
//
// The client sends bill/entry screenshots (as base64 images) plus the
// extraction prompt to this callable function instead of calling
// api.anthropic.com directly. The Anthropic API key lives only here, as a
// Cloud Functions secret, and never touches a device's localStorage.
//
// Deploy:
//   cd functions && npm install
//   firebase functions:secrets:set ANTHROPIC_API_KEY
//   firebase deploy --only functions

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

const MAX_TOKENS_CAP = 500;
const MAX_IMAGES = 3;

exports.scanImage = onCall({secrets: [anthropicKey]}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }

  const data = request.data || {};
  const images = Array.isArray(data.images) ? data.images : [];
  const prompt = typeof data.prompt === "string" ? data.prompt : "";

  if (!images.length || !prompt) {
    throw new HttpsError("invalid-argument", "Missing images or prompt.");
  }
  if (images.length > MAX_IMAGES) {
    throw new HttpsError("invalid-argument", "Too many images (max " + MAX_IMAGES + ").");
  }

  const content = images.map(function(img) {
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: img.media_type || "image/png",
        data: img.data
      }
    };
  });
  content.push({type: "text", text: prompt});

  let maxTokens = parseInt(data.max_tokens, 10);
  if (!maxTokens || maxTokens < 1 || maxTokens > MAX_TOKENS_CAP) {
    maxTokens = MAX_TOKENS_CAP;
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey.value(),
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{role: "user", content: content}]
    })
  });

  const json = await anthropicRes.json();
  return json;
});
