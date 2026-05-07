// api/chat.js
export default async function handler(req, res) {
    // 1. 设置 CORS 头 —— 允许任何来源（适合演示）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    // 2. 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const DIFY_API_KEY = process.env.DIFY_API_KEY;
    const DIFY_HOST = 'api.dify.ai';
    const DIFY_PATH = '/v1/chat-messages';

    const postData = JSON.stringify(req.body);

    const https = require('https');
    const options = {
        hostname: DIFY_HOST,
        path: DIFY_PATH,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DIFY_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    try {
        const difyResponse = await new Promise((resolve, reject) => {
            const proxyReq = https.request(options, (proxyRes) => {
                let data = '';
                proxyRes.on('data', (chunk) => { data += chunk; });
                proxyRes.on('end', () => resolve({ statusCode: proxyRes.statusCode, data }));
            });
            proxyReq.on('error', reject);
            proxyReq.write(postData);
            proxyReq.end();
        });

        res.status(difyResponse.statusCode).json(JSON.parse(difyResponse.data));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}