import * as http from "http";
import * as https from "https";


export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
}

export class OllamaClient {
    private baseUrl: string;

    constructor(baseUrl: string = "http://localhost:11434") {
        this.baseUrl = baseUrl;
    }

    async listModels(): Promise<OllamaModel[]> {
        const data = await this.request("GET", "/api/tags");
        const models: OllamaModel[] = data.models || [];
        return models.filter(model => !this.isEmbeddingModel(model.name));
    }


    // methods to filter out non-llm models
    private readonly EMBEDDING_KEYWORDS = [
        'embed',
        'minilm',
        'e5-',
        'bge-',
        'nomic',
        'all-minilm',
    ];
    private isEmbeddingModel(modelName: string): boolean {
        const name = modelName.toLowerCase();
        return this.EMBEDDING_KEYWORDS.some(keyword => name.includes(keyword));
    }
    //

    private request(method: string, path: string, body?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseUrl + path);
            const isHttps = url.protocol === "https:";
            const transport = isHttps ? https : http;

            const options: http.RequestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
                },
                timeout: 60000,
            };

            const req = transport.request(options, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
                    }
                });
            });

            req.on("error", reject);
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Request timed out. Is Ollama running?"));
            });

            if (body) {
                req.write(body);
            }
            req.end();
        });
    }


}