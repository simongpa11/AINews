const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
// CRITICAL: Use the SERVICE_ROLE_KEY for the script to bypass RLS policies
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

// Voice ID for "Dani" (You might need to verify this ID via ElevenLabs API list)
// Using a common placeholder ID, but ideally we fetch it.
// Let's use a known ID or fetch the first one named "Dani".
const ELEVENLABS_VOICE_ID = '7QQzpAyzlKTVrRzQJmTE' // Updated to user requested voice

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY || !ELEVENLABS_API_KEY) {
    console.error('Missing API Keys in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function uploadToSupabase(buffer, filename, contentType) {
    const { data, error } = await supabase.storage
        .from('media') // Ensure this matches your bucket name exactly
        .upload(filename, buffer, {
            contentType: contentType,
            upsert: true
        })

    if (error) {
        // If bucket doesn't exist, we might fail here. 
        // Creating buckets via JS client requires service role usually.
        console.error('Error uploading to Supabase:', error)
        return null
    }

    const { data: publicData } = supabase.storage
        .from('media')
        .getPublicUrl(filename)

    return publicData.publicUrl
}

async function generateAudio(text) {
    console.log('Generating audio with ElevenLabs...')
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(`ElevenLabs API Error: ${response.status} ${response.statusText} - ${errorBody}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
    } catch (error) {
        console.error('Error generating audio:', error)
        return null
    }
}

async function main() {
    console.log('Starting daily update...')

    const isFriday = new Date().getDay() === 5
    const extraInstructions = isFriday ? "\nEXTRA (solo los viernes): Añade al final un Mini-dashboard semanal con: 5 puntos clave, Tendencias detectadas, Proveedores / tecnologías a vigilar la semana siguiente." : ""

    // 1. Generate Summary with OpenAI
    console.log('Generating summary with OpenAI...')
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `Eres un analista técnico senior especializado en IA enterprise, LLMs y cumplimiento regulatorio en la UE. 
                Tu tarea es buscar, filtrar y redactar un informe diario con las novedades más relevantes de las últimas 24–48 horas.
                
                REGLAS DE FORMATO:
                Debes devolver un objeto JSON con un campo 'news_items' que sea un array de objetos.
                Cada objeto en el array debe tener:
                - 'title': Máx 8 palabras, claro y técnico.
                - 'summary': El resumen factual + 'Por qué importa' + 'Acción recomendada' + 'Prioridad' + 'Fuente'. 
                  IMPORTANTE: El texto total del campo 'summary' NO debe exceder las 10 líneas de texto para asegurar que quepa en la pantalla.
                - 'relevance_score': Un número del 1 al 10 basado en la prioridad (LOW=3, MED=6, HIGH=9, ALERT=10).
                
                ${extraInstructions}`
            },
            {
                role: "user",
                content: `PROMPT — Informe diario LLM & Enterprise AI (UE-focused)

                ÁMBITO DE BÚSQUEDA (obligatorio):
                1. Modelos y plataformas LLM (Gemini, GPT, Anthropic, Mistral, etc.)
                2. Frameworks de agentes y automatización (ADK, multi-agent, orquestadores).
                3. Plataformas conversacionales y de voz enterprise (Dialogflow CX, Azure Bot, PolyAI, etc.)
                4. Generación multimodal (imagen / vídeo / audio).
                5. Seguridad, cumplimiento y gobernanza (GDPR / AI Act / UE).
                6. Partners e integradores.

                FUENTES: Blogs oficiales, comunicados UE, arXiv, medios tech reputados.

                FORMATO DE CADA NOTICIA:
                • Título
                • Resumen (1 línea factual)
                • Por qué importa para nosotros (1 línea)
                • Acción recomendada (1 frase imperativa)
                • Nivel de prioridad (LOW / MED / HIGH / ALERT)
                • Fuente (URL directa)

                FILTRADO: 3–8 items diarios. Estilo profesional, técnico, conciso, sin emojis.`
            }
        ],
        model: "gpt-4-turbo-preview",
        response_format: { type: "json_object" }
    })

    const response = JSON.parse(completion.choices[0].message.content)
    const newsItems = response.news_items || []

    console.log(`Found ${newsItems.news_items?.length || newsItems.length} news items.`)

    for (const item of newsItems) {
        console.log('Processing:', item.title)

        // 2. Generate Image (Using DALL-E 3)
        console.log('Generating image...')
        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Imagen editorial técnica y profesional para: "${item.title}". Estilo corporativo, minimalista, colores azul #01A7E7 y #002E7D, alta resolución.`,
            n: 1,
            size: "1024x1024",
        })
        const imageUrlTemp = imageResponse.data[0].url

        // Download and upload image
        const imageBuffer = await fetch(imageUrlTemp).then(res => res.arrayBuffer()).then(Buffer.from)
        const imageFileName = `news-image-${Date.now()}.png`
        const publicImageUrl = await uploadToSupabase(imageBuffer, imageFileName, 'image/png')

        // 3. Generate Audio
        const audioBuffer = await generateAudio(item.summary)
        let publicAudioUrl = null
        if (audioBuffer) {
            const audioFileName = `news-audio-${Date.now()}.mp3`
            publicAudioUrl = await uploadToSupabase(audioBuffer, audioFileName, 'audio/mpeg')
        }

        // 4. Insert into DB
        console.log('Inserting into database...')
        const { error } = await supabase
            .from('news')
            .insert({
                title: item.title,
                summary: item.summary,
                content: item.summary,
                image_url: publicImageUrl || imageUrlTemp,
                audio_url: publicAudioUrl,
                relevance_score: item.relevance_score || 7,
                original_url: item.source || 'https://openai.com'
            })

        if (error) {
            console.error('Error inserting news:', error)
        } else {
            console.log('Success! News inserted:', item.title)
        }
    }
}

main()
