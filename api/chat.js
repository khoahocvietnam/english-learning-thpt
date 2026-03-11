export default async function handler(req, res) {
    // Cấu hình CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, context } = req.body;
        
        // Lấy API key từ biến môi trường
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Tạo prompt phù hợp với học sinh THPT
        const prompt = `Bạn là trợ lý học tiếng Anh cho học sinh THPT Việt Nam (lớp ${context?.grade || '10'}). 
        Học sinh đang học sách giáo khoa "Kết nối tri thức" (Global Success).
        
        Nhiệm vụ của bạn:
        1. Sửa lỗi ngữ pháp, từ vựng trong câu tiếng Anh
        2. Giải thích bài tập
        3. Hướng dẫn cách viết câu, đoạn văn
        4. Trả lời câu hỏi về bài học
        
        Yêu cầu:
        - Trả lời bằng tiếng Việt, giải thích dễ hiểu
        - Nếu học sinh viết tiếng Anh sai, hãy sửa và giải thích lỗi
        - Đưa ra ví dụ cụ thể
        - Khuyến khích học sinh học tập
        
        Tin nhắn của học sinh: ${message}`;

        // Gọi Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            res.status(200).json({ 
                reply: data.candidates[0].content.parts[0].text 
            });
        } else {
            res.status(500).json({ error: 'Invalid response from AI' });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
