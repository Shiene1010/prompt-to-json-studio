require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

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
app.get('/', (req, res) => {
    res.send('Prompt-to-JSON Studio API Server is running. Please access the API endpoints (e.g., /api/services) or visit the separate frontend URL for the UI.');
});

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
    "slots": { ... }, // the structured data matching the service's schema
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

// Improved rule-based parser as a fallback
function parseWithRules(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // 1. Bus Arrival Alert
    const busMatch = prompt.match(/(\d+)\s*번\s*버스/);
    const stationMatch = prompt.match(/([가-힣]+(?:역|정류장|오거리|거리|앞|교차로))/);

    if (busMatch || (prompt.includes("버스") && prompt.includes("언제"))) {
        const bus_number = busMatch ? busMatch[1] : null;
        const station_name = stationMatch ? stationMatch[1] : null;
        const ready = bus_number && station_name;

        return {
            service_key: "bus.arrival.alert",
            status: ready ? "ready" : "clarify",
            slots: { bus_number, station_name },
            missing_slots: ready ? [] : (!bus_number ? ["bus_number"] : ["station_name"]),
            message: ready ? `Searching for bus ${bus_number} at ${station_name}.` : "Which bus or station are you looking for?"
        };
    }

    // 2. Receipt Scan Record
    const priceMatch = prompt.match(/(\d+(?:,\d+)?)\s*원/);
    if (prompt.includes("원") || prompt.includes("결제") || prompt.includes("가계부") || prompt.includes("영수증")) {
        const amount = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
        return {
            service_key: "receipt.scan.record",
            status: amount > 0 ? "ready" : "clarify",
            slots: {
                items: [{ name: "Unknown Item", price: amount }],
                total_amount: amount
            },
            missing_slots: amount > 0 ? [] : ["total_amount"],
            message: amount > 0 ? `Recorded spending of ${amount} won.` : "How much did you spend?"
        };
    }

    // 3. English Expression Check
    if (/[a-zA-Z]/.test(prompt)) {
        return {
            service_key: "english.expression.check",
            status: "ready",
            slots: {
                text: prompt.trim()
            },
            missing_slots: [],
            message: "Analyzing English expression."
        };
    }

    return {
        service_key: null,
        status: "unsupported",
        slots: {},
        missing_slots: [],
        message: "I couldn't identify the service. Try something like '30번 버스 언제 와?' or '커피 5000원 결제'."
    };
}

app.post('/api/parse', async (req, res) => {
    const { prompt } = req.body;

    try {
        let geminiResult;

        // Use Gemini if key is provided and valid
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
            try {
                geminiResult = await parseWithGemini(prompt);
            } catch (err) {
                console.warn("Gemini failing, falling back to rules:", err.message);
                geminiResult = parseWithRules(prompt);
            }
        } else {
            // Fallback to rules if no key
            geminiResult = parseWithRules(prompt);
        }

        const result = {
            prompt,
            ...geminiResult,
            schema_version: 1,
            domain: geminiResult.service_key ? (geminiResult.service_key === 'bus.arrival.alert' ? 'transportation' : (geminiResult.service_key === 'receipt.scan.record' ? 'finance' : 'education')) : null
        };

        saveHistory(result);
        res.json(result);
    } catch (error) {
        console.error("Critical Parsing Error:", error);
        res.status(500).json({ error: "System error during parsing" });
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
