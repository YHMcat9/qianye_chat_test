// api/chat.js
// Vercel Serverless Function，用于代理请求到 Dify API
const https = require('https');

const DIFY_API_KEY = process.env.DIFY_API_KEY; // 部署时设置环境变量
const DIFY_HOST = 'api.dify.ai';
const DIFY_PATH = '/v1/chat-messages';

export default function handler(req, res) {
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const postData = JSON.stringify(req.body);

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

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => { data += chunk; });
        proxyRes.on('end', () => {
            try {
                res.status(proxyRes.statusCode).json(JSON.parse(data));
            } catch (e) {
                res.status(500).json({ error: 'Dify 返回非 JSON', raw: data });
            }
        });
    });

    proxyReq.on('error', (err) => {
        res.status(500).json({ error: err.message });
    });

    proxyReq.write(postData);
    proxyReq.end();
}