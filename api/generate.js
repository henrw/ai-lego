export default async function handler(req, res) {
    const { existingPersonas } = req.body;
    // Correct the newline character from "/n" to "\n"
    const personaMultiLines = existingPersonas.length === 0 ? "none" : existingPersonas.join("\n");
    const payload = {
        model: "gpt-4",
        messages: [{
            role: "user",
            content: `Generate some personas in one-sentence descriptions. These personas should parallel the Existing Personas to represent a wider range of the population. They should also be influenced by the problem: [Manual hiring is taxing and needs AI to automate the process]. Ensure that your response is formatted in unnumbered lines.
            
            Existing Personas:
            ${personaMultiLines}
        `}],
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

    res.status(200).json({ res: json.choices[0].message.content.split('\n') });
}