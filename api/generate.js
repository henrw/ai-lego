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
            
            Existing Personas:
            ${personaMultiLines}`}],
    };

    // API endpoint updated to use the latest GPT-4 model
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    const json = await response.json();
    console.log(json);
    console.log(json.choices[0].message.content);

    res.status(200).json({ res: json.choices[0].message.content.split('\n').map(item=>removeEnumerators(item)).filter(item=>item!=="") });
}

function removeEnumerators(text) {
    return text.replace(/^\d+\.\s+|^\-\s+/gm, '');
}