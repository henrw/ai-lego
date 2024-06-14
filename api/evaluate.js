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

    console.log(json.choices[0].message.content);

    res.status(200).json({ res: json.choices[0].message.content });
}

function getAIDevelopmentText(cardsData) {
    const text = cardsData.map(card =>
        card.stage + ": " + card.description
    ).join('\n')
    return text;
}