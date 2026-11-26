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


// Automatically attach the logged-in user's JWT
api.interceptors.request.use((config) => {
    let token = null;

    try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const staffUser = JSON.parse(
            localStorage.getItem("staffUser") ||
            localStorage.getItem("staff") ||
            "null"
        );

        if (user?.role?.toLowerCase() === "owner") {
            token = localStorage.getItem("token");
        } else if (staffUser?.role?.toLowerCase() === "manager") {
            token = localStorage.getItem("staffToken");
        } else {
            token =
                localStorage.getItem("token") ||
                localStorage.getItem("staffToken");
        }
    } catch {
        token = null;
    }

    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
