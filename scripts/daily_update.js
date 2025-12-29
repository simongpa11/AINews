const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
require('dotenv').config({ path: '.env.local' })

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = '7QQzpAyzlKTVrRzQJmTE'

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY || !ELEVENLABS_API_KEY) {
    console.error('Missing API Keys in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function uploadToSupabase(buffer, filename, contentType) {
    const { data, error } = await supabase.storage
        .from('media')
        .upload(filename, buffer, {
            contentType: contentType,
            upsert: true
        })

    if (error) {
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
                  REGLAS CRÍTICAS DE CONTENIDO:
                  1. El texto total NO debe exceder las 10 líneas.
                  2. NO dupliques la 'Acción recomendada' dentro del cuerpo del resumen. Ponla SOLO al final precedida de 'Acción recomendada:'.
                  3. La 'Acción recomendada' debe ser una sola frase de acción pura, sin incluir la prioridad ni la fuente dentro de esa misma frase.
                  4. La 'Prioridad' y la 'Fuente' deben ir en sus propias líneas al final de todo.
                  5. REGLA DE ORO PARA FUENTES: Debes incluir la URL real de la noticia original (ej: TechCrunch, Reuters, blog oficial). NUNCA pongas 'OpenAI' o 'ChatGPT' como fuente. Si no tienes la URL exacta, busca la fuente primaria más probable.
                - 'relevance_score': Un número del 1 al 10 basado en la prioridad (LOW=3, MED=6, HIGH=9, ALERT=10).
                
                ${extraInstructions}`
            },
            {
                role: "user",
                content: `PROMPT — Informe diario LLM & Enterprise AI (UE-focused)`
            }
        ],
        model: "gpt-4-turbo-preview",
        response_format: { type: "json_object" }
    })

    const response = JSON.parse(completion.choices[0].message.content)
    let newsItems = response.news_items || []

    // Sort news items by relevance_score (Priority) descending: ALERT(10) > HIGH(9) > MED(6) > LOW(3)
    newsItems.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))

    console.log(`Found ${newsItems.length} news items.`)

    // 2. Generate Podcast Script and Audio
    console.log('Generating Podcast Script...')
    const podcastPrompt = `Eres un locutor de podcast profesional, carismático y técnico. 
    Tu tarea es redactar un guion breve (máx 2 minutos) resumiendo las noticias de hoy de forma fluida.
    
    NOTICIAS DE HOY:
    ${newsItems.map((n, i) => `Noticia ${i + 1}: ${n.title}. Contenido: ${n.summary}`).join('\n\n')}
    
    INSTRUCCIONES:
    - Empieza con una intro enérgica: "¡Bienvenidos a Noticias IA Diarias! Soy Dani y estas son las claves tecnológicas de hoy..."
    - Conecta las noticias de forma natural.
    - Menciona por qué cada noticia es crítica para la empresa.
    - Despídete invitando a leer el periódico completo.
    - Devuelve SOLO el texto del guion, sin etiquetas de locución.`

    const podcastCompletion = await openai.chat.completions.create({
        messages: [{ role: "user", content: podcastPrompt }],
        model: "gpt-4-turbo-preview",
    })

    const podcastScript = podcastCompletion.choices[0].message.content
    const podcastAudioBuffer = await generateAudio(podcastScript)

    let podcastUrl = null
    if (podcastAudioBuffer) {
        const podcastFilename = `podcast_${Date.now()}.mp3`
        podcastUrl = await uploadToSupabase(podcastAudioBuffer, podcastFilename, 'audio/mpeg')
        console.log('Podcast generated:', podcastUrl)
    }

    // 3. Process individual news items
    for (const item of newsItems) {
        console.log('Processing:', item.title)

        // Generate Image
        console.log('Generating image...')
        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Imagen editorial técnica y profesional para: "${item.title}". Estilo corporativo, minimalista, colores azul #01A7E7 y #002E7D, alta resolución.`,
            n: 1,
            size: "1024x1024",
        })
        const imageUrlTemp = imageResponse.data[0].url
        const imageBuffer = await fetch(imageUrlTemp).then(res => res.arrayBuffer()).then(Buffer.from)
        const imageFileName = `news-image-${Date.now()}.png`
        const publicImageUrl = await uploadToSupabase(imageBuffer, imageFileName, 'image/png')

        // Generate individual Audio
        const audioBuffer = await generateAudio(item.summary)
        let publicAudioUrl = null
        if (audioBuffer) {
            const audioFileName = `news-audio-${Date.now()}.mp3`
            publicAudioUrl = await uploadToSupabase(audioBuffer, audioFileName, 'audio/mpeg')
        }

        // Insert into DB
        await supabase.from('news').insert({
            title: item.title,
            summary: item.summary,
            content: item.summary,
            image_url: publicImageUrl,
            audio_url: publicAudioUrl,
            relevance_score: item.relevance_score || 7,
            original_url: item.source || 'https://news.google.com'
        })
    }

    // 4. Save podcast metadata
    if (podcastUrl) {
        const { error: metaError } = await supabase.from('daily_metadata').insert({
            date: new Date().toISOString().split('T')[0],
            podcast_url: podcastUrl,
            podcast_script: podcastScript
        })
        if (metaError) {
            console.error('Error saving podcast metadata:', metaError)
        } else {
            console.log('Daily podcast metadata saved.')
        }
    }

    // 5. Cleanup: Delete news and metadata older than 7 days
    console.log('Cleaning up old news...')
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { error: cleanupNewsError } = await supabase
        .from('news')
        .delete()
        .lt('created_at', sevenDaysAgo)

    const { error: cleanupMetaError } = await supabase
        .from('daily_metadata')
        .delete()
        .lt('date', sevenDaysAgo)

    if (cleanupNewsError || cleanupMetaError) {
        console.error('Error during cleanup:', cleanupNewsError || cleanupMetaError)
    } else {
        console.log('Cleanup completed.')
    }

    console.log('Daily update completed successfully!')
}

main()
