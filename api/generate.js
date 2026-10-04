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
    const { existingPersonas } = req.body;
    if (!Array.isArray(existingPersonas) || existingPersonas.length > 100 || existingPersonas.some(persona => !persona || typeof persona.description !== "string" || persona.description.length > 20000)) { res.status(400).json({ error: "Provide valid stakeholder descriptions." }); return; }
    const personaMultiLines = existingPersonas.length === 0
        ? "none"
        : existingPersonas.map(persona => persona.description).join("\n");
    const problemStr = cardsData
        .filter(card => card.stage === "problem")
        .map(card => card.description)
        .join(';') || "";

    const payload = {
        model: "gpt-4",
        messages: [{
            role: "user",
            content: `Generate 3 personas in one-paragraph descriptions. These personas should parallel the Existing Personas to represent a wider range of the stakeholders. ${problemStr ? "These personas should also be directly or indirectly affected by the problem(s): " + problemStr : ""}. The paragraph should begin with a brief summary sentence about the persona, followed by detailed descriptions of the persona’s background, including various aspects.

Return output as XML only with this structure:
<personas>
  <persona>...</persona>
  <persona>...</persona>
  <persona>...</persona>
</personas>

Existing Personas:
${personaMultiLines}`}],
    };

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

        if (!response.ok) {
            res.status(response.status).json({ error: getOpenAIErrorMessage(response.status) });
            return;
        }
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content || "";
        const personaMatches = [...content.matchAll(/<persona>([\s\S]*?)<\/persona>/g)];
        const personas = personaMatches.length
            ? personaMatches.map(match => match[1].replace(/<[^>]+>/g, "").trim()).filter(item => item !== "")
            : content.split('\n').map(item => removeEnumerators(item.replace(/<[^>]+>/g, "")).trim()).filter(item => item !== "" && !item.startsWith("```"));

        if (!personas.length) { res.status(502).json({ error: "No personas were returned. Please retry." }); return; }
        res.status(200).json({ res: personas.slice(0, 3) });
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

function removeEnumerators(text) {
    return text.replace(/^\d+\.\s+|^\-\s+/gm, '');
}
