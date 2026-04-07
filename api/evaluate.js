export default async function handler(req, res) {
    const { personaDescription, cardsData } = req.body;
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (streamRequested) {
        if (!response.ok || !response.body) {
            const errorText = await response.text();
            res.status(response.status || 500).json({ error: errorText });
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

    const json = await response.json();
    res.status(200).json({ res: json.choices[0].message.content });
}

function getAIDevelopmentText(cardsData) {
    const text = cardsData.map(card =>
        card.stage + ": " + card.description
    ).join('\n')
    return text;
}
