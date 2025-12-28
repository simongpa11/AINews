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

    // 1. Generate Summary with OpenAI
    console.log('Generating summary with OpenAI...')
    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: "Eres un experto periodista de tecnología especializado en Inteligencia Artificial." },
            { role: "user", content: "Genera un resumen de las noticias más importantes sobre Inteligencia Artificial de las últimas 24 horas. El formato debe ser un JSON con dos campos: 'title' (un titular llamativo en español) y 'summary' (un resumen de 2-3 párrafos en español, conciso y directo, ideal para ser leído en voz alta). Enfócate en lanzamientos de modelos, regulaciones y avances técnicos." }
        ],
        model: "gpt-4-turbo-preview",
        response_format: { type: "json_object" }
    })

    const content = JSON.parse(completion.choices[0].message.content)
    console.log('Title:', content.title)
    console.log('Summary:', content.summary)

    // 2. Generate Image (Using DALL-E 3 as we have the key, fallback for Nano Banana)
    console.log('Generating image with DALL-E 3...')
    const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Una imagen editorial moderna y minimalista sobre inteligencia artificial para la noticia: "${content.title}". Estilo abstracto, tecnológico, colores vibrantes, alta calidad, 4k.`,
        n: 1,
        size: "1024x1024",
    })
    const imageUrlTemp = imageResponse.data[0].url

    // Download and upload image
    const imageBuffer = await fetch(imageUrlTemp).then(res => res.arrayBuffer()).then(Buffer.from)
    const imageFileName = `news-image-${Date.now()}.png`
    const publicImageUrl = await uploadToSupabase(imageBuffer, imageFileName, 'image/png')

    // 3. Generate Audio
    const audioBuffer = await generateAudio(content.summary)
    let publicAudioUrl = null
    if (audioBuffer) {
        const audioFileName = `news-audio-${Date.now()}.mp3`
        publicAudioUrl = await uploadToSupabase(audioBuffer, audioFileName, 'audio/mpeg')
    }

    // 4. Insert into DB
    console.log('Inserting into database...')
    const { data, error } = await supabase
        .from('news')
        .insert({
            title: content.title,
            summary: content.summary,
            content: content.summary,
            image_url: publicImageUrl || imageUrlTemp, // Fallback to temp url if upload fails
            audio_url: publicAudioUrl,
            relevance_score: 9, // Default high score for daily summary
            original_url: 'https://openai.com' // Placeholder
        })
        .select()

    if (error) {
        console.error('Error inserting news:', error)
    } else {
        console.log('Success! News inserted:', data[0].title)
    }
}

main()
