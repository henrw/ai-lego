export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const apiKey = getApiKey(req);
    if (!apiKey) {
        res.status(401).json({ error: "A valid OpenAI API key is required." });
        return;
    }
    const { existingPersonas, cardsData } = req.body;
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
            content: `Generate 3 personas in one-paragraph descriptions. These personas should parallel the Existing Personas to represent a wider range of the stakeholders. ${problemStr!=="" && "These personas should also be directly or indirectly affected by the problem(s): "+problemStr}. The paragraph should begin with a brief summary sentence about the persona, followed by detailed descriptions of the persona’s background, including various aspects.

Return output as XML only with this structure:
<personas>
  <persona>...</persona>
  <persona>...</persona>
  <persona>...</persona>
</personas>

Existing Personas:
${personaMultiLines}`}],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        res.status(response.status).json({ error: getOpenAIErrorMessage(response.status) });
        return;
    }
    const json = await response.json();
    const content = json.choices[0].message.content || "";
    const personaMatches = [...content.matchAll(/<persona>([\s\S]*?)<\/persona>/g)];
    const personas = personaMatches.length
        ? personaMatches.map(match => match[1].replace(/<[^>]+>/g, "").trim()).filter(item => item !== "")
        : content.split('\n').map(item => removeEnumerators(item)).filter(item => item !== "");

    res.status(200).json({ res: personas });
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
