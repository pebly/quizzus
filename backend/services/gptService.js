const { OpenAI } = require('openai');
const apiKey = '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';
const openai = new OpenAI({apiKey: apiKey});

const generateQuestion = async (settings) => {
    
    // placeholder

    return {
        "questionData": [
          {
            "question": "Care este cel mai mare lac din lume după suprafață?",
            "questionType": "checkbox",
            "questionAnswers": [
              "Lacul Superior",
              "Marea Caspică",
              "Lacul Victoria",
              "Lacul Baikal"
            ],
            "correctAnswersIndexes": [1]
          },
          {
            "question": "În ce an a avut loc Revoluția Franceză?",
            "questionType": "response",
            "questionAnswers": [],
            "correctAnswersIndexes": []
          },
          {
            "question": "Care dintre următoarele orașe este capitala Spaniei?",
            "questionType": "checkbox",
            "questionAnswers": [
              "Barcelona",
              "Madrid",
              "Valencia",
              "Sevilla"
            ],
            "correctAnswersIndexes": [1]
          }
        ]
    }
      

    // dont have credit for the gpt rn

    /*

    Generate random trivia questions from the subject: General Knowledge. I want you to generate 3 questions in the Romanian language and for each question I want to have single or multiple correct variants.

    The response you'd provide should be in the following format:

    {
        questionData:
        {
            question: the trivia question you asked,
            questionType: checkbox or response
            questionAnswers: [] (all answer variants)
            correctAnswersIndexes: [] (the correct answer indexes)
        }
    }

    If the questionType is response I don't need variants of response because the user should respond by typing his response in a textbox.
    If the questionType is checkbox the user will need to select the variants I provide for him.

*/

    const prompt = `Generate trivia questions with the following settings: ${JSON.stringify(settings)}`;
    const gptResponse = await openai.chat.completions.create({
        messages: prompt,
        model: "gpt-3.5-turbo"
    });

    return gptResponse.choices[0];
}

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
