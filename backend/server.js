require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

const ajv = new Ajv();
addFormats(ajv);

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load registries
const serviceRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/service-registry.json'), 'utf8'));
const schemaRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/schema-registry.json'), 'utf8'));

// Helper to load schema file
function loadSchema(schemaPath) {
    const fullPath = path.join(__dirname, '..', schemaPath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

// endpoints
app.get('/api/services', (req, res) => {
    res.json(serviceRegistry);
});

app.get('/api/schemas', (req, res) => {
    res.json(schemaRegistry);
});

const HISTORY_FILE = path.join(__dirname, 'data/history.json');

// Ensure history file exists
if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
}

function saveHistory(entry) {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    history.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...entry
    });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

async function parseWithGemini(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
You are a 'Prompt-to-JSON' router. Your task is to analyze the user's input and convert it into a structured JSON payload based on the available services.

Available Services:
1. bus.arrival.alert: For bus arrival information. Needs 'bus_number' and 'station_name'.
2. receipt.scan.record: For recording receipts/spending. Needs 'items' (list of {item, price}) and 'total_amount'.
3. english.expression.check: For checking or correcting English sentences. Needs 'text'.

JSON Schema Definitions are available for each service.

Your output must be a valid JSON object with the following structure:
{
    "service_key": "string", // service key from the registry
    "status": "ready" | "clarify" | "unsupported", 
    "payload": { ... }, // the structured data matching the service's schema
    "missing_slots": ["string"], // list of required fields missing from the input
    "message": "string" // a friendly response to the user
}

If the user's intent matches a service but information is missing, set status to "clarify" and list the missing fields.
If the intent is unclear, set status to "unsupported".

User Input: "${prompt}"
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    // Clean potential markdown code blocks from the response
    const jsonString = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonString);
}


// endpoints
app.get('/api/history', (req, res) => {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    res.json(history);
});

app.post('/api/parse', async (req, res) => {
    const { prompt } = req.body;

    try {
        const geminiResult = await parseWithGemini(prompt);

        const result = {
            prompt,
            ...geminiResult,
            schema_version: 1,
            domain: geminiResult.service_key ? (geminiResult.service_key === 'bus.arrival.alert' ? 'transportation' : (geminiResult.service_key === 'receipt.scan.record' ? 'finance' : 'education')) : null
        };

        saveHistory(result);
        res.json(result);
    } catch (error) {
        console.error("Gemini Parsing Error:", error);
        res.status(500).json({ error: "Failed to parse input with Gemini" });
    }
});


app.post('/api/validate', (req, res) => {
    const { payload } = req.body;
    const { service_key, schema_version } = payload;

    const schemaMeta = schemaRegistry.find(s => s.service_key === service_key && s.schema_version === schema_version);

    if (!schemaMeta) {
        return res.status(400).json({ valid: false, error: "Schema not found" });
    }

    try {
        const schema = loadSchema(schemaMeta.schema_file);
        const validate = ajv.compile(schema);
        const valid = validate(payload);

        res.json({
            valid: valid,
            errors: validate.errors
        });
    } catch (err) {
        res.status(500).json({ valid: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Prompt-to-JSON Studio Backend running on port ${PORT}`);
});
