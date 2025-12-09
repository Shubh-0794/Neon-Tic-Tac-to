import { GoogleGenAI } from "@google/genai";
import { SquareValue } from "../types";

// Helper to determine available moves
const getAvailableMoves = (squares: SquareValue[]): number[] => {
  return squares.map((val, idx) => (val === null ? idx : -1)).filter((idx) => idx !== -1);
};

export const getBestMove = async (squares: SquareValue[]): Promise<number> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided, falling back to random move.");
    const available = getAvailableMoves(squares);
    return available[Math.floor(Math.random() * available.length)];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construct a visual representation for the model
  const boardStr = squares
    .map((s, i) => {
      const val = s || i.toString();
      return (i + 1) % 3 === 0 ? ` ${val} \n` : ` ${val} |`;
    })
    .join(squares.length === 9 ? '' : '---'); // Simplified join logic

  const prompt = `
    You are playing Tic-Tac-Toe. You are Player 'O'. 
    The current board state is represented below (0-8 indices).
    Cells occupied by 'X' or 'O' are marked. Empty cells show their index number (0-8).
    
    ${squares.map((s, i) => s === null ? i : s).join(',')}

    Task: Return ONLY the integer index (0-8) of the best possible move to win or block the opponent.
    Do not explain. Just the number.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 10,
        temperature: 0.2, // Low temperature for deterministic logic
      },
    });

    const text = response.text?.trim();
    const moveIndex = parseInt(text || '', 10);

    if (!isNaN(moveIndex) && squares[moveIndex] === null) {
      return moveIndex;
    } else {
      console.warn("Gemini returned invalid move:", text);
      const available = getAvailableMoves(squares);
      return available[Math.floor(Math.random() * available.length)];
    }
  } catch (error) {
    console.error("Gemini AI Error:", error);
    const available = getAvailableMoves(squares);
    return available[Math.floor(Math.random() * available.length)];
  }
};
