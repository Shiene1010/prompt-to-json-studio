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

// endpoints
app.get('/api/history', (req, res) => {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    res.json(history);
});

app.post('/api/parse', (req, res) => {
    const { prompt } = req.body;

    // Simple rule-based mock for initial testing
    let service_key = null;
    let status = "unsupported";
    let slots = {};
    let message = "I didn't understand that.";

    if (prompt.includes("버스") || prompt.includes("bus")) {
        service_key = "bus.arrival.alert";
        status = "ready";
        slots = { bus_number: "30", station_name: "신갈오거리" };
        message = "Bus alert found.";
    } else if (prompt.includes("영수증") || prompt.includes("가계부") || prompt.includes("receipt")) {
        service_key = "receipt.scan.record";
        status = "ready";
        slots = { items: [{ name: "Coffee", price: 5000 }], total_amount: 5000 };
        message = "Receipt record found.";
    } else if (prompt.includes("영어") || prompt.includes("English")) {
        service_key = "english.expression.check";
        status = "ready";
        slots = { text: "I would have helped you" };
        message = "English expression found.";
    }

    const result = {
        prompt,
        service_key,
        schema_version: 1,
        domain: service_key ? (service_key === 'bus.arrival.alert' ? 'transportation' : (service_key === 'receipt.scan.record' ? 'finance' : 'education')) : null,
        status,
        slots,
        missing_slots: [],
        message
    };

    saveHistory(result);
    res.json(result);
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
