const { OpenAI } = require('openai-api');
const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI(apiKey);

const generateQuestion = async (settings) => {
    const prompt = `Generate a trivia question with the following settings: ${JSON.stringify(settings)}`;
    const gptResponse = await openai.complete({
        engine: 'davinci',
        prompt: prompt,
        maxTokens: 150,
    });

    return gptResponse.data.choices[0].text.trim();
};

const evaluateAnswer = async (question, answer, personality) => {
    const prompt = `Evaluate the following answer based on correctness and personality (${personality}): 
    Question: ${question}
    Answer: ${answer}`;

    const gptResponse = await openai.complete({
        engine: 'davinci',
        prompt: prompt,
        maxTokens: 150,
    });

    return gptResponse.data.choices[0].text.trim();
};

module.exports = { generateQuestion, evaluateAnswer };
