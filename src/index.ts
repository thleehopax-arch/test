#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import express, { Response, Request } from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; // Removed McpServerConfig import
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
// Define a simple TestMcpServer directly in this file
const server = new McpServer({
  name: "mcp-test2",
  version: "1.0.0",
});
server.tool(
  "hollo-world",
  "hollo world",
  {
  },
  async () => {
    return {
            content:[
                {
                    type: "text",
                    text: "Hello, world!!"
                }
            ]
        }
});

const test_mcp_server = server;
let test_mcp_transport: SSEServerTransport;

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000; // 从环境变量获取端口，或使用默认值 3000

// 启用 CORS 和 JSON 解析
app.use(cors());
app.use(express.json());

// Utility functions for SSE and Message handling, adapted from mcp_web.ts
async function set_see(transport: SSEServerTransport, server: McpServer, res: Response){
    try {
        console.log('start sse!');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        await server.connect(transport);
            console.log('MCP 服务器已通过 SSE 连接');
        } 
    catch (error) {
        console.error('SSE 连接失败:', error);
        res.end();
    }
}

async function set_message(transport: SSEServerTransport, req: Request, res: Response){
    try {
        if (!transport) {
            return res.status(400).json({ error: 'SSE 尚未建立' });
        }
        console.log('📨 收到消息请求:', {
            method: req.method,
            headers: req.headers,
            body: req.body,
        });

        await transport.handleMessage(req.body);
        res.status(200).end();
    }
    catch (error) {
        console.error('處理訊息失敗:', error);
        res.status(500).json({ error: '處理訊息失敗' });
    }
}

// MCP Test Server SSE and Message routes
app.get('/mcp/test_mcp_sse', async (req, res) => {
  console.log('新的 Test MCP SSE 连接建立');
  test_mcp_transport = new SSEServerTransport('/mcp/test_mcp_message', res);
  set_see(test_mcp_transport, test_mcp_server, res);
});

app.post('/mcp/test_mcp_message', async (req, res) => {
  set_message(test_mcp_transport, req, res);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`MCP Test Server running on HTTP port ${PORT}`);
  console.log(`Test MCP SSE Endpoint: http://localhost:${PORT}/mcp/test_mcp_sse`);
  console.log(`Test MCP Message Endpoint: http://localhost:${PORT}/mcp/test_mcp_message`);
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
