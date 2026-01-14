export default async function handler(req, res) {
    const { existingPersonas, cardsData } = req.body;
    // Correct the newline character from "/n" to "\n"
    const personaMultiLines = existingPersonas.length === 0 ? "none" : existingPersonas.map(persona=>persona.description).join("\n");
    const problemStr = cardsData.filter(card=>card.stage==="problem").map(card =>
        card.description
    ).join(';') || "";

    // console.log(`Generate 5 personas in one-paragraph descriptions. These personas should parallel the Existing Personas to represent a wider range of stakeholders. ${problemStr!=="" && "These personas should also be directly or indirectly affected by the problem(s): "+problemStr}.
            
    //         Existing Personas:
    //         ${personaMultiLines}`)
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

    const acceptsStream = (req.headers.accept || "").includes("text/event-stream");
    if (acceptsStream) {
        payload.stream = true;
    }

    // API endpoint updated to use the latest GPT-4 model
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (acceptsStream) {
        if (!response.ok || !response.body) {
            const errorText = await response.text();
            res.status(response.status || 500).json({ error: errorText });
            return;
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";
            for (const event of events) {
                const lines = event.split("\n");
                for (const line of lines) {
                    if (!line.startsWith("data:")) continue;
                    const data = line.replace("data:", "").trim();
                    if (data === "[DONE]") {
                        res.write("data: [DONE]\n\n");
                        res.end();
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) {
                            res.write(`data: ${content}\n\n`);
                        }
                    } catch (error) {
                        console.error("Stream parse error:", error);
                    }
                }
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();
        return;
    }

    const json = await response.json();
    console.log(json);
    console.log(json.choices[0].message.content);

    const content = json.choices[0].message.content || "";
    const personaMatches = [...content.matchAll(/<persona>([\s\S]*?)<\/persona>/g)];
    const personas = personaMatches.length
        ? personaMatches.map(match => match[1].replace(/<[^>]+>/g, "").trim()).filter(item => item !== "")
        : content.split('\n').map(item => removeEnumerators(item)).filter(item => item !== "");

    res.status(200).json({ res: personas });
}

function removeEnumerators(text) {
    return text.replace(/^\d+\.\s+|^\-\s+/gm, '');
}
