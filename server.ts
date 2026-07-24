import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Allow large payloads for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize the Google Gemini GenAI Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  console.log('Gemini API client initialized successfully.');
} else {
  console.warn('GEMINI_API_KEY is not defined. AI diagnostics will run in simulation fallback mode.');
}

// REST API endpoint for diagnostic analysis
app.post('/api/diagnose', async (req, res) => {
  try {
    const { image, symptoms, anatomy, cropStage, severity } = req.body;

    // Check if Gemini API is available, otherwise fallback to high-quality mockup simulation
    if (!ai) {
      console.log('Running simulation fallback diagnosis (no API key present)...');
      return runFallbackSimulation(symptoms, anatomy, res);
    }

    const parts: any[] = [];

    // Formulate a robust professional prompt for the agronomist model
    const textPrompt = `You are an elite, highly specialized wheat pathologist and agronomist. 
Analyze the following specimen characteristics and provide a highly accurate diagnostic report.

Input specimen metadata:
- Selected Plant Organs: ${anatomy ? anatomy.join(', ') : 'Not specified'}
- Key Symptoms Highlighted: ${symptoms ? symptoms.join(', ') : 'None specified'}
- Crop Growth Stage: ${cropStage || 'Not specified'}
- Estimated Severity Field Indicator: ${severity || 'Medium'}

Provide a strict, professional agricultural diagnostic evaluation in the requested JSON structure.`;

    parts.push({ text: textPrompt });

    if (image) {
      // Expect base64 image data
      // Stripping data URL prefix if exists
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data,
        },
      });
    }

    console.log('Sending request to Gemini 3.5 Flash...');
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts },
      config: {
        systemInstruction: `You are an AI-powered diagnostic system for wheat pathology. 
Always return a structured JSON report matching the requested schema. 
If the specimen appears to be healthy or the description contains no signs of diseases, return "healthy" for diseaseId and a positive assessment.
Do not include any conversational filler, markdown formatting (no \`\`\`json wrappers), or extra text outside of the JSON block.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diseaseId: {
              type: Type.STRING,
              description: "The matching disease identifier from our catalog: 'stem_rust', 'stripe_rust', 'powdery_mildew', 'septoria_tritici', 'leaf_rust', or 'healthy'."
            },
            diseaseName: {
              type: Type.STRING,
              description: "Common name of the wheat disease (e.g., 'Stem Rust' or 'Healthy Specimen')."
            },
            scientificName: {
              type: Type.STRING,
              description: "Scientific name of the pathogen or 'Triticum aestivum' if healthy."
            },
            pathogenType: {
              type: Type.STRING,
              description: "Type of pathogen: 'fungal', 'viral', 'bacterial', or 'none'."
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence percentage of the diagnosis (0 to 100)."
            },
            severity: {
              type: Type.STRING,
              description: "Estimated field severity: 'Low', 'Medium', or 'High'."
            },
            epidemiologicalProfile: {
              type: Type.STRING,
              description: "A highly concise summary of how this pathogen behaves and spreads."
            },
            symptomaticKeys: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Symptomatic keys identified in the specimen."
            },
            treatment: {
              type: Type.OBJECT,
              properties: {
                immediate: { type: Type.STRING, description: "Actionable immediate steps to isolate or control the spread." },
                chemical: { type: Type.STRING, description: "Chemical pesticide/fungicide controls or 'None' if healthy." },
                organic: { type: Type.STRING, description: "Organic or biological alternative controls." },
                preventive: { type: Type.STRING, description: "Agronomic preventative measures for next planting cycle." }
              },
              required: ["immediate", "chemical", "organic", "preventive"]
            }
          },
          required: [
            "diseaseId",
            "diseaseName",
            "scientificName",
            "pathogenType",
            "confidence",
            "severity",
            "epidemiologicalProfile",
            "symptomaticKeys",
            "treatment"
          ]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    console.log('Successfully received response from Gemini:', responseText);
    const parsedData = JSON.parse(responseText.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error('AI Diagnosis Error:', error);
    return res.status(500).json({
      error: 'Failed to complete AI diagnostic request.',
      details: error.message || error
    });
  }
});

// REST API endpoint for fetching treatment protocol for a specific disease
app.post('/api/treatment-protocol', async (req, res) => {
  try {
    const { diseaseLabel } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'AI service not initialized' });
    }

    const textPrompt = `You are a wheat agronomy expert. Provide a detailed, actionable treatment protocol for the disease: "${diseaseLabel}". 
Include specific immediate, chemical, organic, and preventive measures.
Return the result in JSON format:
{
  "disease": "${diseaseLabel}",
  "immediate": "...",
  "chemical": "...",
  "organic": "...",
  "preventive": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [{ text: textPrompt }] },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    return res.json(JSON.parse(responseText.trim()));

  } catch (error: any) {
    console.error('Treatment Protocol Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch treatment protocol.',
      details: error.message || error
    });
  }
});

// REST API endpoint for fetching daily agronomic tip
app.get('/api/crop-health-tip', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'AI service not initialized' });
    }

    const textPrompt = `You are a wheat agronomy expert. Provide a concise, actionable 'Crop Health Tip' for the current wheat growth stage (assume it's mid-season).
Include a brief, practical recommendation for farmers in JSON format:
{
  "title": "...",
  "tip": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [{ text: textPrompt }] },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    return res.json(JSON.parse(responseText.trim()));

  } catch (error: any) {
    console.error('Crop Health Tip Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch crop health tip.',
      details: error.message || error
    });
  }
});

// Fallback high-quality simulation if GEMINI_API_KEY is not defined
function runFallbackSimulation(symptoms: string[] = [], anatomy: string[] = [], res: express.Response) {
  // Simple heuristic algorithm based on symptoms and anatomy
  const isLeaves = anatomy.includes('leaves') || anatomy.includes('foliage');
  const isStem = anatomy.includes('stem') || anatomy.includes('stalk');
  const isHeads = anatomy.includes('heads') || anatomy.includes('ears') || anatomy.includes('grain');

  let diseaseId = 'healthy';
  let diseaseName = 'Healthy Crop Specimen';
  let scientificName = 'Triticum aestivum';
  let pathogenType = 'none';
  let confidence = 98;
  let severity = 'Low';
  let epidemiologicalProfile = 'The wheat plant exhibits optimal chlorophyllic activity and normal structural growth with no symptomatic key markers for severe infection.';
  let symptomaticKeys = ['Optimal green pigmentation', 'Robust stomatal architecture', 'No necrotic pustules'];
  let treatment = {
    immediate: 'No urgent interventions required. Continue standard nitrogen management.',
    chemical: 'None required.',
    organic: 'Apply organic compost teas to reinforce standard root biome health.',
    preventive: 'Maintain rigorous crop rotation cycles with non-gramineous plants.'
  };

  if (symptoms.includes('powdery_spots') || symptoms.includes('white_pustules')) {
    diseaseId = 'powdery_mildew';
    diseaseName = 'Powdery Mildew';
    scientificName = 'Blumeria graminis f. sp. tritici';
    pathogenType = 'fungal';
    confidence = 88;
    severity = 'Medium';
    epidemiologicalProfile = 'Powdery mildew is a common fungal disease that flourishes in high humidity and moderate temperatures, severely limiting photosynthetic efficiency.';
    symptomaticKeys = ['White powdery patches on leaf surfaces', 'Premature senescence of lower foliage'];
    treatment = {
      immediate: 'Isolate affected field vectors and optimize row spacing to maximize airflow.',
      chemical: 'Apply systemic triazole or strobilurin fungicides if severity indexes exceed 15%.',
      organic: 'Foliar application of diluted potassium bicarbonate or sulfur sprays.',
      preventive: 'Plant certified powdery mildew-resistant cultivars and manage nitrogen fertilization rates.'
    };
  } else if (isStem && (symptoms.includes('brick_red_pustules') || symptoms.includes('stem_rust'))) {
    diseaseId = 'stem_rust';
    diseaseName = 'Stem Rust';
    scientificName = 'Puccinia graminis f. sp. tritici';
    pathogenType = 'fungal';
    confidence = 94;
    severity = 'High';
    epidemiologicalProfile = 'Stem rust is an extremely destructive fungal disease capable of turning a healthy crop into a tangled mass of broken stems just weeks before harvest.';
    symptomaticKeys = ['Brick-red elongated pustules on stems', 'Ruptured epidermal plant layers'];
    treatment = {
      immediate: 'Initiate chemical perimeter barrier controls immediately to stop spore transport.',
      chemical: 'Apply demethylation inhibitors (DMIs) or strobilurins immediately.',
      organic: 'None highly effective for active breakouts; rogue out highly infected specimens.',
      preventive: 'Eradicate barberry bushes (alternate host) and grow highly resistant wheat strains.'
    };
  } else if (isLeaves && (symptoms.includes('stripe_rust') || symptoms.includes('yellow_stripe'))) {
    diseaseId = 'stripe_rust';
    diseaseName = 'Stripe Rust (Yellow Rust)';
    scientificName = 'Puccinia striiformis f. sp. tritici';
    pathogenType = 'fungal';
    confidence = 92;
    severity = 'High';
    epidemiologicalProfile = 'Stripe rust thrives in cool, moist seasons. It forms bright yellow-orange linear pustules along leaf veins, reducing grain fill weight.';
    symptomaticKeys = ['Yellow-orange pustules arranged in linear stripes', 'Chlorotic margins along leaves'];
    treatment = {
      immediate: 'Monitor local disease forecasts and evaluate field severity indices.',
      chemical: 'Apply triazole or strobilurin fungicides at early flag leaf stage.',
      organic: 'Apply neem oil or copper-based natural compounds as early protectants.',
      preventive: 'Select cultivars with high adult plant resistance (APR) and rotate crops yearly.'
    };
  } else if (isLeaves && (symptoms.includes('septoria') || symptoms.includes('brown_spots'))) {
    diseaseId = 'septoria_tritici';
    diseaseName = 'Septoria Tritici Blotch';
    scientificName = 'Zymoseptoria tritici';
    pathogenType = 'fungal';
    confidence = 89;
    severity = 'Medium';
    epidemiologicalProfile = 'Septoria blotch is spread primarily by rain-splashed spores. It causes necrotic tan lesions speckled with tiny black fruiting bodies (pycnidia).';
    symptomaticKeys = ['Tan, rectangular lesions on lower leaves', 'Tiny black pycnidia dots inside leaf lesions'];
    treatment = {
      immediate: 'Avoid overhead irrigation cycles that contribute to leaf canopy wetness.',
      chemical: 'Apply mixed triazole/SDHI fungicides prior to key heading stages.',
      organic: 'Foliar spray of biological antagonists like Bacillus subtilis strains.',
      preventive: 'Incorporate infected wheat straw residues deeply into the soil and practice 2-year crop rotations.'
    };
  }

  return res.json({
    diseaseId,
    diseaseName,
    scientificName,
    pathogenType,
    confidence,
    severity,
    epidemiologicalProfile,
    symptomaticKeys,
    treatment
  });
}

// Serve static assets in production from built Angular app directory
const possibleDistPaths = [
  path.join(__dirname, 'dist/browser'),
  // path.join(__dirname, 'dist/aerowheat/browser'),
  // path.join(__dirname, 'dist'),
];

let distPath = '';
for (const p of possibleDistPaths) {
  if (express.static(p)) {
    distPath = p;
    // Keep checking to find the most accurate one later or stop here
  }
}
// We will default serve the static files from the resolved path
app.use(express.static(distPath || path.join(__dirname, 'dist')));

app.get('*', (req, res, next) => {
  // If it's an API route, do not serve index.html, let it 404
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath || path.join(__dirname, 'dist'), 'index.html'));
});

// Use port 3001 for development, port 3000 for production container deployment
const PORT = process.env.NODE_ENV === 'production' ? 3000 : 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express full-stack backend running on port ${PORT} (Mode: ${process.env.NODE_ENV || 'development'})`);
});
