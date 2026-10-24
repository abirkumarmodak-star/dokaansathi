import axios from "axios";

const configError =
    "VITE_API_BASE_URL must be an absolute HTTP(S) URL ending in /api.";
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredApiBaseUrl) {
    throw new Error(configError);
}

const normalizedApiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, "");
let parsedApiBaseUrl;

try {
    parsedApiBaseUrl = new URL(normalizedApiBaseUrl);
} catch {
    throw new Error(configError);
}

const apiPathSegments = parsedApiBaseUrl.pathname.split("/").filter(Boolean);

if (
    !["http:", "https:"].includes(parsedApiBaseUrl.protocol) ||
    parsedApiBaseUrl.username ||
    parsedApiBaseUrl.password ||
    parsedApiBaseUrl.search ||
    parsedApiBaseUrl.hash ||
    apiPathSegments.at(-1) !== "api" ||
    apiPathSegments.at(-2) === "api"
) {
    throw new Error(configError);
}

const api = axios.create({
    baseURL: normalizedApiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
