const INDEXNOW_KEY = "e798cc3b64a244ccac870773ae375f3f";
const SITE_URL = "https://tmgbusinessconsulting.com";

export async function submitToIndexNow(urls: string[]) {
    try {
        const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                host: "tmgbusinessconsulting.com",
                key: INDEXNOW_KEY,
                keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
                urlList: urls,
            }),
        });
        return res.ok || res.status === 202;
    } catch (e) {
        console.error(e);
        return false;
    }
}