export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); res.status(405).json({ error: "Use POST for this request." }); return; }
    const { cardsData } = req.body || {};
    if (!Array.isArray(cardsData) || cardsData.length > 100 || cardsData.some(card => !card || typeof card.stage !== "string" || typeof card.description !== "string" || card.description.length > 20000)) {
        res.status(400).json({ error: "Provide a valid development plan with at most 100 stages." }); return;
    }
    const apiKey = getApiKey(req);
    if (!apiKey) {
        res.status(401).json({ error: "A valid OpenAI API key is required." });
        return;
    }
    const { personaDescription } = req.body;
    if (typeof personaDescription !== "string" || !personaDescription.trim() || personaDescription.length > 20000) { res.status(400).json({ error: "Provide a stakeholder description." }); return; }
    const payload = {
        model: "gpt-4",
        messages: [{
            role: "system",
            content: `You are ${personaDescription}. You will be provided with a development plan for an AI product and asked to share your concerns about its negative impact on you. Keep your response precise and justify your argument properly. Make sure your response matches the experience, knowledge, and tone of the persona you are.
            
            AI development plan:
            ${getAIDevelopmentText(cardsData)}
            `}],
    };

    const acceptsStream = (req.headers.accept || "").includes("text/event-stream");
    const streamRequested = acceptsStream || req.query?.stream === "1" || req.body?.stream === true;
    if (streamRequested) {
        payload.stream = true;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);
    const disconnected = () => { if (!res.writableEnded) controller.abort(); };
    res.on("close", disconnected);
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            signal: controller.signal,
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (streamRequested) {
            if (!response.ok || !response.body) {
                res.status(response.status || 500).json({ error: getOpenAIErrorMessage(response.status) });
                return;
            }

            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("Transfer-Encoding", "chunked");
            res.setHeader("X-Accel-Buffering", "no");
            res.setHeader("Content-Encoding", "identity");
            res.setHeader("X-Stream", "1");
            if (typeof res.flushHeaders === "function") {
                res.flushHeaders();
            }
            // Pipe OpenAI's SSE stream directly — no re-encoding needed
            const reader = response.body.getReader();
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                res.write(value);
                if (typeof res.flush === "function") res.flush();
            }
            res.end();
            return;
        }

        if (!response.ok) {
            res.status(response.status).json({ error: getOpenAIErrorMessage(response.status) });
            return;
        }
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (!content?.trim()) { res.status(502).json({ error: "The simulation returned no text. Please retry." }); return; }
        res.status(200).json({ res: content });
    } catch (error) {
        if (res.destroyed || res.writableEnded) return;
        const message = controller.signal.aborted ? "The AI request timed out. Please retry." : "The AI service could not be reached. Please retry.";
        if (res.headersSent) { res.write(`data: ${JSON.stringify({ error: message })}\n\n`); res.end(); }
        else res.status(controller.signal.aborted ? 504 : 502).json({ error: message });
    } finally {
        clearTimeout(timeout); res.off("close", disconnected);
    }
}

function getApiKey(req) {
    const authorization = req.headers.authorization || "";
    const match = authorization.match(/^Bearer\s+(sk-[A-Za-z0-9_-]+)$/);
    return match?.[1] || "";
}

function getOpenAIErrorMessage(status) {
    if (status === 401) return "OpenAI rejected this API key. Check the key and try again.";
    if (status === 429) return "OpenAI's usage limit was reached. Check the key's quota and billing settings.";
    return "OpenAI could not complete the request. Please try again.";
}

function getAIDevelopmentText(cardsData) {
    const text = cardsData.map(card =>
        card.stage + ": " + card.description
    ).join('\n')
    return text;
}
