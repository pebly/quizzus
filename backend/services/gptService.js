const { OpenAI } = require('openai');
const apiKey = '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';
const openai = new OpenAI({apiKey: apiKey});

const generateQuestion = async (settings) => {
    
    // placeholder

    // return {
    //     "questionData": [
    //       {
    //         "question": "Care este cel mai mare lac din lume după suprafață?",
    //         "questionType": "checkbox",
    //         "questionAnswers": [
    //           "Lacul Superior",
    //           "Marea Caspică",
    //           "Lacul Victoria",
    //           "Lacul Baikal"
    //         ],
    //         "correctAnswersIndexes": [1]
    //       },
    //       {
    //         "question": "În ce an a avut loc Revoluția Franceză?",
    //         "questionType": "response",
    //         "questionAnswers": [],
    //         "correctAnswersIndexes": []
    //       },
    //       {
    //         "question": "Cand a fost creată piramida?",
    //         "questionType": "personality",
    //         "questionAnswers": [],
    //         "correctAnswersIndexes": [],
    //         "personality": 'funny',
    //       }
    //     ]
    // }
      

    // dont have credit for the gpt rn

    /*

    Generate random trivia questions from the subject: General Knowledge. I want you to generate 3 questions in the Romanian language and for each question I want to have single or multiple correct variants.

    The response you'd provide should be in the following format:

    

    If the questionType is response I don't need variants of response because the user should respond by typing his response in a textbox.
    If the questionType is checkbox the user will need to select the variants I provide for him.

*/
    console.log(settings);
    const prompt = `Generate random trivia questions from the subject: ${settings.subject}. I want you to generate ${settings.numberOfQuestions} (you need to generate exactly the number provided) questions in the ${settings.language} language and for each question I want to have single or multiple correct variants.

    The response you'd provide should be in the following format: (IT SHOULD BE VALID JSON FORMAT READY TO BE WORKED ON A NODE.JS BACKEND!)
    The respones should only contain the json without anything like json specificer '''json JUST THE JSON.
    EACH ELEMENT WITHIN THE QUESTIONDATA ARRAY SHOULD CONTAIN ALL (question, questionType, questionAnswers, correctAnswerIndexes).

    THE ABOVE IS JUST AN EXAMPLE, YOU SHOULD GENERATE ${settings.numberOfQuestions} QUESTIONS!
      {
        "questionData": [
          {
            "question": "Care este capitala României?",
            "questionType": "checkbox",
            "questionAnswers": ["București", "Cluj-Napoca", "Timișoara", "Iași"],
            "correctAnswersIndexes": [0]
          },
          {
            "question": "În ce limbă este scrisă limba engleză?",
            "questionType": "response",
            "questionAnswers": [],
            "correctAnswersIndexes": []
          },
          {
            "question": "Câți ani are un deceniu?",
            "questionType": "personality",
            "questionAnswers": [],
            "correctAnswersIndexes": [],
            "personality": "funny"
          }
        ]
      }
  

    If the questionType is response I don't need variants of response because the user should respond by typing his response in a textbox.
    If the questionType is checkbox the user will need to select the variants I provide for him.
    If the questionType is personality, you should provide a question where the user would need to write a response with the personality you want. (examples: funny, dark, etc, you choose) `;
    
    const gptResponse = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo"
    });
    return gptResponse.choices[0].message.content;
}

const evaluateAnswer = async (question, answer, type, personality) => {
  console.log("Received info: " + `${question} ${answer} ${type} ${personality}`)
  const prompt = `You have received the following question: ${question}.
  Please tell me with a score from 0 to 10 how correct to following answer ${answer} is.
  Please also tell me with a score from 0 to 10 how close to the personality: ${personality} is the answer provided.
  Also, please tell me an opinion about the answer provided for the question provided.
  Also, please respond following the next JSON format: (is just an example of format you should change the values depending on your answer)

  So if ${answer} IS CORRECT, your opinion should make me understand that, but if the answer IS NOT AN CORRECT ANSWER YOU SHOULD tell me THAT the answer IS NOT CORRECT! 

  {
    "correctness": 5,
    "personality": 5,
    "opinion": ""
  }
  
  `;
  const gptResponse = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo"
  });
  return gptResponse.choices[0].message.content;
}

module.exports = { generateQuestion, evaluateAnswer};
