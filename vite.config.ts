import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenAI, Type } from '@google/genai';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        // host:true binds to all (IPv4/IPv6) including localhost, 127.0.0.1, ::1.
        // This can resolve issues where visiting http://localhost:3000 behaved differently
        // due to extension interception or IPv6-only resolution.
        host: true,
      },
      plugins: [
        react(),
        {
          name: 'dev-api-parse-transaction',
          configureServer(server) {
            server.middlewares.use('/api/parse-transaction', async (req, res) => {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              try {
                const body = await new Promise<any>((resolve, reject) => {
                  let data = '';
                  req.on('data', (chunk) => (data += chunk));
                  req.on('end', () => {
                    try {
                      resolve(data ? JSON.parse(data) : {});
                    } catch (e) {
                      reject(e);
                    }
                  });
                  req.on('error', reject);
                });

                const { text, subcategories } = body || {};

                if (!env.GEMINI_API_KEY) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing GEMINI_API_KEY' }));
                  return;
                }

                const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

                let subcategoryContext = 'The user has no subcategories yet.';
                if (subcategories) {
                  let promptString = 'Here are the user\'s existing subcategories:\n';
                  let hasSubcategories = false;
                  for (const category in subcategories) {
                    const subs = subcategories[category] || [];
                    const names = Array.isArray(subs) ? subs.map((s: any) => s.name) : [];
                    if (names.length > 0) {
                      hasSubcategories = true;
                      promptString += `- ${category}: ${names.join(', ')}\n`;
                    }
                  }
                  if (hasSubcategories) subcategoryContext = promptString;
                }

                const schema = {
                  type: Type.OBJECT,
                  properties: {
                    amount: { type: Type.NUMBER, description: 'The transaction amount as a positive number.' },
                    category: { type: Type.STRING, description: "The main category. Must be one of: 'Income', 'Expenses', 'Bills', 'Debts', 'Savings'." },
                    subcategory: { type: Type.STRING, description: "A specific, concise subcategory for the transaction (e.g., 'Groceries', 'Paycheck', 'Rent'). If a suitable existing subcategory is provided, use it. Otherwise, create a new, relevant one." },
                    note: { type: Type.STRING, description: "Any additional details or the original merchant name (e.g., 'Chipotle lunch')." },
                  },
                  required: ['amount', 'category', 'subcategory', 'note'],
                } as const;

                const result = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: `Parse the following transaction. Your primary goal is to categorize it into an existing subcategory if one is a good match. Only create a new subcategory if none of the existing ones are suitable. For income, use the 'Income' category. For spending, decide if it's a general 'Expense', a recurring 'Bill', a payment towards 'Debt', or putting money into 'Savings'. ${subcategoryContext} Today\'s date is ${new Date().toISOString().split('T')[0]}. Transaction: "${text}"`,
                  config: { responseMimeType: 'application/json', responseSchema: schema },
                });

                const maybeText: any = (result && (result as any).text) || ((result as any)?.response?.text);
                const raw = typeof maybeText === 'function' ? await maybeText() : String(maybeText || '').trim();

                let parsed: any;
                try {
                  parsed = JSON.parse(raw);
                } catch (e) {
                  const match = raw.match(/\{[\s\S]*\}/);
                  if (match) parsed = JSON.parse(match[0]);
                  else throw e;
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(parsed));
              } catch (err) {
                console.error('Dev API /api/parse-transaction error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Failed to parse transaction' }));
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
    };
});
