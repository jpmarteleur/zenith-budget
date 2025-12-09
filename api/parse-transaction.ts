import { GoogleGenAI, Type } from "@google/genai";

const schema = {
  type: Type.OBJECT,
  properties: {
    amount: {
      type: Type.NUMBER,
      description: "The transaction amount as a positive number.",
    },
    category: {
      type: Type.STRING,
      description: "The main category. Must be one of: 'Income', 'Expenses', 'Bills', 'Savings', 'Investments', 'Debts'.",
    },
    subcategory: {
      type: Type.STRING,
      description: "A specific, concise subcategory for the transaction (e.g., 'Groceries', 'Paycheck', 'Rent'). If a suitable existing subcategory is provided, use it. Otherwise, create a new, relevant one.",
    },
    note: {
      type: Type.STRING,
      description: "Any additional details or the original merchant name (e.g., 'Chipotle lunch').",
    },
  },
  required: ["amount", "category", "subcategory", "note"],
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, subcategories } = req.body;
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  try {
    let subcategoryContext = "The user has no subcategories yet.";
    if (subcategories) {
      let promptString = "Here are the user's existing subcategories:\n";
      let hasSubcategories = false;
      for (const category in subcategories) {
        const subcategoryNames = subcategories[category].map((s: any) => s.name);
        if (subcategoryNames.length > 0) {
          hasSubcategories = true;
          promptString += `- ${category}: ${subcategoryNames.join(', ')}\n`;
        }
      }
      if (hasSubcategories) subcategoryContext = promptString;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following transaction. Your primary goal is to categorize it into an existing subcategory if one is a good match. Only create a new subcategory if none of the existing ones are suitable. For income, use the 'Income' category. For spending, decide if it's a general 'Expense', a recurring 'Bill', a payment towards 'Debt', or putting money into 'Savings' or 'Investments'. ${subcategoryContext} Today's date is ${new Date().toISOString().split('T')[0]}. Transaction: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error parsing transaction:", error);
    res.status(500).json({ error: 'Failed to parse transaction' });
  }
}
