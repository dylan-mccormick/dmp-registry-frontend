// Pull the backend's error message out of a failed response, for showing in a banner
export const readApiError = async (res: Response, fallback: string): Promise<string> => {
    try {
        const body = await res.json();
        return typeof body?.error === "string" ? body.error : typeof body?.message === "string" ? body.message : fallback;
    } catch {
        return fallback;
    }
};
